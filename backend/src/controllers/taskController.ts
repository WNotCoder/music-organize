import { Request, Response } from 'express';
import { taskRepository } from '../repositories/taskRepository';

export const taskController = {
  async getTasks(req: Request, res: Response) {
    try {
      const tasks = await taskRepository.getAll();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async getTaskById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const task = await taskRepository.getById(id);
      if (task) {
        res.json(task);
      } else {
        res.status(404).json({ error: '任务不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },

  async deleteTask(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await taskRepository.delete(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, error: '任务不存在' });
      }
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  },
};
