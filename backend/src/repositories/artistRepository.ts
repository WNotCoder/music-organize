import db from '../utils/database';
import { Artist } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const artistRepository = {
  getAll: async (): Promise<Artist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.id, a.name, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN songs s ON al.id = s.album_id
        GROUP BY a.id
        ORDER BY a.name
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Artist[]);
      });
    });
  },

  getById: async (id: string): Promise<Artist | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT a.id, a.name, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN songs s ON al.id = s.artist_id
        WHERE a.id = ?
        GROUP BY a.id
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Artist || null);
      });
    });
  },

  getByName: async (name: string): Promise<Artist | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT a.id, a.name, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN songs s ON al.id = s.album_id
        WHERE a.name = ?
        GROUP BY a.id
      `, [name], (err, row) => {
        if (err) reject(err);
        else resolve(row as Artist || null);
      });
    });
  },

  create: async (name: string): Promise<Artist> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO artists (id, name) VALUES (?, ?)', [id, name], async function(err) {
        if (err) reject(err);
        else {
          const result = await artistRepository.getById(id);
          if (result) resolve(result);
          else reject(new Error('Failed to create artist'));
        }
      });
    });
  },

  search: async (query: string): Promise<Artist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.id, a.name, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN songs s ON al.id = s.artist_id
        WHERE a.name LIKE ?
        GROUP BY a.id
        ORDER BY a.name
      `, [`%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Artist[]);
      });
    });
  },
};
