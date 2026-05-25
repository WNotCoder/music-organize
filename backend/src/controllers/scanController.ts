import { Request, Response } from 'express';
import { scanService, ScanPreviewItem } from '../services/scanService';
import { scanDirectoryRepository } from '../repositories/scanDirectoryRepository';
import { AddDirectoryRequest } from '../types';
import { logger } from '../utils/logger';

export const scanController = {
  async getScanStatus(req: Request, res: Response) {
    try {
      logger.scan('GET /api/scan - Fetching scan status');
      const status = await scanService.getScanStatus();
      logger.debug('Scan status:', status);
      res.json(status);
    } catch (error) {
      logger.error('GET /api/scan failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async startScan(req: Request, res: Response) {
    try {
      logger.scan('POST /api/scan - Starting scan');
      const result = await scanService.startScan();
      if (result.success) {
        logger.scan(`Scan started successfully, taskId: ${result.taskId}`);
        res.json(result);
      } else {
        logger.warn('Scan start failed:', result.message);
        res.status(400).json(result);
      }
    } catch (error) {
      logger.error('POST /api/scan failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async stopScan(req: Request, res: Response) {
    try {
      logger.scan('DELETE /api/scan - Stopping scan');
      const success = await scanService.stopScan();
      if (success) {
        logger.scan('Scan stopped successfully');
      } else {
        logger.warn('No running scan to stop');
      }
      res.json({ success, message: success ? '扫描已停止' : '没有正在运行的扫描任务' });
    } catch (error) {
      logger.error('DELETE /api/scan failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getScanDirectories(req: Request, res: Response) {
    try {
      const directories = await scanDirectoryRepository.getAll();
      res.json(directories);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async addScanDirectory(req: Request, res: Response) {
    try {
      const { path, name } = req.body as AddDirectoryRequest;
      if (!path || !name) {
        return res.status(400).json({ error: '路径和名称都是必需的' });
      }
      const directory = await scanDirectoryRepository.create(path, name);
      res.status(201).json(directory);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deleteScanDirectory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await scanDirectoryRepository.delete(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '目录不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async previewScan(req: Request, res: Response) {
    try {
      const result = await scanService.previewScan();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async confirmScan(req: Request, res: Response) {
    try {
      const { items } = req.body;
      
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: '请提供要处理的文件列表' });
      }

      const scanItems = items as ScanPreviewItem[];
      const result = await scanService.executeScannedFiles(scanItems);
      
      res.json({
        success: true,
        ...result,
        message: `扫描完成，成功: ${result.successCount}，失败: ${result.failedCount}`,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
