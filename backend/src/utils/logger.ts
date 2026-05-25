import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || './logs';

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

const getLogFileName = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.log`;
};

const writeToFile = (level: string, message: string, ...args: unknown[]) => {
  const logLine = `${getTimestamp()} [${level}] ${message}${args.length > 0 ? ' ' + JSON.stringify(args) : ''}\n`;
  const logFilePath = path.join(LOG_DIR, getLogFileName());
  
  fs.appendFile(logFilePath, logLine, (err) => {
    if (err) {
      console.error(`Failed to write to log file: ${err.message}`);
    }
  });
};

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${message}`, ...args);
    writeToFile('INFO', message, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args);
    writeToFile('ERROR', message, ...args);
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args);
    writeToFile('WARN', message, ...args);
  },
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      console.debug(`[DEBUG] ${message}`, ...args);
      writeToFile('DEBUG', message, ...args);
    }
  },
  scan: (message: string, ...args: unknown[]) => {
    const prefix = '[SCAN]';
    console.log(`${prefix} ${message}`, ...args);
    writeToFile('SCAN', message, ...args);
  },
  scrape: (message: string, ...args: unknown[]) => {
    const prefix = '[SCRAPE]';
    console.log(`${prefix} ${message}`, ...args);
    writeToFile('SCRAPE', message, ...args);
  },
  task: (message: string, ...args: unknown[]) => {
    const prefix = '[TASK]';
    console.log(`${prefix} ${message}`, ...args);
    writeToFile('TASK', message, ...args);
  },
};
