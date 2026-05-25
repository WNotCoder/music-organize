import db from '../utils/database';
import { Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const taskRepository = {
  getAll: async (): Promise<Task[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, type, status, progress, message, created_at as createdAt,
               started_at as startedAt, completed_at as completedAt
        FROM tasks
        ORDER BY created_at DESC
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Task[]);
      });
    });
  },

  getById: async (id: string): Promise<Task | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id, type, status, progress, message, created_at as createdAt,
               started_at as startedAt, completed_at as completedAt
        FROM tasks
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Task || null);
      });
    });
  },

  create: async (type: string): Promise<Task> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO tasks (id, type) VALUES (?, ?)', [id, type], async function(err) {
        if (err) reject(err);
        else {
          const result = await taskRepository.getById(id);
          if (result) resolve(result);
          else reject(new Error('Failed to create task'));
        }
      });
    });
  },

  updateStatus: async (id: string, status: Task['status'], progress?: number, message?: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const setParts: string[] = ['status = ?'];
      const values: unknown[] = [status];

      if (progress !== undefined) {
        setParts.push('progress = ?');
        values.push(progress);
      }
      if (message !== undefined) {
        setParts.push('message = ?');
        values.push(message);
      }
      if (status === 'running' && !progress) {
        setParts.push('started_at = CURRENT_TIMESTAMP');
      }
      if (status === 'completed' || status === 'failed') {
        setParts.push('completed_at = CURRENT_TIMESTAMP');
      }

      values.push(id);

      db.run(`UPDATE tasks SET ${setParts.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  delete: async (id: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  getRunningTasks: async (): Promise<Task[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, type, status, progress, message, created_at as createdAt,
               started_at as startedAt, completed_at as completedAt
        FROM tasks
        WHERE status = 'running'
      `, (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Task[]);
      });
    });
  },
};
