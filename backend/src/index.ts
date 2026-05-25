import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes';
import subsonicRoutes from './routes/subsonic';
import { logger } from './utils/logger';
import { initDatabase } from './utils/database';

const app = express();
const PORT = process.env.PORT || 3000;
const SUBSONIC_PORT = process.env.SUBSONIC_PORT || 4040;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

const subsonicApp = express();
subsonicApp.use(cors());
subsonicApp.use('/rest', subsonicRoutes);

async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      logger.info(`Main API server running on http://localhost:${PORT}`);
    });

    subsonicApp.listen(SUBSONIC_PORT, () => {
      logger.info(`Subsonic API server running on http://localhost:${SUBSONIC_PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

startServer();