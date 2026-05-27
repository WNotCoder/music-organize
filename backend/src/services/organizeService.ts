import fs from 'fs';
import path from 'path';
import { settingsRepository } from '../repositories/settingsRepository';
import { logger } from '../utils/logger';
import { ParsedTag } from './tagService';

export const organizeService = {
  async generateTargetPath(tag: ParsedTag, originalFilePath: string, albumArtist?: string): Promise<string> {
    const settings = await settingsRepository.get();
    
    const extension = path.extname(originalFilePath);
    
    const artist = settings.traditionalToSimplified ? this.simplifyTag(tag.artist) : tag.artist;
    const folderArtist = albumArtist ? (settings.traditionalToSimplified ? this.simplifyTag(albumArtist) : albumArtist) : artist;
    const album = settings.traditionalToSimplified ? this.simplifyTag(tag.album) : tag.album;
    const title = settings.traditionalToSimplified ? this.simplifyTag(tag.title) : tag.title;

    const directoryPath = settings.fileStructureTemplate
      .replace('{artist}', this.sanitizePath(folderArtist))
      .replace('{album}', this.sanitizePath(album))
      .replace('{title}', this.sanitizePath(title))
      .replace('{year}', tag.year?.toString() || 'Unknown Year')
      .replace('{genre}', tag.genre || 'Unknown Genre');

    const trackNum = tag.trackNumber?.toString().padStart(2, '0') || '';
    const fileName = settings.fileNameTemplate
      .replace('{trackNumber}', trackNum)
      .replace('{title}', this.sanitizePath(title))
      .replace('{artist}', this.sanitizePath(artist))
      .replace('{album}', this.sanitizePath(album))
      .replace('{year}', tag.year?.toString() || '')
      .replace('{discNumber}', '')
      .trim();

    const finalFileName = fileName || title;
    
    return path.join(settings.storagePath, directoryPath, finalFileName + extension);
  },

  sanitizePath(name: string): string {
    if (!name) return 'Unknown';
    
    let result = name.trim();
    
    const invalidChars = /[<>:"/\\|?*\x00-\x1F\x7F]/g;
    result = result.replace(invalidChars, '_');
    
    const controlChars = /[\u0000-\u001F\u007F-\u009F]/g;
    result = result.replace(controlChars, '_');
    
    const surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
    result = result.replace(surrogatePairs, '_');
    
    while (result.includes('__')) {
      result = result.replace('__', '_');
    }
    
    result = result.replace(/^_+|_+$/g, '');
    
    if (!result || result.length === 0) {
      result = 'Unknown';
    }
    
    return result;
  },

  simplifyTag(text: string): string {
    const map: Record<string, string> = {
      '裡': '里', '後': '后', '為': '为', '會': '会', '從': '从', '說': '说',
      '過': '过', '個': '个', '這': '这', '麼': '么', '與': '与', '們': '们',
      '來': '来', '頭': '头', '聲': '声', '風': '风', '電': '电', '雲': '云',
    };
    return text.split('').map(char => map[char] || char).join('');
  },

  async organizeFile(sourcePath: string, targetPath: string, mode: 'copy' | 'move' | 'rename'): Promise<string> {
    const targetDir = path.dirname(targetPath);
    
    logger.debug(`organizeFile - sourcePath: ${sourcePath}`);
    logger.debug(`organizeFile - targetPath: ${targetPath}`);
    logger.debug(`organizeFile - targetDir: ${targetDir}`);
    logger.debug(`organizeFile - mode: ${mode}`);
    
    if (!fs.existsSync(targetDir)) {
      logger.debug(`Creating directory: ${targetDir}`);
      try {
        fs.mkdirSync(targetDir, { recursive: true });
        logger.debug(`Directory created successfully`);
      } catch (mkdirError) {
        logger.error(`Failed to create directory ${targetDir}:`, mkdirError);
        throw mkdirError;
      }
    } else {
      logger.debug(`Directory already exists: ${targetDir}`);
    }

    let counter = 1;
    let finalTargetPath = targetPath;
    
    while (fs.existsSync(finalTargetPath)) {
      const ext = path.extname(targetPath);
      const base = path.basename(targetPath, ext);
      finalTargetPath = path.join(targetDir, `${base}_${counter}${ext}`);
      counter++;
    }

    try {
      switch (mode) {
        case 'copy':
          fs.copyFileSync(sourcePath, finalTargetPath);
          logger.info(`Copied: ${sourcePath} -> ${finalTargetPath}`);
          break;
        case 'move':
          fs.renameSync(sourcePath, finalTargetPath);
          logger.info(`Moved: ${sourcePath} -> ${finalTargetPath}`);
          break;
        case 'rename':
          fs.renameSync(sourcePath, finalTargetPath);
          logger.info(`Renamed: ${sourcePath} -> ${finalTargetPath}`);
          break;
      }
      return finalTargetPath;
    } catch (error) {
      logger.error(`Failed to organize file ${sourcePath}:`, error);
      throw error;
    }
  },

  async saveCoverArt(artist: string, album: string, coverArt: Buffer): Promise<string | null> {
    const settings = await settingsRepository.get();
    
    if (!settings.coverArtEnabled) return null;

    const sanitizedArtist = this.sanitizePath(settings.traditionalToSimplified ? this.simplifyTag(artist) : artist);
    const sanitizedAlbum = this.sanitizePath(settings.traditionalToSimplified ? this.simplifyTag(album) : album);
    
    const coverPath = path.join(settings.storagePath, sanitizedArtist, sanitizedAlbum, 'cover.jpg');
    const coverDir = path.dirname(coverPath);

    if (!fs.existsSync(coverDir)) {
      fs.mkdirSync(coverDir, { recursive: true });
    }

    fs.writeFileSync(coverPath, coverArt);
    return coverPath;
  },
};
