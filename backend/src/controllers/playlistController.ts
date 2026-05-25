import { Request, Response } from 'express';
import { playlistRepository } from '../repositories/playlistRepository';

export const playlistController = {
  async getPlaylists(req: Request, res: Response) {
    try {
      const playlists = await playlistRepository.getAll();
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getPlaylistById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const playlist = await playlistRepository.getById(id);
      if (playlist) {
        const songs = await playlistRepository.getSongs(id);
        res.json({ ...playlist, songs });
      } else {
        res.status(404).json({ error: '播放列表不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async createPlaylist(req: Request, res: Response) {
    try {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: '名称是必需的' });
      }
      const playlist = await playlistRepository.create(name, description);
      res.status(201).json(playlist);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updatePlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;
      const playlist = await playlistRepository.update(id, { name, description });
      if (playlist) {
        res.json(playlist);
      } else {
        res.status(404).json({ error: '播放列表不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deletePlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await playlistRepository.delete(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '播放列表不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async addSongToPlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { songId } = req.body;
      await playlistRepository.addSong(id, songId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async removeSongFromPlaylist(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { songId } = req.body;
      await playlistRepository.removeSong(id, songId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
