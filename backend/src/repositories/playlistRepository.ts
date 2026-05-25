import db from '../utils/database';
import { Playlist } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const playlistRepository = {
  getAll: async (): Promise<Playlist[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT p.id, p.name, p.description, p.created_at as createdAt,
               COUNT(pi.id) as songCount
        FROM playlists p
        LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Playlist[]);
      });
    });
  },

  getById: async (id: string): Promise<Playlist | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT p.id, p.name, p.description, p.created_at as createdAt,
               COUNT(pi.id) as songCount
        FROM playlists p
        LEFT JOIN playlist_items pi ON p.id = pi.playlist_id
        WHERE p.id = ?
        GROUP BY p.id
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Playlist || null);
      });
    });
  },

  create: async (name: string, description?: string): Promise<Playlist> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO playlists (id, name, description) VALUES (?, ?, ?)', [id, name, description || null], async function(err) {
        if (err) reject(err);
        else {
          const result = await playlistRepository.getById(id);
          if (result) resolve(result);
          else reject(new Error('Failed to create playlist'));
        }
      });
    });
  },

  update: async (id: string, updates: Partial<Playlist>): Promise<Playlist | null> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }

    values.push(id);

    return new Promise((resolve, reject) => {
      db.run(`UPDATE playlists SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else if (this.changes === 0) resolve(null);
        else playlistRepository.getById(id).then(resolve).catch(reject);
      });
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM playlist_items WHERE playlist_id = ?', [id], (err) => {
        if (err) reject(err);
        else {
          db.run('DELETE FROM playlists WHERE id = ?', [id], function(err) {
            if (err) reject(err);
            else resolve(this.changes > 0);
          });
        }
      });
    });
  },

  addSong: async (playlistId: string, songId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT MAX(position) as maxPos FROM playlist_items WHERE playlist_id = ?', [playlistId], (err, row) => {
        if (err) reject(err);
        else {
          const position = (row as { maxPos: number }).maxPos + 1 || 0;
          const id = uuidv4();
          db.run('INSERT INTO playlist_items (id, playlist_id, song_id, position) VALUES (?, ?, ?, ?)', [id, playlistId, songId, position], (err) => {
            if (err) reject(err);
            else resolve();
          });
        }
      });
    });
  },

  removeSong: async (playlistId: string, songId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM playlist_items WHERE playlist_id = ? AND song_id = ?', [playlistId, songId], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  getSongs: async (playlistId: string): Promise<{ id: string; title: string; artistName: string; albumName: string; position: number }[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.id, s.title, a.name as artistName, al.name as albumName, pi.position
        FROM playlist_items pi
        JOIN songs s ON pi.song_id = s.id
        JOIN artists a ON s.artist_id = a.id
        JOIN albums al ON s.album_id = al.id
        WHERE pi.playlist_id = ?
        ORDER BY pi.position
      `, [playlistId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as { id: string; title: string; artistName: string; albumName: string; position: number }[]);
      });
    });
  },
};
