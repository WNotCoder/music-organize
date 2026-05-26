import fs from 'fs';
import path from 'path';
import { scanDirectoryRepository } from '../repositories/scanDirectoryRepository';
import { artistRepository } from '../repositories/artistRepository';
import { albumRepository } from '../repositories/albumRepository';
import { songEntryRepository } from '../repositories/songEntryRepository';
import { songRepository } from '../repositories/songRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import { taskRepository } from '../repositories/taskRepository';
import { tagService, ParsedTag } from './tagService';
import { scrapeService, ScrapePreview } from './scrapeService';
import { organizeService } from './organizeService';
import { logger } from '../utils/logger';
import { Task } from '../types';

const MUSIC_EXTENSIONS = ['.mp3', '.flac', '.wav', '.aac', '.ogg'];

let currentScanTask: Task | null = null;
let isScanning = false;

export interface ScanPreviewItem {
  filePath: string;
  fileName: string;
  originalTags: ParsedTag;
  suggestedTags: ParsedTag;
  matchedSource: string;
  confidence: number;
  targetPath: string;
}

export interface ScanPreviewResult {
  items: ScanPreviewItem[];
  totalFiles: number;
  matchedCount: number;
  unmatchedCount: number;
  newFiles: number;
  existingFiles: number;
}

export const scanService = {
  async startScan(): Promise<{ success: boolean; message: string; taskId?: string }> {
    logger.scan('startScan called');
    
    if (isScanning) {
      logger.scan('Scan already running, rejecting request');
      return { success: false, message: '扫描任务正在进行中' };
    }

    const task = await taskRepository.create('scan');
    logger.task(`Created scan task with id: ${task.id}`);
    
    currentScanTask = task;
    isScanning = true;

    await taskRepository.updateStatus(task.id, 'running', 0, '开始扫描...');
    logger.scan('Scan task status updated to running');

    try {
      await this.executeScan(task.id);
      await taskRepository.updateStatus(task.id, 'completed', 100, '扫描完成');
      return { success: true, message: '扫描任务已启动', taskId: task.id };
    } catch (error) {
      logger.error('扫描任务失败:', error);
      await taskRepository.updateStatus(task.id, 'failed', 0, error instanceof Error ? error.message : '未知错误');
      return { success: false, message: '扫描任务失败', taskId: task.id };
    } finally {
      isScanning = false;
      currentScanTask = null;
    }
  },

  async executeScan(taskId: string): Promise<void> {
    logger.scan('executeScan started with taskId:', taskId);
    
    const directories = await scanDirectoryRepository.getAll();
    logger.scan(`Found ${directories.length} scan directories`);
    
    const settings = await settingsRepository.get();
    logger.debug('Loaded settings:', { 
      storagePath: settings.storagePath,
      coverArtEnabled: settings.coverArtEnabled,
      fileOrganizeMode: settings.fileOrganizeMode 
    });
    
    let totalFiles = 0;
    let processedFiles = 0;
    const musicFiles: string[] = [];

    for (const dir of directories) {
      logger.scan(`Scanning directory: ${dir.name} - ${dir.path}`);
      
      if (!fs.existsSync(dir.path)) {
        logger.warn(`扫描目录不存在: ${dir.path}`);
        continue;
      }
      
      const files = await this.scanDirectory(dir.path);
      logger.scan(`Found ${files.length} music files in ${dir.path}`);
      musicFiles.push(...files);
    }

    totalFiles = musicFiles.length;
    logger.scan(`Total music files to process: ${totalFiles}`);

    if (totalFiles === 0) {
      logger.scan('No music files found, scan completed');
      return;
    }

    for (const filePath of musicFiles) {
      if (!isScanning) {
        logger.scan('Scan stopped by user');
        break;
      }

      try {
        logger.debug(`Processing file: ${filePath}`);
        await this.processFile(filePath, settings);
        processedFiles++;
        
        const progress = Math.round((processedFiles / totalFiles) * 100);
        await taskRepository.updateStatus(taskId, 'running', progress, `正在处理: ${path.basename(filePath)}`);
        logger.scan(`Processed ${processedFiles}/${totalFiles} (${progress}%): ${path.basename(filePath)}`);
        
        await new Promise(resolve => setTimeout(resolve, 10));
      } catch (error: any) {
        logger.error(`处理文件失败 ${filePath}:`, { message: error.message, code: error.code, stack: error.stack });
      }
    }
    
    logger.scan(`executeScan completed. Processed ${processedFiles} of ${totalFiles} files`);
  },

  async scanDirectory(dirPath: string): Promise<string[]> {
    const result: string[] = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          result.push(...await this.scanDirectory(fullPath));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MUSIC_EXTENSIONS.includes(ext)) {
            result.push(fullPath);
          }
        }
      }
    } catch (error) {
      logger.warn(`无法读取目录 ${dirPath}:`, error);
    }
    
    return result;
  },

  async processFile(filePath: string, settings: Awaited<ReturnType<typeof settingsRepository['get']>>): Promise<void> {
    const existingFile = await songRepository.getByFilePath(filePath);
    if (existingFile) {
      logger.debug(`文件已存在: ${filePath}`);
      return;
    }

    let tags = await tagService.readTags(filePath);
    
    const fetched = await tagService.fetchFromMusicBrainz(tags.artist, tags.title);
    if (fetched) {
      tags = { ...tags, ...fetched };
    }

    let artist = await artistRepository.getByName(tags.artist);
    if (!artist) {
      artist = await artistRepository.create(tags.artist);
    }

    let album = await albumRepository.getByNameAndArtist(tags.album, artist.id);
    if (!album) {
      album = await albumRepository.create(tags.album, artist.id, tags.year || undefined);
    }

    const fileStats = fs.statSync(filePath);
    const targetPath = await organizeService.generateTargetPath(tags, filePath);
    
    const finalPath = await organizeService.organizeFile(filePath, targetPath, settings.fileOrganizeMode);

    let entry = await songEntryRepository.getByTitleArtistAlbum(tags.title, artist.id, album.id);
    
    if (entry) {
      await songEntryRepository.incrementFileCount(entry.id);
      logger.debug(`文件已存在，添加新版本: ${filePath}`);
    } else {
      entry = await songEntryRepository.create({
        title: tags.title,
        artistId: artist.id,
        albumId: album.id,
        trackNumber: tags.trackNumber,
        duration: Math.round(tags.duration),
        genre: tags.genre,
        year: tags.year,
      });
      logger.debug(`创建新歌曲条目: ${tags.title}`);
    }

    await songRepository.create({
      entryId: entry.id,
      filePath: finalPath,
      fileSize: fileStats.size,
      duration: Math.round(tags.duration),
    });

    if (settings.coverArtEnabled) {
      const coverArt = await tagService.downloadCoverArt(tags.artist, tags.album);
      if (coverArt) {
        const coverPath = await organizeService.saveCoverArt(tags.artist, tags.album, coverArt);
        if (coverPath && album.coverPath !== coverPath) {
          await albumRepository.update(album.id, { coverPath });
        }
      }
    }
  },

  async getScanStatus(): Promise<{ isRunning: boolean; progress: number; lastScanTime: string | null; scannedCount: number; organizedCount: number }> {
    const runningTasks = await taskRepository.getRunningTasks();
    const scanTask = runningTasks.find(t => t.type === 'scan');
    
    if (scanTask) {
      return {
        isRunning: true,
        progress: scanTask.progress,
        lastScanTime: null,
        scannedCount: 0,
        organizedCount: 0,
      };
    }

    const completedTasks = await taskRepository.getAll();
    const lastCompleted = completedTasks.find(t => t.type === 'scan' && t.status === 'completed');
    
    const stats = await songEntryRepository.getStats();
    
    return {
      isRunning: false,
      progress: 100,
      lastScanTime: lastCompleted?.completedAt || null,
      scannedCount: stats.entryCount,
      organizedCount: stats.fileCount,
    };
  },

  async stopScan(): Promise<boolean> {
    if (!isScanning || !currentScanTask) {
      return false;
    }

    isScanning = false;
    
    if (currentScanTask) {
      await taskRepository.updateStatus(currentScanTask.id, 'failed', currentScanTask.progress, '扫描已被用户终止');
    }
    
    return true;
  },

  async previewScan(): Promise<ScanPreviewResult> {
    const directories = await scanDirectoryRepository.getAll();
    const settings = await settingsRepository.get();
    
    const items: ScanPreviewItem[] = [];
    let existingFiles = 0;
    let newFiles = 0;

    for (const dir of directories) {
      if (!fs.existsSync(dir.path)) {
        logger.warn(`扫描目录不存在: ${dir.path}`);
        continue;
      }
      
      const files = await this.scanDirectory(dir.path);
      
      for (const filePath of files) {
        const existingFile = await songRepository.getByFilePath(filePath);
        if (existingFile) {
          existingFiles++;
          continue;
        }
        newFiles++;

        const scrapePreview = await scrapeService.scrapeSingleFile(filePath, {
          enableLyrics: true,
          enableCoverArt: true,
        });

        if (scrapePreview) {
          const targetPath = await organizeService.generateTargetPath(scrapePreview.suggestedTags, filePath);
          
          items.push({
            filePath,
            fileName: path.basename(filePath),
            originalTags: scrapePreview.originalTags,
            suggestedTags: scrapePreview.suggestedTags,
            matchedSource: scrapePreview.matchedSource,
            confidence: scrapePreview.confidence,
            targetPath,
          });
        } else {
          const tags = await tagService.readTags(filePath);
          const targetPath = await organizeService.generateTargetPath(tags, filePath);
          
          items.push({
            filePath,
            fileName: path.basename(filePath),
            originalTags: tags,
            suggestedTags: tags,
            matchedSource: 'none',
            confidence: 0,
            targetPath,
          });
        }
      }
    }

    return {
      items,
      totalFiles: newFiles + existingFiles,
      matchedCount: items.filter(i => i.confidence > 0).length,
      unmatchedCount: items.filter(i => i.confidence === 0).length,
      newFiles,
      existingFiles,
    };
  },

  async executeScannedFiles(items: ScanPreviewItem[]): Promise<{ successCount: number; failedCount: number }> {
    const settings = await settingsRepository.get();
    
    let successCount = 0;
    let failedCount = 0;

    for (const item of items) {
      try {
        const tags = item.suggestedTags;

        let artist = await artistRepository.getByName(tags.artist);
        if (!artist) {
          artist = await artistRepository.create(tags.artist);
        }

        let album = await albumRepository.getByNameAndArtist(tags.album, artist.id);
        if (!album) {
          album = await albumRepository.create(tags.album, artist.id, tags.year || undefined);
        }

        const fileStats = fs.statSync(item.filePath);
        const finalPath = await organizeService.organizeFile(item.filePath, item.targetPath, settings.fileOrganizeMode);

        let entry = await songEntryRepository.getByTitleArtistAlbum(tags.title, artist.id, album.id);
        
        if (entry) {
          await songEntryRepository.incrementFileCount(entry.id);
        } else {
          entry = await songEntryRepository.create({
            title: tags.title,
            artistId: artist.id,
            albumId: album.id,
            trackNumber: tags.trackNumber,
            duration: Math.round(tags.duration),
            genre: tags.genre,
            year: tags.year,
          });
        }

        await songRepository.create({
          entryId: entry.id,
          filePath: finalPath,
          fileSize: fileStats.size,
          duration: Math.round(tags.duration),
        });

        if (settings.coverArtEnabled && tags.coverArt) {
          const coverPath = await organizeService.saveCoverArt(tags.artist, tags.album, tags.coverArt);
          if (coverPath && album.coverPath !== coverPath) {
            await albumRepository.update(album.id, { coverPath });
          }
        }

        successCount++;
      } catch (error) {
        logger.error(`处理文件失败 ${item.filePath}:`, error);
        failedCount++;
      }
    }

    return { successCount, failedCount };
  },
};