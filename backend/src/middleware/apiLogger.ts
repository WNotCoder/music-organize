import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const apiLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, originalUrl, query, body } = req;
  
  const requestBody = body && typeof body === 'object' && !Buffer.isBuffer(body) 
    ? (body as Record<string, unknown>) 
    : undefined;

  logger.apiRequest(method, originalUrl, query as Record<string, unknown>, requestBody);

  const originalSend = res.send;
  const originalJson = res.json;
  
  let responseBody: unknown;

  res.send = function(this: Response, body?: unknown) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  res.json = function(this: Response, body?: unknown) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.apiResponse(method, originalUrl, res.statusCode, durationMs, responseBody);
  });

  next();
};