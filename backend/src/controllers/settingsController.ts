import { Request, Response } from 'express';
import { settingsRepository } from '../repositories/settingsRepository';

export const settingsController = {
  async getSettings(req: Request, res: Response) {
    try {
      const settings = await settingsRepository.get();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const updates = req.body;
      const settings = await settingsRepository.update(updates);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
