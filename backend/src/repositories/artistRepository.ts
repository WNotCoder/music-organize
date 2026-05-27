import db from '../utils/database';
import { Artist } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const artistRepository = {
  getAll: async (): Promise<Artist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.id, a.name, a.cover_path as coverPath, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(DISTINCT s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
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
        SELECT a.id, a.name, a.cover_path as coverPath, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(DISTINCT s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
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
        SELECT a.id, a.name, a.cover_path as coverPath, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(DISTINCT s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE a.name = ?
        GROUP BY a.id
      `, [name], (err, row) => {
        if (err) reject(err);
        else resolve(row as Artist || null);
      });
    });
  },

  create: async (name: string, coverPath?: string): Promise<Artist> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO artists (id, name, cover_path) VALUES (?, ?, ?)', [id, name, coverPath || null], async function(err) {
        if (err) reject(err);
        else {
          const result = await artistRepository.getById(id);
          if (result) resolve(result);
          else reject(new Error('Failed to create artist'));
        }
      });
    });
  },

  update: async (id: string, updates: Partial<Artist>): Promise<Artist | null> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.coverPath !== undefined) {
      setClauses.push('cover_path = ?');
      values.push(updates.coverPath);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(`UPDATE artists SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else artistRepository.getById(id).then(resolve).catch(reject);
      });
    });
  },

  search: async (query: string): Promise<Artist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.id, a.name, a.cover_path as coverPath, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(s.id) as songCount
        FROM artists a
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE a.name LIKE ?
        GROUP BY a.id
        ORDER BY a.name
      `, [`%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Artist[]);
      });
    });
  },

  getByEntryId: async (entryId: string): Promise<Artist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT a.id, a.name, a.cover_path as coverPath, a.created_at as createdAt,
               COUNT(DISTINCT al.id) as albumCount,
               COUNT(DISTINCT s.id) as songCount
        FROM artists a
        JOIN artist_song_entry ase ON a.id = ase.artist_id
        LEFT JOIN albums al ON a.id = al.artist_id
        LEFT JOIN song_entries se ON al.id = se.album_id
        LEFT JOIN songs s ON se.id = s.entry_id
        WHERE ase.entry_id = ?
        GROUP BY a.id
        ORDER BY ase.is_primary DESC, a.name
      `, [entryId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Artist[]);
      });
    });
  },

  getByNameOrCreate: async (name: string): Promise<Artist> => {
    const existing = await artistRepository.getByName(name);
    if (existing) return existing;
    return await artistRepository.create(name);
  },

  findOrCreateMany: async (names: string[]): Promise<Artist[]> => {
    const artists: Artist[] = [];
    for (const name of names) {
      const trimmedName = name.trim();
      if (trimmedName) {
        const artist = await artistRepository.getByNameOrCreate(trimmedName);
        artists.push(artist);
      }
    }
    return artists;
  },
};
