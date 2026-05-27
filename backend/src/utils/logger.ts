import fs from 'fs';
import path from 'path';

const LOG_DIR = process.env.LOG_DIR || './logs';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const startTime = new Date();
const processId = process.pid;
const startTimestamp = startTime.toISOString().replace(/[:.]/g, '-');
const logFileName = `music-organize-${startTimestamp}.log`;

let logFileHandle: fs.WriteStream | null = null;

const getTimestamp = () => {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}.${pad(Math.floor(now.getMilliseconds() / 10))}`;
};

const initLogFile = () => {
  if (!logFileHandle) {
    const logFilePath = path.join(LOG_DIR, logFileName);
    logFileHandle = fs.createWriteStream(logFilePath, { flags: 'a' });
    
    const startupInfo = `[STARTUP] =========================================
[STARTUP] Music Organize Service Starting
[STARTUP] =========================================
[STARTUP] Timestamp: ${startTime.toISOString()}
[STARTUP] Process ID: ${processId}
[STARTUP] Node.js Version: ${process.version}
[STARTUP] Platform: ${process.platform} ${process.arch}
[STARTUP] Working Directory: ${process.cwd()}
[STARTUP] Log File: ${logFilePath}
[STARTUP] Log Level: ${LOG_LEVEL.toUpperCase()}
[STARTUP] =========================================\n`;
    
    logFileHandle.write(startupInfo);
    console.log(startupInfo);
  }
};

const writeToFile = (level: string, message: string, context?: Record<string, unknown>) => {
  if (!logFileHandle) {
    initLogFile();
  }
  
  const timestamp = getTimestamp();
  let logLine = `${timestamp} [${level.toUpperCase()}] [PID:${processId}] ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    try {
      const contextStr = JSON.stringify(context);
      logLine += ` | Context: ${contextStr.length > 2000 ? contextStr.substring(0, 2000) + '...' : contextStr}`;
    } catch {
      logLine += ` | Context: [serialization error]`;
    }
  }
  
  logLine += '\n';
  
  logFileHandle!.write(logLine, (err) => {
    if (err) {
      console.error(`[LOGGER ERROR] Failed to write to log file: ${err.message}`);
    }
  });
};

const shouldLog = (level: string): boolean => {
  const currentLevel = LOG_LEVELS[LOG_LEVEL as keyof typeof LOG_LEVELS] || LOG_LEVELS.info;
  const messageLevel = LOG_LEVELS[level as keyof typeof LOG_LEVELS] || LOG_LEVELS.info;
  return messageLevel >= currentLevel;
};

