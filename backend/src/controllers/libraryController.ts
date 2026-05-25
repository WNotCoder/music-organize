import { Request, Response } from 'express';
import { artistRepository } from '../repositories/artistRepository';
import { albumRepository } from '../repositories/albumRepository';
import { songRepository } from '../repositories/songRepository';

export const libraryController = {
  async getArtists(req: Request, res: Response) {
    try {
      const { search } = req.query;
      if (search) {
        const artists = await artistRepository.search(search as string);
        res.json({ data: artists, total: artists.length, page: 0, limit: artists.length });
      } else {
        const artists = await artistRepository.getAll();
        res.json({ data: artists, total: artists.length, page: 0, limit: artists.length });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getArtistById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const artist = await artistRepository.getById(id);
      if (artist) {
        res.json(artist);
      } else {
        res.status(404).json({ error: '艺术家不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getAlbums(req: Request, res: Response) {
    try {
      const { search, artistId } = req.query;
      if (artistId) {
        const albums = await albumRepository.getByArtistId(artistId as string);
        res.json({ data: albums, total: albums.length, page: 0, limit: albums.length });
      } else if (search) {
        const albums = await albumRepository.search(search as string);
        res.json({ data: albums, total: albums.length, page: 0, limit: albums.length });
      } else {
        const albums = await albumRepository.getAll();
        res.json({ data: albums, total: albums.length, page: 0, limit: albums.length });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getAlbumById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const album = await albumRepository.getById(id);
      if (album) {
        const songs = await songRepository.getByAlbumId(id);
        res.json({ ...album, songs });
      } else {
        res.status(404).json({ error: '专辑不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongs(req: Request, res: Response) {
    try {
      const { page = 0, limit = 20, artistId, albumId } = req.query;
      
      if (artistId) {
        const songs = await songRepository.getByArtistId(artistId as string);
        res.json({ data: songs, total: songs.length, page: 0, limit: songs.length });
      } else if (albumId) {
        const songs = await songRepository.getByAlbumId(albumId as string);
        res.json({ data: songs, total: songs.length, page: 0, limit: songs.length });
      } else {
        const result = await songRepository.getAll(parseInt(page as string), parseInt(limit as string));
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const song = await songRepository.getById(id);
      if (song) {
        res.json(song);
      } else {
        res.status(404).json({ error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateSong(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const song = await songRepository.update(id, updates);
      if (song) {
        res.json(song);
      } else {
        res.status(404).json({ error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deleteSong(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await songRepository.delete(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async search(req: Request, res: Response) {
    try {
      const { query, type = 'all', limit = 20 } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: '查询参数是必需的' });
      }

      const results: { artists: unknown[]; albums: unknown[]; songs: unknown[] } = {
        artists: [],
        albums: [],
        songs: [],
      };

      if (type === 'all' || type === 'artist') {
        results.artists = await artistRepository.search(query as string);
      }
      if (type === 'all' || type === 'album') {
        results.albums = await albumRepository.search(query as string);
      }
      if (type === 'all' || type === 'song') {
        results.songs = await songRepository.search(query as string, parseInt(limit as string));
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const stats = await songRepository.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
