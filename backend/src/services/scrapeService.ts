import axios from 'axios';
import { tagService, ParsedTag } from './tagService';
import { acoustidService } from './acoustidService';
import { settingsRepository } from '../repositories/settingsRepository';
import { logger } from '../utils/logger';
import { ScraperConfig, ScraperUsageConfig, ConflictResolution } from '../types';

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

export interface FullScrapeResult {
  tags: ParsedTag;
  coverArt?: Buffer;
  lyrics?: string;
  sourcesUsed: string[];
}

export const scrapeService = {
  async scrapeSingleFile(filePath: string, options?: ScrapeOptions): Promise<ScrapePreview | null> {
    try {
      const originalTags = await tagService.readTags(filePath);
      const settings = await settingsRepository.get();
      
      const acoustidResult = await acoustidService.matchFingerprint(filePath);
      
      let searchArtist = acoustidResult.artist || originalTags.artist;
      let searchTitle = acoustidResult.title || originalTags.title;
      let searchAlbum = acoustidResult.album || originalTags.album;

      const useFullQuery = acoustidResult.allMatched;
      
      const sources = options?.sources || this.getEnabledScrapers(settings.scrapers, settings.scraperUsage.tags);
      
      const results = await Promise.all(
        sources.map(source => this.fetchFromSourceWithRetry(source, searchArtist, searchTitle, searchAlbum, useFullQuery, settings.scrapers))
      );

      const validResults = results.filter((r): r is ScrapeResult => r !== null);
      
      if (validResults.length === 0) {
        logger.info(`No scrape results for ${filePath}`);
        return null;
      }

      const bestMatch = this.selectBestMatch(validResults);
      let mergedTags = this.mergeTags(originalTags, bestMatch, settings.conflictResolution);

      if (options?.enableLyrics && !mergedTags.lyrics && bestMatch.lyrics) {
        mergedTags.lyrics = bestMatch.lyrics;
      }

      if (options?.enableCoverArt && !mergedTags.coverUrl && bestMatch.coverUrl) {
        mergedTags.coverUrl = bestMatch.coverUrl;
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

  async fullScrape(filePath: string): Promise<FullScrapeResult> {
    const settings = await settingsRepository.get();
    const originalTags = await tagService.readTags(filePath);
    
    const sourcesUsed: string[] = [];
    let finalTags = { ...originalTags };
    let coverArt: Buffer | undefined;
    let lyrics: string | undefined;

    const acoustidResult = await acoustidService.matchFingerprint(filePath);
    
    let searchArtist = acoustidResult.artist || originalTags.artist;
    let searchTitle = acoustidResult.title || originalTags.title;
    let searchAlbum = acoustidResult.album || originalTags.album;

    const useFullQuery = acoustidResult.allMatched;

    const tagScrapers = this.getEnabledScrapers(settings.scrapers, settings.scraperUsage.tags);
    for (const source of tagScrapers) {
      const result = await this.fetchFromSourceWithRetry(source, searchArtist, searchTitle, searchAlbum, useFullQuery, settings.scrapers);
      if (result) {
        finalTags = this.mergeTags(finalTags, result, settings.conflictResolution);
        sourcesUsed.push(source);
        if (finalTags.title && finalTags.artist && finalTags.album) {
          searchTitle = finalTags.title;
          searchArtist = finalTags.artist;
          searchAlbum = finalTags.album;
        }
      }
    }

    if (settings.scraperUsage.cover.length > 0 && !coverArt) {
      const coverScrapers = this.getEnabledScrapers(settings.scrapers, settings.scraperUsage.cover);
      for (const source of coverScrapers) {
        const result = await this.fetchFromSourceWithRetry(source, searchArtist, searchTitle, searchAlbum, true, settings.scrapers);
        if (result && result.coverUrl) {
          try {
            coverArt = await tagService.downloadCoverArtByUrl(result.coverUrl);
            sourcesUsed.push(`${source}-cover`);
            break;
          } catch (error) {
            logger.debug(`Failed to download cover from ${source}:`, error);
          }
        }
      }
    }

    if (settings.scraperUsage.lyrics.length > 0 && !lyrics) {
      const lyricsScrapers = this.getEnabledScrapers(settings.scrapers, settings.scraperUsage.lyrics);
      for (const source of lyricsScrapers) {
        const result = await this.fetchFromSourceWithRetry(source, searchArtist, searchTitle, searchAlbum, true, settings.scrapers);
        if (result && result.lyrics) {
          lyrics = result.lyrics;
          sourcesUsed.push(`${source}-lyrics`);
          break;
        }
      }
    }

    if (settings.traditionalToSimplified) {
      finalTags.title = tagService.traditionalToSimplified(finalTags.title);
      finalTags.artist = tagService.traditionalToSimplified(finalTags.artist);
      finalTags.album = tagService.traditionalToSimplified(finalTags.album);
    }

    return {
      tags: finalTags,
      coverArt,
      lyrics,
      sourcesUsed,
    };
  },

  getEnabledScrapers(allScrapers: ScraperConfig[], dataTypeScrapers: string[]): string[] {
    return dataTypeScrapers
      .map(name => allScrapers.find(s => s.name === name))
      .filter((s): s is ScraperConfig => s !== undefined && s.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(s => s.name);
  },

  async fetchFromSourceWithRetry(
    source: string,
    artist: string,
    title: string,
    album: string,
    useFullQuery: boolean,
    scrapers: ScraperConfig[]
  ): Promise<ScrapeResult | null> {
    const config = scrapers.find(s => s.name === source);
    const retryCount = config?.retryCount || 3;
    const timeout = config?.timeout || 10000;
    const requestInterval = config?.requestInterval || 1000;

    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        const query = useFullQuery ? `${artist} ${title} ${album}` : `${artist} ${title}`;
        logger.debug(`Fetching from ${source} (attempt ${attempt + 1}): ${query}`);
        
        const result = await this.fetchFromSource(source, artist, title, album, useFullQuery, timeout);
        
        if (result) {
          return result;
        }
      } catch (error) {
        logger.debug(`Attempt ${attempt + 1} failed for ${source}:`, error);
      }
      
      if (attempt < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }
    }
    
    return null;
  },

  async fetchFromSource(source: string, artist: string, title: string, album: string, useFullQuery: boolean, timeout: number): Promise<ScrapeResult | null> {
    const axiosConfig = { timeout };
    
    switch (source.toLowerCase()) {
      case 'musicbrainz':
        return this.convertToScrapeResult('musicbrainz', await tagService.fetchFromMusicBrainz(artist, title));
      case 'douban':
        return await tagService.fetchFromDouban(artist, title);
      case 'netease':
        return await tagService.fetchFromNetease(artist, title);
      case 'qqmusic':
        return await tagService.fetchFromQQMusic(artist, title);
      case 'kugou':
        return await tagService.fetchFromKuGou(artist, title);
      case 'migu':
        return await tagService.fetchFromMigu(artist, title);
      case 'spotify':
        return await this.fetchFromSpotify(artist, title, axiosConfig);
      case 'itunes':
        return await this.fetchFromiTunes(artist, title, axiosConfig);
      default:
        logger.warn(`Unknown source: ${source}`);
        return null;
    }
  },

  async fetchFromSpotify(artist: string, title: string, config: { timeout: number }): Promise<ScrapeResult | null> {
    try {
      const response = await axios.get('https://api.spotify.com/v1/search', {
        ...config,
        params: {
          q: `${artist} ${title}`,
          type: 'track',
          limit: 1,
        },
        headers: {
          'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`,
        },
      });

      const result = response.data;
      if (result && result.tracks && result.tracks.items && result.tracks.items.length > 0) {
        const track = result.tracks.items[0];
        return {
          source: 'spotify',
          title: this.stripHtmlTags(track.name),
          artist: this.stripHtmlTags(track.artists?.[0]?.name || artist),
          album: this.stripHtmlTags(track.album?.name || ''),
          trackNumber: track.track_number,
          year: track.album?.release_date ? parseInt(track.album.release_date.split('-')[0]) : undefined,
          coverUrl: track.album?.images?.[0]?.url,
          confidence: 0.85,
        };
      }
    } catch (error) {
      logger.debug(`Spotify fetch failed (requires API key):`, error);
    }
    return null;
  },

  async fetchFromiTunes(artist: string, title: string, config: { timeout: number }): Promise<ScrapeResult | null> {
    try {
      const response = await axios.get('https://itunes.apple.com/search', {
        ...config,
        params: {
          term: `${artist} ${title}`,
          entity: 'song',
          limit: 1,
        },
      });

      const result = response.data;
      if (result && result.results && result.results.length > 0) {
        const track = result.results[0];
        return {
          source: 'itunes',
          title: this.stripHtmlTags(track.trackName || title),
          artist: this.stripHtmlTags(track.artistName || artist),
          album: this.stripHtmlTags(track.collectionName || ''),
          trackNumber: track.trackNumber,
          year: track.releaseDate ? parseInt(track.releaseDate.split('-')[0]) : undefined,
          coverUrl: track.artworkUrl100?.replace('100x100', '600x600'),
          confidence: 0.8,
        };
      }
    } catch (error) {
      logger.debug(`iTunes fetch failed:`, error);
    }
    return null;
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
      coverUrl: data.coverUrl,
      lyrics: data.lyrics,
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
        const resultScore = this.calculateScore(result);
        const bestScore = this.calculateScore(bestMatch);
        if (resultScore > bestScore) {
          bestMatch = result;
        }
      }
    }

    return bestMatch;
  },

  calculateScore(result: ScrapeResult): number {
    let score = 0;
    if (result.title) score += 2;
    if (result.artist) score += 2;
    if (result.album) score += 2;
    if (result.trackNumber) score += 1;
    if (result.year) score += 1;
    if (result.genre) score += 1;
    if (result.coverUrl) score += 1;
    if (result.lyrics) score += 2;
    return score;
  },

  mergeTags(original: ParsedTag, scraped: ScrapeResult, conflictResolution: ConflictResolution): ParsedTag {
    const strategy = conflictResolution.strategy;
    
    return {
      title: this.resolveConflict(original.title, scraped.title, strategy),
      artist: this.resolveConflict(original.artist, scraped.artist, strategy),
      album: this.resolveConflict(original.album, scraped.album, strategy),
      trackNumber: this.resolveNumberConflict(original.trackNumber, scraped.trackNumber, strategy),
      year: this.resolveNumberConflict(original.year, scraped.year, strategy),
      genre: this.resolveConflict(original.genre || '', scraped.genre || '', strategy) || null,
      duration: original.duration,
      coverUrl: this.resolveConflict(original.coverUrl || '', scraped.coverUrl || '', strategy) || undefined,
      lyrics: scraped.lyrics || original.lyrics,
    };
  },

  resolveConflict(original: string, scraped: string, strategy: ConflictResolution['strategy']): string {
    if (!scraped) return original;
    if (!original || original.toLowerCase().includes('unknown')) return scraped;
    
    switch (strategy) {
      case 'original':
        return original;
      case 'scraped':
        return scraped;
      case 'manual':
      default:
        return scraped;
    }
  },

  resolveNumberConflict(original: number | null, scraped: number | undefined, strategy: ConflictResolution['strategy']): number | null {
    if (scraped === undefined) return original;
    if (original === null) return scraped;
    
    switch (strategy) {
      case 'original':
        return original;
      case 'scraped':
        return scraped;
      case 'manual':
      default:
        return scraped;
    }
  },

  stripHtmlTags(text: string): string {
    if (!text) return text;
    return text.replace(/<[^>]+>/g, '').trim();
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

  async downloadCoverFromUrl(url: string): Promise<Buffer | null> {
    try {
      const response = await tagService.downloadCoverArtByUrl(url);
      return response;
    } catch (error) {
      logger.error(`Failed to download cover from URL: ${url}`, error);
      return null;
    }
  },

  async fetchArtistImage(artistName: string): Promise<string | null> {
    try {
      const searchResponse = await axios.get('https://music.163.com/api/search/pc', {
        params: {
          s: artistName,
          type: 100,
          limit: 1,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://music.163.com',
        },
      });

      const result = searchResponse.data;
      if (result && result.result && result.result.artists && result.result.artists.length > 0) {
        const artist = result.result.artists[0];
        return artist.img1v1Url || artist.picUrl || null;
      }
    } catch (error) {
      logger.warn(`Failed to fetch artist image for ${artistName}`, error);
    }
    return null;
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

  async fetchCoverForAlbum(artistName: string, albumName: string): Promise<Buffer | null> {
    try {
      const settings = await settingsRepository.get();
      const coverScrapers = this.getEnabledScrapers(settings.scrapers, settings.scraperUsage.cover);
      
      for (const source of coverScrapers) {
        try {
          const result = await this.fetchFromSource(source, artistName, '', albumName, true, settings.scrapers[0]?.timeout || 10000);
          
          if (result && result.coverUrl) {
            logger.info(`Found cover URL from ${source} for ${artistName} - ${albumName}`);
            const coverArt = await this.downloadCoverFromUrl(result.coverUrl);
            if (coverArt) {
              return coverArt;
            }
          }
        } catch (error) {
          logger.debug(`Failed to fetch cover from ${source} for ${artistName} - ${albumName}:`, error);
        }
      }
      
      try {
        return await tagService.downloadCoverArt(artistName, albumName);
      } catch (error) {
        logger.debug(`Failed to download cover from MusicBrainz for ${artistName} - ${albumName}:`, error);
      }
      
      return null;
    } catch (error) {
      logger.error(`Failed to fetch cover for ${artistName} - ${albumName}:`, error);
      return null;
    }
  },

  async fetchCoverForAlbumFromFile(albumId: string): Promise<Buffer | null> {
    try {
      const songEntryRepository = await import('../repositories/songEntryRepository');
      const songRepository = await import('../repositories/songRepository');
      const mm = await import('music-metadata');
      
      const entries = await songEntryRepository.songEntryRepository.getByAlbumId(albumId);
      
      for (const entry of entries) {
        const songs = await songRepository.songRepository.getByEntryId(entry.id);
        
        for (const song of songs) {
          try {
            const metadata = await mm.parseFile(song.filePath);
            
            if (metadata.common.picture && metadata.common.picture.length > 0) {
              const picture = metadata.common.picture[0];
              return Buffer.from(picture.data);
            }
          } catch (error) {
            logger.debug(`Failed to read metadata from ${song.filePath}:`, error);
          }
        }
      }
    } catch (error) {
      logger.warn(`Failed to extract cover from album ${albumId}:`, error);
    }
    return null;
  },
};

export interface ScrapeResult {
  source: string;
  title: string;
  artist: string;
  album: string;
  trackNumber?: number;
  year?: number;
  genre?: string;
  coverUrl?: string;
  lyrics?: string;
  confidence: number;
}