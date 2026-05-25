import db from '../utils/database';
import { Song } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const songRepository = {
  getAll: async (page = 0, limit = 20): Promise<{ data: Song[]; total: number }> => {
    const offset = page * limit;
    
    const dataPromise = new Promise<Song[]>((resolve, reject) => {
      db.all(`
        SELECT s.id, s.title, s.artist_id as artistId, s.album_id as albumId,
               s.track_number as trackNumber, s.duration, s.file_path as filePath,
               s.file_size as fileSize, s.genre, s.year, s.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        ORDER BY a.name, al.name, s.track_number
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Song[]);
      });
    });

    const totalPromise = new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM songs', (err, row) => {
        if (err) reject(err);
        else resolve((row as { count: number }).count);
      });
    });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);
    return { data, total };
  },

  getById: async (id: string): Promise<Song | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.title, s.artist_id as artistId, s.album_id as albumId,
               s.track_number as trackNumber, s.duration, s.file_path as filePath,
               s.file_size as fileSize, s.genre, s.year, s.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        WHERE s.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Song || null);
      });
    });
  },

  getByAlbumId: async (albumId: string): Promise<Song[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.id, s.title, s.artist_id as artistId, s.album_id as albumId,
               s.track_number as trackNumber, s.duration, s.file_path as filePath,
               s.file_size as fileSize, s.genre, s.year, s.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        WHERE s.album_id = ?
        ORDER BY s.track_number
      `, [albumId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Song[]);
      });
    });
  },

  getByArtistId: async (artistId: string): Promise<Song[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.id, s.title, s.artist_id as artistId, s.album_id as albumId,
               s.track_number as trackNumber, s.duration, s.file_path as filePath,
               s.file_size as fileSize, s.genre, s.year, s.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        WHERE s.artist_id = ?
        ORDER BY al.year DESC, al.name, s.track_number
      `, [artistId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Song[]);
      });
    });
  },

  getByFilePath: async (filePath: string): Promise<Song | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM songs WHERE file_path = ?', [filePath], (err, row) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else {
          const r = row as { id: string; title: string; artist_id: string; album_id: string; track_number: number | null; duration: number; file_path: string; file_size: number; genre: string | null; year: number | null; created_at: string; artistName?: string; albumName?: string };
          resolve({ ...r, artistId: r.artist_id, albumId: r.album_id, trackNumber: r.track_number, filePath: r.file_path, fileSize: r.file_size, createdAt: r.created_at } as Song);
        }
      });
    });
  },

  create: async (data: Omit<Song, 'id' | 'createdAt'>): Promise<Song> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO songs (id, title, artist_id, album_id, track_number, duration, file_path, file_size, genre, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.title, data.artistId, data.albumId, data.trackNumber, data.duration, data.filePath, data.fileSize, data.genre, data.year],
        async function(err) {
          if (err) reject(err);
          else {
            const result = await songRepository.getById(id);
            if (result) resolve(result);
            else reject(new Error('Failed to create song'));
          }
        }
      );
    });
  },

  update: async (id: string, updates: Partial<Song>): Promise<Song | null> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.title !== undefined) {
      setClauses.push('title = ?');
      values.push(updates.title);
    }
    if (updates.trackNumber !== undefined) {
      setClauses.push('track_number = ?');
      values.push(updates.trackNumber);
    }
    if (updates.duration !== undefined) {
      setClauses.push('duration = ?');
      values.push(updates.duration);
    }
    if (updates.filePath !== undefined) {
      setClauses.push('file_path = ?');
      values.push(updates.filePath);
    }
    if (updates.fileSize !== undefined) {
      setClauses.push('file_size = ?');
      values.push(updates.fileSize);
    }
    if (updates.genre !== undefined) {
      setClauses.push('genre = ?');
      values.push(updates.genre);
    }
    if (updates.year !== undefined) {
      setClauses.push('year = ?');
      values.push(updates.year);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(`UPDATE songs SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else songRepository.getById(id).then(resolve).catch(reject);
      });
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM songs WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  search: async (query: string, limit = 20): Promise<Song[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.id, s.title, s.artist_id as artistId, s.album_id as albumId,
               s.track_number as trackNumber, s.duration, s.file_path as filePath,
               s.file_size as fileSize, s.genre, s.year, s.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM songs s
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        WHERE s.title LIKE ? OR a.name LIKE ? OR al.name LIKE ?
        ORDER BY a.name, al.name, s.track_number
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, `%${query}%`, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Song[]);
      });
    });
  },

  getStats: async (): Promise<{ songCount: number; artistCount: number; albumCount: number }> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM songs) as songCount,
          (SELECT COUNT(*) FROM artists) as artistCount,
          (SELECT COUNT(*) FROM albums) as albumCount
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row as { songCount: number; artistCount: number; albumCount: number });
      });
    });
  },
};
