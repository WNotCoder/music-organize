import { Request, Response } from 'express';
import { settingsRepository } from '../repositories/settingsRepository';
import { ScraperConfig, ScraperUsageConfig, ConflictResolution } from '../types';

export interface UpdateScraperRequest {
  enabled?: boolean;
  priority?: number;
  requestInterval?: number;
  timeout?: number;
  retryCount?: number;
  apiParams?: Record<string, string>;
}

export interface ScraperDetailResponse {
  name: string;
  enabled: boolean;
  priority: number;
  requestInterval: number;
  timeout: number;
  retryCount: number;
  apiParams: Record<string, string>;
  supportedDataTypes: ('tags' | 'cover' | 'lyrics')[];
}

export interface ScraperListResponse {
  data: ScraperConfig[];
  scraperUsage: ScraperUsageConfig;
  conflictResolution: ConflictResolution;
}

const SUPPORTED_DATA_TYPES: Record<string, ('tags' | 'cover' | 'lyrics')[]> = {
  netease: ['tags', 'cover', 'lyrics'],
  qqmusic: ['tags', 'cover', 'lyrics'],
  kugou: ['tags', 'cover', 'lyrics'],
  migu: ['tags', 'cover', 'lyrics'],
  musicbrainz: ['tags', 'cover'],
  douban: ['tags'],
  spotify: ['tags', 'cover'],
  itunes: ['tags', 'cover'],
};

export const scraperController = {
  async getScrapers(req: Request, res: Response) {
    try {
      const settings = await settingsRepository.get();
      const response: ScraperListResponse = {
        data: settings.scrapers,
        scraperUsage: settings.scraperUsage,
        conflictResolution: settings.conflictResolution,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getScraper(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const settings = await settingsRepository.get();
      const scraper = settings.scrapers.find(s => s.name === name);
      
      if (!scraper) {
        return res.status(404).json({ error: 'Scraper not found' });
      }
      
      const response: ScraperDetailResponse = {
        ...scraper,
        supportedDataTypes: SUPPORTED_DATA_TYPES[name] || ['tags'],
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateScraper(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const updates: UpdateScraperRequest = req.body;
      
      const settings = await settingsRepository.updateScraperConfig(name, updates);
      const updatedScraper = settings.scrapers.find(s => s.name === name);
      
      if (!updatedScraper) {
        return res.status(404).json({ error: 'Scraper not found' });
      }
      
      res.json({
        success: true,
        message: 'Scraper configuration updated',
        scraper: updatedScraper,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async resetScraper(req: Request, res: Response) {
    try {
      const { name } = req.params;
      const settings = await settingsRepository.resetScraperConfig(name);
      const resetScraper = settings.scrapers.find(s => s.name === name);
      
      res.json({
        success: true,
        message: 'Scraper configuration reset to defaults',
        scraper: resetScraper,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateScraperUsage(req: Request, res: Response) {
    try {
      const updates: Partial<ScraperUsageConfig> = req.body;
      const settings = await settingsRepository.updateScraperUsage(updates);
      
      res.json({
        success: true,
        message: 'Scraper usage configuration updated',
        scraperUsage: settings.scraperUsage,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateConflictResolution(req: Request, res: Response) {
    try {
      const resolution: ConflictResolution = req.body;
      const settings = await settingsRepository.updateConflictResolution(resolution);
      
      res.json({
        success: true,
        message: 'Conflict resolution strategy updated',
        conflictResolution: settings.conflictResolution,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};