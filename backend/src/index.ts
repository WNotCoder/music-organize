import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import routes from './routes';
import subsonicRoutes from './routes/subsonic';
import { logger } from './utils/logger';
import { initDatabase } from './utils/database';
import { albumRepository } from './repositories/albumRepository';
import { artistRepository } from './repositories/artistRepository';
import { taskRepository } from './repositories/taskRepository';
import { apiLogger } from './middleware/apiLogger';
import fs from 'fs';
import http from 'http';
import { scanService } from './services/scanService';

logger.info('Starting Music Organize application...');
logger.info('Loading environment variables', { 
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  SUBSONIC_PORT: process.env.SUBSONIC_PORT,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
});

const app = express();
const PORT = process.env.PORT || 3000;
const SUBSONIC_PORT = process.env.SUBSONIC_PORT || 4040;

let mainServer: http.Server | null = null;
let subsonicServer: http.Server | null = null;

logger.debug('Initializing Express middleware...');
app.use(cors());
app.use(express.json());
app.use(apiLogger);

logger.debug('Setting up routes...');
app.use('/api', routes);

app.get('/covers/:albumId', async (req, res) => {
  try {
    const { albumId } = req.params;
    const album = await albumRepository.getById(albumId);
    
    if (!album || !album.coverPath) {
      return res.status(404).send('Cover not found');
    }
    
    if (!fs.existsSync(album.coverPath)) {
      return res.status(404).send('Cover file not found');
    }
    
    const ext = path.extname(album.coverPath).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.sendFile(album.coverPath);
  } catch (error) {
    logger.error('Error serving album cover:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/artist-covers/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const artist = await artistRepository.getById(artistId);
    
    if (!artist || !artist.coverPath) {
      return res.status(404).send('Artist cover not found');
    }
    
    if (!fs.existsSync(artist.coverPath)) {
      return res.status(404).send('Artist cover file not found');
    }
    
    const ext = path.extname(artist.coverPath).toLowerCase();
    const contentType = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
    }[ext] || 'image/jpeg';
    
    res.set('Content-Type', contentType);
    res.sendFile(artist.coverPath);
  } catch (error) {
    logger.error('Error serving artist cover:', error);
    res.status(500).send('Internal server error');
  }
});

const subsonicApp = express();
subsonicApp.use(cors());
subsonicApp.use('/rest', subsonicRoutes);

export let isShuttingDown = false;

async function stopAllTasks() {
  logger.info('Stopping all running tasks...');
  const runningTasks = await taskRepository.getRunningTasks();
  
  let stoppedCount = 0;
  
  for (const task of runningTasks) {
    if (task.type === 'scan') {
      await scanService.stopScan();
      stoppedCount++;
    } else {
      await taskRepository.updateStatus(task.id, 'failed', task.progress, '任务已被系统终止');
      stoppedCount++;
    }
  }
  
  logger.info(`Stopped ${stoppedCount} running tasks`);
  return stoppedCount;
}

async function shutdownServer() {
  if (isShuttingDown) {
    logger.warn('Shutdown already in progress');
    return false;
  }
  
  isShuttingDown = true;
  logger.info('Initiating server shutdown...');
  
  await stopAllTasks();
  
  if (mainServer) {
    mainServer.close(() => {
      logger.info('Main server closed');
    });
  }
  
  if (subsonicServer) {
    subsonicServer.close(() => {
      logger.info('Subsonic server closed');
    });
  }
  
  setTimeout(() => {
    logger.info('Shutting down process...');
    process.exit(0);
  }, 1000);
  
  return true;
}

async function startServer() {
  try {
    logger.info('Initializing database connection...');
    await initDatabase();
    logger.info('Database initialization completed successfully');

    logger.info('Starting Main API server...', { port: PORT });
    mainServer = app.listen(PORT, () => {
      logger.info(`Main API server started successfully`, { 
        url: `http://localhost:${PORT}`,
        port: PORT 
      });
    });

    logger.info('Starting Subsonic API server...', { port: SUBSONIC_PORT });
    subsonicServer = subsonicApp.listen(SUBSONIC_PORT, () => {
      logger.info(`Subsonic API server started successfully`, { 
        url: `http://localhost:${SUBSONIC_PORT}`,
        port: SUBSONIC_PORT 
      });
    });

    logger.info('Music Organize application started successfully');
  } catch (error) {
    logger.error('Failed to start application', error, { 
      errorType: error instanceof Error ? error.name : 'Unknown'
    });
    process.exit(1);
  }
}

export { stopAllTasks, shutdownServer };

startServer();