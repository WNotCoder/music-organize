import db from '../utils/database';
import { Album } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const albumRepository = {
  getAll: async (): Promise<Album[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT al.id, al.name, al.artist_id as artistId, al.year, 
               al.cover_path as coverPath, al.created_at as createdAt,
               a.name as artistName, COUNT(s.id) as songCount
        FROM albums al
        JOIN artists a ON al.artist_id = a.id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        GROUP BY al.id
        ORDER BY al.name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Album[]);
      });
    });
  },

  getById: async (id: string): Promise<Album | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT al.id, al.name, al.artist_id as artistId, al.year, 
               al.cover_path as coverPath, al.created_at as createdAt,
               a.name as artistName, COUNT(s.id) as songCount
        FROM albums al
        JOIN artists a ON al.artist_id = a.id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE al.id = ?
        GROUP BY al.id
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Album || null);
      });
    });
  },

  getByArtistId: async (artistId: string): Promise<Album[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT al.id, al.name, al.artist_id as artistId, al.year, 
               al.cover_path as coverPath, al.created_at as createdAt,
               a.name as artistName, COUNT(s.id) as songCount
        FROM albums al
        JOIN artists a ON al.artist_id = a.id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE al.artist_id = ?
        GROUP BY al.id
        ORDER BY al.year DESC, al.name
      `, [artistId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Album[]);
      });
    });
  },

  getByNameAndArtist: async (name: string, artistId: string): Promise<Album | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT al.id, al.name, al.artist_id as artistId, al.year, 
               al.cover_path as coverPath, al.created_at as createdAt,
               a.name as artistName, COUNT(s.id) as songCount
        FROM albums al
        JOIN artists a ON al.artist_id = a.id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE al.name = ? AND al.artist_id = ?
        GROUP BY al.id
      `, [name, artistId], (err, row) => {
        if (err) reject(err);
        else resolve(row as Album || null);
      });
    });
  },

  create: async (name: string, artistId: string, year?: number, coverPath?: string): Promise<Album> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO albums (id, name, artist_id, year, cover_path) VALUES (?, ?, ?, ?, ?)',
        [id, name, artistId, year || null, coverPath || null],
        async function(err) {
          if (err) reject(err);
          else {
            const result = await albumRepository.getById(id);
            if (result) resolve(result);
            else reject(new Error('Failed to create album'));
          }
        }
      );
    });
  },

  update: async (id: string, updates: Partial<Album>): Promise<Album | null> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.year !== undefined) {
      setClauses.push('year = ?');
      values.push(updates.year);
    }
    if (updates.coverPath !== undefined) {
      setClauses.push('cover_path = ?');
      values.push(updates.coverPath);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(`UPDATE albums SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else albumRepository.getById(id).then(resolve).catch(reject);
      });
    });
  },

  search: async (query: string): Promise<Album[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT al.id, al.name, al.artist_id as artistId, al.year, 
               al.cover_path as coverPath, al.created_at as createdAt,
               a.name as artistName, COUNT(s.id) as songCount
        FROM albums al
        JOIN artists a ON al.artist_id = a.id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE al.name LIKE ? OR a.name LIKE ?
        GROUP BY al.id
        ORDER BY al.name
      `, [`%${query}%`, `%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Album[]);
      });
    });
  },
};
