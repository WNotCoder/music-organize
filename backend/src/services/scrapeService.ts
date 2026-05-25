import { tagService, ScrapeResult, ParsedTag } from './tagService';
import { logger } from '../utils/logger';

export interface ScrapeOptions {
  sources?: string[];
  enableLyrics?: boolean;
  enableCoverArt?: boolean;
}

export interface ScrapeCandidate {
  filePath: string;
  tags: ParsedTag;
}

export interface ScrapePreview {
  filePath: string;
  originalTags: ParsedTag;
  suggestedTags: ParsedTag;
  matchedSource: string;
  confidence: number;
}

export interface BatchScrapeResult {
  previews: ScrapePreview[];
  totalFiles: number;
  matchedCount: number;
  unmatchedCount: number;
}

const DEFAULT_SOURCES = ['netease', 'musicbrainz', 'douban'];

export const scrapeService = {
  async scrapeSingleFile(filePath: string, options?: ScrapeOptions): Promise<ScrapePreview | null> {
    try {
      const originalTags = await tagService.readTags(filePath);
      const sources = options?.sources || DEFAULT_SOURCES;
      
      const results = await Promise.all(
        sources.map(source => this.fetchFromSource(source, originalTags.artist, originalTags.title))
      );

      const validResults = results.filter((r): r is ScrapeResult => r !== null);
      
      if (validResults.length === 0) {
        logger.info(`No scrape results for ${filePath}`);
        return null;
      }

      const bestMatch = this.selectBestMatch(validResults);
      const mergedTags = this.mergeTags(originalTags, bestMatch);

      if (options?.enableLyrics && !mergedTags.lyrics && bestMatch.lyrics) {
        mergedTags.lyrics = bestMatch.lyrics;
      }

      return {
        filePath,
        originalTags,
        suggestedTags: mergedTags,
        matchedSource: bestMatch.source,
        confidence: bestMatch.confidence,
      };
    } catch (error) {
      logger.error(`Failed to scrape file ${filePath}:`, error);
      return null;
    }
  },

  async batchScrape(files: string[], options?: ScrapeOptions): Promise<BatchScrapeResult> {
    const previews: ScrapePreview[] = [];
    
    for (const filePath of files) {
      const preview = await this.scrapeSingleFile(filePath, options);
      if (preview) {
        previews.push(preview);
      }
    }

    return {
      previews,
      totalFiles: files.length,
      matchedCount: previews.length,
      unmatchedCount: files.length - previews.length,
    };
  },

  async fetchFromSource(source: string, artist: string, title: string): Promise<ScrapeResult | null> {
    switch (source.toLowerCase()) {
      case 'musicbrainz':
        return this.convertToScrapeResult('musicbrainz', await tagService.fetchFromMusicBrainz(artist, title));
      case 'douban':
        return await tagService.fetchFromDouban(artist, title);
      case 'netease':
        return await tagService.fetchFromNetease(artist, title);
      default:
        logger.warn(`Unknown source: ${source}`);
        return null;
    }
  },

  convertToScrapeResult(source: string, data: Partial<ParsedTag> | null): ScrapeResult | null {
    if (!data) return null;
    
    return {
      source,
      title: data.title || '',
      artist: data.artist || '',
      album: data.album || '',
      trackNumber: data.trackNumber !== null ? data.trackNumber : undefined,
      year: data.year !== null ? data.year : undefined,
      genre: data.genre || undefined,
      confidence: 0.8,
    };
  },

  selectBestMatch(results: ScrapeResult[]): ScrapeResult {
    if (results.length === 0) {
      throw new Error('No results to select from');
    }

    if (results.length === 1) {
      return results[0];
    }

    let bestMatch = results[0];
    
    for (const result of results.slice(1)) {
      if (result.confidence > bestMatch.confidence) {
        bestMatch = result;
      } else if (result.confidence === bestMatch.confidence) {
        if (result.lyrics && !bestMatch.lyrics) {
          bestMatch = result;
        } else if (result.coverUrl && !bestMatch.coverUrl) {
          bestMatch = result;
        }
      }
    }

    return bestMatch;
  },

  mergeTags(original: ParsedTag, scraped: ScrapeResult): ParsedTag {
    return {
      title: scraped.title || original.title,
      artist: scraped.artist || original.artist,
      album: scraped.album || original.album,
      trackNumber: scraped.trackNumber !== undefined ? scraped.trackNumber : original.trackNumber,
      year: scraped.year !== undefined ? scraped.year : original.year,
      genre: scraped.genre || original.genre,
      duration: original.duration,
      lyrics: scraped.lyrics,
    };
  },

  async downloadCoverFromUrl(url: string): Promise<Buffer | null> {
    try {
      const response = await tagService.downloadCoverArtByUrl(url);
      return response;
    } catch (error) {
      logger.error(`Failed to download cover from URL: ${url}`, error);
      return null;
    }
  },

  async writeTagsToFile(filePath: string, tags: ParsedTag): Promise<boolean> {
    try {
      await tagService.writeTags(filePath, tags);
      return true;
    } catch (error) {
      logger.error(`Failed to write tags to ${filePath}:`, error);
      return false;
    }
  },
};