const getCallerInfo = (): string => {
  const stack = new Error().stack;
  if (!stack) return '';
  
  const lines = stack.split('\n');
  let callerLine = lines[4] || lines[3] || '';
  
  const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
  if (match) {
    const functionName = match[1].replace(/^.*\./, '');
    const filePath = path.basename(match[2]);
    return `${functionName}@${filePath}:${match[3]}`;
  }
  
  return '';
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[INFO] ${message}${caller ? ` (${caller})` : ''}`;
    console.log(output);
    writeToFile('INFO', message, context);
  },
  
  error: (message: string, ...args: unknown[]) => {
    if (!shouldLog('error')) return;
    const caller = getCallerInfo();
    let output = `[ERROR] ${message}${caller ? ` (${caller})` : ''}`;
    let error: Error | undefined;
    let context: Record<string, unknown> | undefined;
    
    if (args.length > 0) {
      if (args[0] instanceof Error) {
        error = args[0];
        context = args.length > 1 && isRecord(args[1]) ? args[1] : undefined;
      } else if (isRecord(args[0])) {
        context = args[0];
      } else {
        context = { errorDetails: String(args[0]) };
      }
    }
    
    if (error) {
      output += `\n        ├─ Message: ${error.message}`;
      if (error.stack) {
        output += `\n        └─ Stack: ${error.stack.split('\n').slice(1).join('\n                 ')}`;
      }
      const errorContext = {
        ...context,
        errorMessage: error.message,
        errorStack: error.stack
      };
      writeToFile('ERROR', message, errorContext);
    } else {
      writeToFile('ERROR', message, context);
    }
    
    console.error(output);
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (!shouldLog('warn')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[WARN] ${message}${caller ? ` (${caller})` : ''}`;
    console.warn(output);
    writeToFile('WARN', message, context);
  },
  
  debug: (message: string, ...args: unknown[]) => {
    if (!shouldLog('debug')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[DEBUG] ${message}${caller ? ` (${caller})` : ''}`;
    console.debug(output);
    writeToFile('DEBUG', message, context);
  },
  
  scan: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[SCAN] ${message}${caller ? ` (${caller})` : ''}`;
    console.log(output);
    writeToFile('SCAN', message, context);
  },
  
  scrape: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[SCRAPE] ${message}${caller ? ` (${caller})` : ''}`;
    console.log(output);
    writeToFile('SCRAPE', message, context);
  },
  
  task: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[TASK] ${message}${caller ? ` (${caller})` : ''}`;
    console.log(output);
    writeToFile('TASK', message, context);
  },
  
  apiRequest: (method: string, path: string, query?: Record<string, unknown>, body?: unknown) => {
    if (!shouldLog('info')) return;
    const context: Record<string, unknown> = { method, path };
    if (query && Object.keys(query).length > 0) {
      context.query = query;
    }
    if (body && isRecord(body)) {
      context.body = body;
    }
    const output = `[API] REQUEST: ${method} ${path}`;
    console.log(output);
    writeToFile('API', `REQUEST: ${method} ${path}`, context);
  },
  
  apiResponse: (method: string, path: string, statusCode: number, durationMs: number, responseBody?: unknown) => {
    if (!shouldLog('info')) return;
    const context: Record<string, unknown> = {
      method,
      path,
      statusCode,
      durationMs
    };
    if (responseBody !== undefined) {
      context.responseBody = isRecord(responseBody) ? responseBody : { value: String(responseBody) };
    }
    const output = `[API] RESPONSE: ${method} ${path} ${statusCode} (${durationMs}ms)`;
    console.log(output);
    writeToFile('API', `RESPONSE: ${method} ${path} ${statusCode} (${durationMs}ms)`, context);
  },
  
  taskSuccess: (taskType: string, taskId: string, result: Record<string, unknown>) => {
    if (!shouldLog('info')) return;
    const context = { taskType, taskId, ...result };
    const output = `[TASK] SUCCESS: ${taskType} (${taskId})`;
    console.log(output);
    writeToFile('TASK', `SUCCESS: ${taskType} (${taskId})`, context);
  },
  
  taskFailure: (taskType: string, taskId: string, error: Error | string) => {
    if (!shouldLog('info')) return;
    const context: Record<string, unknown> = { taskType, taskId };
    if (error instanceof Error) {
      context.errorMessage = error.message;
      context.errorStack = error.stack;
    } else {
      context.errorMessage = error;
    }
    const output = `[TASK] FAILURE: ${taskType} (${taskId}) - ${error instanceof Error ? error.message : error}`;
    console.log(output);
    writeToFile('TASK', `FAILURE: ${taskType} (${taskId})`, context);
  },
  
  system: (message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const caller = getCallerInfo();
    const context = args.length > 0 && isRecord(args[0]) ? args[0] : undefined;
    const output = `[SYSTEM] ${message}${caller ? ` (${caller})` : ''}`;
    console.log(output);
    writeToFile('SYSTEM', message, context);
  },
  
  db: (operation: string, table: string, durationMs: number, context?: Record<string, unknown>) => {
    if (!shouldLog('debug')) return;
    const logContext = {
      operation,
      table,
      durationMs,
      ...context
    };
    const output = `[DB] ${operation} ${table} (${durationMs}ms)`;
    console.debug(output);
    writeToFile('DB', `${operation} ${table}`, logContext);
  },
  
  shutdown: () => {
    const shutdownTime = new Date();
    const uptime = shutdownTime.getTime() - startTime.getTime();
    const uptimeStr = `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m ${Math.floor((uptime % 60000) / 1000)}s`;
    
    const shutdownInfo = `\n[SHUTDOWN] =========================================
[SHUTDOWN] Music Organize Service Stopping
[SHUTDOWN] =========================================
[SHUTDOWN] Timestamp: ${shutdownTime.toISOString()}
[SHUTDOWN] Uptime: ${uptimeStr}
[SHUTDOWN] =========================================\n`;
    
    if (logFileHandle) {
      logFileHandle.write(shutdownInfo);
      logFileHandle.end();
    }
    console.log(shutdownInfo);
  }
};

initLogFile();

process.on('exit', () => {
  logger.shutdown();
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});