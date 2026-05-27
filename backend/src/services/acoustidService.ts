import axios from 'axios';
import * as mm from 'music-metadata';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import { AcoustidMatchResult } from '../types';
import { settingsRepository } from '../repositories/settingsRepository';

const execFileAsync = promisify(execFile);

const ACOUSTID_URL = 'https://api.acoustid.org/v2/lookup';
const FPCALC_TIMEOUT = 30000;

export const acoustidService = {
  async matchFingerprint(filePath: string): Promise<AcoustidMatchResult> {
    const settings = await settingsRepository.get();
    const acoustidConfig = settings.acoustid;
    
    if (!acoustidConfig.enabled) {
      logger.debug(`Acoustid service is disabled, skipping fingerprint match for ${filePath}`);
      return { success: false, allMatched: false, confidence: 0 };
    }

    if (!acoustidConfig.apiKey) {
      logger.debug(`Acoustid API key is not set, skipping fingerprint match for ${filePath}`);
      return { success: false, allMatched: false, confidence: 0 };
    }

    try {
      const fingerprint = await this.extractFingerprint(filePath, acoustidConfig.minDuration);
      
      if (!fingerprint) {
        logger.debug(`Failed to extract fingerprint from ${filePath}`);
        return { success: false, allMatched: false, confidence: 0 };
      }

      const result = await this.lookupFingerprint(fingerprint.fingerprint, fingerprint.duration, acoustidConfig);
      
      if (!result.success) {
        return result;
      }

      if (result.confidence < acoustidConfig.confidenceThreshold) {
        logger.debug(`Acoustid confidence ${result.confidence} below threshold ${acoustidConfig.confidenceThreshold} for ${filePath}`);
        return { success: false, allMatched: false, confidence: 0 };
      }

      const { title, artist, album } = result;
      const allMatched = !!(title && artist && album);
      
      return {
        success: true,
        title,
        artist,
        album,
        allMatched,
        confidence: result.confidence,
      };
    } catch (error) {
      logger.error(`Acoustid match failed for ${filePath}:`, error);
      return { success: false, allMatched: false, confidence: 0 };
    }
  },

  async extractFingerprint(filePath: string, minDuration: number): Promise<{ fingerprint: string; duration: number } | null> {
    try {
      const metadata = await mm.parseFile(filePath);
      const duration = metadata.format.duration || 0;
      
      if (duration < minDuration) {
        logger.debug(`File too short for fingerprint extraction: ${filePath}`);
        return null;
      }

      const fingerprint = await this.generateFingerprint(filePath);
      if (!fingerprint) {
        return null;
      }

      return {
        fingerprint,
        duration: Math.round(duration),
      };
    } catch (error) {
      logger.warn(`Failed to extract fingerprint from ${filePath}:`, error);
      return null;
    }
  },

  async generateFingerprint(filePath: string): Promise<string | null> {
    try {
      const { stdout } = await execFileAsync('fpcalc', [filePath], { timeout: FPCALC_TIMEOUT });
      const fingerprint = this.parseFpcalcOutput(stdout);
      if (fingerprint) {
        logger.debug(`Generated fingerprint for ${filePath}`);
        return fingerprint;
      }
      logger.warn(`No fingerprint in fpcalc output for ${filePath}`);
      return null;
    } catch (error) {
      logger.error(`Acoustid fingerprint generation failed for ${filePath}. Please install Chromaprint tools from https://acoustid.org/chromaprint.php. Falling back to file tags only.`, error);
      return null;
    }
  },

  parseFpcalcOutput(output: string): string | null {
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.startsWith('FINGERPRINT=')) {
        return line.substring('FINGERPRINT='.length);
      }
    }
    return null;
  },

  stripHtmlTags(text: string): string {
    if (!text) return text;
    return text.replace(/<[^>]+>/g, '').trim();
  },

  async lookupFingerprint(fingerprint: string, duration: number, acoustidConfig: { apiKey: string; timeout: number }): Promise<AcoustidMatchResult> {
    try {
      const settings = await settingsRepository.get();
      
      logger.debug(`Acoustid lookup - fingerprint: ${fingerprint.substring(0, 20)}..., duration: ${duration}, apiKey: ${acoustidConfig.apiKey.substring(0, 5)}...`);
      
      const response = await axios.get(ACOUSTID_URL, {
        params: {
          client: acoustidConfig.apiKey,
          fingerprint,
          duration,
          format: 'json',
          meta: 'recordings+releasegroups+tracks',
        },
        timeout: acoustidConfig.timeout,
      });

      const data = response.data;
      
      if (!data || data.status !== 'ok') {
        logger.debug(`Acoustid API returned error: ${data?.error?.message || 'unknown error'}, code: ${data?.error?.code}`);
        return { success: false, allMatched: false, confidence: 0 };
      }

      const results = data.results || [];
      if (results.length === 0) {
        logger.debug('No Acoustid matches found');
        return { success: false, allMatched: false, confidence: 0 };
      }

      const bestResult = results[0];
      const recordings = bestResult.recordings || [];
      
      if (recordings.length === 0) {
        return { success: false, allMatched: false, confidence: 0 };
      }

      const recording = recordings[0];
      let title = this.stripHtmlTags(recording.title || '');
      let artist = '';
      let album = '';

      if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
        artist = recording['artist-credit'].map((ac: { name: string }) => this.stripHtmlTags(ac.name)).join(settings.artistSeparator);
      }

      const releaseGroups = recording['releasegroups'] || [];
      if (releaseGroups.length > 0) {
        album = this.stripHtmlTags(releaseGroups[0].title || '');
      }

      const allMatched = !!(title && artist && album);
      const confidence = bestResult.score || (allMatched ? 0.95 : 0.7);
      
      return {
        success: true,
        title,
        artist,
        album,
        allMatched,
        confidence,
      };
    } catch (error: any) {
      const status = error.response?.status;
      const responseData = error.response?.data ? JSON.stringify(error.response.data) : null;
      logger.warn(`Acoustid lookup failed - status: ${status}, response: ${responseData}, message: ${error.message}`);
      return { success: false, allMatched: false, confidence: 0 };
    }
  },
};