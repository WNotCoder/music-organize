import db from '../utils/database';
import { SongEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const songEntryRepository = {
  getAll: async (page = 0, limit = 20): Promise<{ data: SongEntry[]; total: number }> => {
    const offset = page * limit;
    
    const dataPromise = new Promise<SongEntry[]>((resolve, reject) => {
      db.all(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        ORDER BY a.name, al.name, se.track_number
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongEntry[]);
      });
    });

    const totalPromise = new Promise<number>((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM song_entries', (err, row) => {
        if (err) reject(err);
        else resolve((row as { count: number }).count);
      });
    });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);
    return { data, total };
  },

  getById: async (id: string): Promise<SongEntry | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        WHERE se.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as SongEntry || null);
      });
    });
  },

  getByAlbumId: async (albumId: string): Promise<SongEntry[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        WHERE se.album_id = ?
        ORDER BY se.track_number
      `, [albumId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongEntry[]);
      });
    });
  },

  getByArtistId: async (artistId: string): Promise<SongEntry[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        WHERE se.artist_id = ?
        ORDER BY al.year DESC, al.name, se.track_number
      `, [artistId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongEntry[]);
      });
    });
  },

  getByTitleArtistAlbum: async (title: string, artistId: string, albumId: string): Promise<SongEntry | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        WHERE se.title = ? AND se.artist_id = ? AND se.album_id = ?
      `, [title, artistId, albumId], (err, row) => {
        if (err) reject(err);
        else resolve(row as SongEntry || null);
      });
    });
  },

  create: async (data: { title: string; artistId: string; albumId: string; trackNumber: number | null; duration: number; genre: string | null; year: number | null }): Promise<SongEntry> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO song_entries (id, title, artist_id, album_id, track_number, duration, genre, year) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.title, data.artistId, data.albumId, data.trackNumber, data.duration, data.genre, data.year],
        async function(err: any) {
          if (err) {
            console.error('SQLite error creating song entry:', err.message, err.code);
            console.error('Data:', JSON.stringify(data));
            reject(err);
          } else {
            const result = await songEntryRepository.getById(id);
            if (result) resolve(result);
            else reject(new Error('Failed to create song entry'));
          }
        }
      );
    });
  },

  incrementFileCount: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE song_entries SET file_count = file_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  },

  decrementFileCount: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE song_entries SET file_count = file_count - 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND file_count > 0',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  },

  update: async (id: string, updates: Partial<SongEntry>): Promise<SongEntry | null> => {
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
      db.run(`UPDATE song_entries SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else songEntryRepository.getById(id).then(resolve).catch(reject);
      });
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM song_entries WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  search: async (query: string, limit = 20): Promise<SongEntry[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT se.id, se.title, se.artist_id as artistId, se.album_id as albumId,
               se.track_number as trackNumber, se.duration, se.genre, se.year,
               se.file_count as fileCount, se.created_at as createdAt,
               a.name as artistName, al.name as albumName
        FROM song_entries se
        JOIN artists a ON se.artist_id = a.id
        JOIN albums al ON se.album_id = al.id
        WHERE se.title LIKE ? OR a.name LIKE ? OR al.name LIKE ?
        ORDER BY a.name, al.name, se.track_number
        LIMIT ?
      `, [`%${query}%`, `%${query}%`, `%${query}%`, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongEntry[]);
      });
    });
  },

  getStats: async (): Promise<{ entryCount: number; fileCount: number; artistCount: number; albumCount: number }> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          (SELECT COUNT(*) FROM song_entries) as entryCount,
          (SELECT COUNT(*) FROM songs) as fileCount,
          (SELECT COUNT(*) FROM artists) as artistCount,
          (SELECT COUNT(*) FROM albums) as albumCount
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row as { entryCount: number; fileCount: number; artistCount: number; albumCount: number });
      });
    });
  },
};