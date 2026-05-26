import db from '../utils/database';
import { SongFile } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const songRepository = {
  getAll: async (page = 0, limit = 20): Promise<{ data: SongFile[]; total: number }> => {
    const offset = page * limit;
    
    const dataPromise = new Promise<SongFile[]>((resolve, reject) => {
      db.all(`
        SELECT s.id, s.entry_id as entryId, s.file_path as filePath,
               s.file_size as fileSize, s.duration, s.created_at as createdAt
        FROM songs s
        ORDER BY s.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongFile[]);
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

  getById: async (id: string): Promise<SongFile | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT s.id, s.entry_id as entryId, s.file_path as filePath,
               s.file_size as fileSize, s.duration, s.created_at as createdAt
        FROM songs s
        WHERE s.id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as SongFile || null);
      });
    });
  },

  getByEntryId: async (entryId: string): Promise<SongFile[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT s.id, s.entry_id as entryId, s.file_path as filePath,
               s.file_size as fileSize, s.duration, s.created_at as createdAt
        FROM songs s
        WHERE s.entry_id = ?
        ORDER BY s.file_size DESC
      `, [entryId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as SongFile[]);
      });
    });
  },

  getByFilePath: async (filePath: string): Promise<SongFile | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM songs WHERE file_path = ?', [filePath], (err, row) => {
        if (err) reject(err);
        else if (!row) resolve(null);
        else {
          const r = row as { id: string; entry_id: string; file_path: string; file_size: number; duration: number; created_at: string };
          resolve({ ...r, entryId: r.entry_id, filePath: r.file_path, fileSize: r.file_size, createdAt: r.created_at } as SongFile);
        }
      });
    });
  },

  create: async (data: Omit<SongFile, 'id' | 'createdAt'>): Promise<SongFile> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO songs (id, entry_id, file_path, file_size, duration) VALUES (?, ?, ?, ?, ?)',
        [id, data.entryId, data.filePath, data.fileSize, data.duration],
        async function(err) {
          if (err) reject(err);
          else {
            const result = await songRepository.getById(id);
            if (result) resolve(result);
            else reject(new Error('Failed to create song file'));
          }
        }
      );
    });
  },

  update: async (id: string, updates: Partial<SongFile>): Promise<SongFile | null> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.filePath !== undefined) {
      setClauses.push('file_path = ?');
      values.push(updates.filePath);
    }
    if (updates.fileSize !== undefined) {
      setClauses.push('file_size = ?');
      values.push(updates.fileSize);
    }
    if (updates.duration !== undefined) {
      setClauses.push('duration = ?');
      values.push(updates.duration);
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

  deleteByEntryId: async (entryId: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM songs WHERE entry_id = ?', [entryId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  },
};