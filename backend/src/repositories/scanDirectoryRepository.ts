import db from '../utils/database';
import { ScanDirectory } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const scanDirectoryRepository = {
  getAll: async (): Promise<ScanDirectory[]> => {
    return new Promise((resolve, reject) => {
      db.all('SELECT id, path, name, created_at as createdAt FROM scan_directories ORDER BY name', (err, rows) => {
        if (err) reject(err);
        else resolve(rows as ScanDirectory[]);
      });
    });
  },

  getById: async (id: string): Promise<ScanDirectory | null> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, path, name, created_at as createdAt FROM scan_directories WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as ScanDirectory || null);
      });
    });
  },

  create: async (path: string, name: string): Promise<ScanDirectory> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO scan_directories (id, path, name) VALUES (?, ?, ?)', [id, path, name], async function(err) {
        if (err) reject(err);
        else {
          const result = await scanDirectoryRepository.getById(id);
          if (result) resolve(result);
          else reject(new Error('Failed to create scan directory'));
        }
      });
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM scan_directories WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },
};
