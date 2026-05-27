import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { stopAllTasks, shutdownServer, isShuttingDown } from '../index';

export const systemController = {
  async stopAllTasks(req: Request, res: Response) {
    try {
      logger.system('POST /api/system/stop-tasks - Stopping all running tasks');
      const stoppedCount = await stopAllTasks();
      logger.system(`Stopped ${stoppedCount} tasks`);
      res.json({ success: true, stoppedCount, message: `已停止 ${stoppedCount} 个后台任务` });
    } catch (error) {
      logger.error('POST /api/system/stop-tasks failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async shutdownServer(req: Request, res: Response) {
    try {
      logger.system('POST /api/system/shutdown - Shutting down server');
      if (isShuttingDown) {
        return res.status(400).json({ success: false, message: '服务正在关闭中' });
      }
      
      res.json({ success: true, message: '服务正在关闭...' });
      
      await shutdownServer();
    } catch (error) {
      logger.error('POST /api/system/shutdown failed:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
