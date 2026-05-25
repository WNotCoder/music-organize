import { Request, Response } from 'express';
import { scrapeService } from '../services/scrapeService';

export const scrapeController = {
  async previewScrape(req: Request, res: Response) {
    try {
      const { files, sources, enableLyrics, enableCoverArt } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: '请提供要刮削的文件列表' });
      }

      const options = {
        sources: sources as string[] | undefined,
        enableLyrics: enableLyrics as boolean | undefined,
        enableCoverArt: enableCoverArt as boolean | undefined,
      };

      const result = await scrapeService.batchScrape(files, options);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async executeScrape(req: Request, res: Response) {
    try {
      const { files, sources, enableLyrics, enableCoverArt } = req.body;
      
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: '请提供要刮削的文件列表' });
      }

      const options = {
        sources: sources as string[] | undefined,
        enableLyrics: enableLyrics as boolean | undefined,
        enableCoverArt: enableCoverArt as boolean | undefined,
      };

      const result = await scrapeService.batchScrape(files, options);
      
      let successCount = 0;
      let failedCount = 0;

      for (const preview of result.previews) {
        const success = await scrapeService.writeTagsToFile(preview.filePath, preview.suggestedTags);
        if (success) {
          successCount++;
        } else {
          failedCount++;
        }
      }

      res.json({
        ...result,
        successCount,
        failedCount,
        message: `刮削完成，成功: ${successCount}，失败: ${failedCount}`,
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async scrapeSingle(req: Request, res: Response) {
    try {
      const { filePath, sources, enableLyrics, enableCoverArt } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ error: '请提供文件路径' });
      }

      const options = {
        sources: sources as string[] | undefined,
        enableLyrics: enableLyrics as boolean | undefined,
        enableCoverArt: enableCoverArt as boolean | undefined,
      };

      const result = await scrapeService.scrapeSingleFile(filePath, options);
      
      if (result) {
        res.json(result);
      } else {
        res.status(404).json({ error: '未能获取标签信息' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getAvailableSources(req: Request, res: Response) {
    try {
      res.json({
        sources: [
          { id: 'netease', name: '网易云音乐', description: '提供歌词和详细标签信息', confidence: 0.85 },
          { id: 'musicbrainz', name: 'MusicBrainz', description: '权威的音乐数据库', confidence: 0.8 },
          { id: 'douban', name: '豆瓣音乐', description: '中文专辑信息和封面', confidence: 0.75 },
        ],
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
