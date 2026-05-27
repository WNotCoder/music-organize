import { Request, Response } from 'express';
import { artistRepository } from '../repositories/artistRepository';
import { albumRepository } from '../repositories/albumRepository';
import { songEntryRepository } from '../repositories/songEntryRepository';
import { songRepository } from '../repositories/songRepository';
import { artistSongEntryRepository } from '../repositories/artistSongEntryRepository';

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
        const artistSongEntries = await artistSongEntryRepository.getByArtistId(id);
        const entryIds = [...new Set(artistSongEntries.map(ase => ase.entryId))];
        const entries = await Promise.all(entryIds.map(eid => songEntryRepository.getById(eid)));
        res.json({ ...artist, songEntries: entries.filter((e): e is NonNullable<typeof e> => e !== null) });
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
        const entries = await songEntryRepository.getByAlbumId(id);
        res.json({ ...album, songEntries: entries });
      } else {
        res.status(404).json({ error: '专辑不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongEntries(req: Request, res: Response) {
    try {
      const { page = 0, limit = 20, artistId, albumId } = req.query;
      
      if (artistId) {
        const artistSongEntries = await artistSongEntryRepository.getByArtistId(artistId as string);
        const entryIds = [...new Set(artistSongEntries.map(ase => ase.entryId))];
        const entries = await Promise.all(entryIds.map(eid => songEntryRepository.getById(eid)));
        const validEntries = entries.filter((e): e is NonNullable<typeof e> => e !== null);
        res.json({ data: validEntries, total: validEntries.length, page: 0, limit: validEntries.length });
      } else if (albumId) {
        const entries = await songEntryRepository.getByAlbumId(albumId as string);
        res.json({ data: entries, total: entries.length, page: 0, limit: entries.length });
      } else {
        const result = await songEntryRepository.getAll(parseInt(page as string), parseInt(limit as string));
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongEntryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entry = await songEntryRepository.getById(id);
      if (entry) {
        const files = await songRepository.getByEntryId(id);
        const artists = await artistRepository.getByEntryId(id);
        res.json({ ...entry, files, artists });
      } else {
        res.status(404).json({ error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async updateSongEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const entry = await songEntryRepository.update(id, updates);
      if (entry) {
        res.json(entry);
      } else {
        res.status(404).json({ error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deleteSongEntry(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await songRepository.deleteByEntryId(id);
      await artistSongEntryRepository.deleteByEntryId(id);
      const success = await songEntryRepository.delete(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '歌曲不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongFiles(req: Request, res: Response) {
    try {
      const { entryId } = req.query;
      
      if (entryId) {
        const files = await songRepository.getByEntryId(entryId as string);
        res.json({ data: files, total: files.length, page: 0, limit: files.length });
      } else {
        const result = await songRepository.getAll();
        res.json(result);
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getSongFileById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = await songRepository.getById(id);
      if (file) {
        res.json(file);
      } else {
        res.status(404).json({ error: '文件不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deleteSongFile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const file = await songRepository.getById(id);
      if (!file) {
        return res.status(404).json({ success: false, error: '文件不存在' });
      }
      
      const success = await songRepository.delete(id);
      if (success) {
        await songEntryRepository.decrementFileCount(file.entryId);
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '文件不存在' });
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

      const results: { artists: unknown[]; albums: unknown[]; songEntries: unknown[] } = {
        artists: [],
        albums: [],
        songEntries: [],
      };

      if (type === 'all' || type === 'artist') {
        results.artists = await artistRepository.search(query as string);
      }
      if (type === 'all' || type === 'album') {
        results.albums = await albumRepository.search(query as string);
      }
      if (type === 'all' || type === 'song') {
        results.songEntries = await songEntryRepository.search(query as string, parseInt(limit as string));
      }

      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getStats(req: Request, res: Response) {
    try {
      const stats = await songEntryRepository.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};