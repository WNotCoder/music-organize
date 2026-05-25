import * as mm from 'music-metadata';
import path from 'path';
import axios from 'axios';
import { logger } from '../utils/logger';

export interface ParsedTag {
  title: string;
  artist: string;
  album: string;
  trackNumber: number | null;
  year: number | null;
  genre: string | null;
  duration: number;
  coverArt?: Buffer;
  lyrics?: string;
}

export interface ScrapeSource {
  name: string;
  priority: number;
}

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

export const tagService = {
  async readTags(filePath: string): Promise<ParsedTag> {
    try {
      const metadata = await mm.parseFile(filePath);
      const { common, format } = metadata;

      let artist = common.artist || common.albumartist || '';
      let title = common.title || '';
      let album = common.album || '';

      if (!artist || !title) {
        const parsed = this.parseFromFilename(path.basename(filePath));
        if (!artist) artist = parsed.artist;
        if (!title) title = parsed.title;
        if (!album) album = parsed.album;
      }

      return {
        title: title || 'Unknown Title',
        artist: artist || 'Unknown Artist',
        album: album || 'Unknown Album',
        trackNumber: common.track?.no || null,
        year: common.year || null,
        genre: common.genre?.[0] || null,
        duration: format.duration || 0,
      };
    } catch (error) {
      logger.error(`Error reading tags from ${filePath}:`, error);
      const parsed = this.parseFromFilename(path.basename(filePath));
      return {
        title: parsed.title || 'Unknown Title',
        artist: parsed.artist || 'Unknown Artist',
        album: parsed.album || 'Unknown Album',
        trackNumber: null,
        year: null,
        genre: null,
        duration: 0,
      };
    }
  },

  parseFromFilename(filename: string): { artist: string; title: string; album: string } {
    const name = path.parse(filename).name;
    
    const dashPattern = /^(.+?)\s*[-–—]\s*(.+)$/;
    const bracketPattern = /^(.+?)\s*\[(.*?)\]\s*(.+)$/;
    
    let artist = '';
    let title = name;
    let album = '';

    const dashMatch = name.match(dashPattern);
    if (dashMatch) {
      artist = dashMatch[1].trim();
      title = dashMatch[2].trim();
    }

    const bracketMatch = name.match(bracketPattern);
    if (bracketMatch) {
      artist = bracketMatch[1].trim() || artist;
      album = bracketMatch[2].trim();
      title = bracketMatch[3].trim();
    }

    return { artist, title, album };
  },

  async fetchFromMusicBrainz(artist: string, title: string): Promise<Partial<ParsedTag> | null> {
    try {
      const response = await axios.get('https://musicbrainz.org/ws/2/recording', {
        params: {
          query: `artist:"${encodeURIComponent(artist)}" AND recording:"${encodeURIComponent(title)}"`,
          fmt: 'json',
          limit: 1,
        },
        headers: {
          'User-Agent': 'MusicOrganize/1.0.0 (https://example.com)',
        },
      });

      const recordings = response.data.recordings;
      if (recordings && recordings.length > 0) {
        const recording = recordings[0];
        const result: Partial<ParsedTag> = {
          title: recording.title,
        };

        if (recording['release-list'] && recording['release-list'].length > 0) {
          const release = recording['release-list'][0];
          result.album = release.title;
          result.year = release.date ? parseInt(release.date.split('-')[0]) : null;
        }

        if (recording['artist-credit'] && recording['artist-credit'].length > 0) {
          result.artist = recording['artist-credit'].map((ac: { name: string }) => ac.name).join(', ');
        }

        return result;
      }
    } catch (error) {
      logger.warn(`Failed to fetch from MusicBrainz for ${artist} - ${title}`, error);
    }
    return null;
  },

  async downloadCoverArt(artist: string, album: string): Promise<Buffer | null> {
    try {
      const response = await axios.get('https://musicbrainz.org/ws/2/release', {
        params: {
          query: `artist:"${encodeURIComponent(artist)}" AND release:"${encodeURIComponent(album)}"`,
          fmt: 'json',
          limit: 1,
          inc: 'artists',
        },
        headers: {
          'User-Agent': 'MusicOrganize/1.0.0 (https://example.com)',
        },
      });

      const releases = response.data.releases;
      if (releases && releases.length > 0) {
        const releaseId = releases[0].id;
        const coverResponse = await axios.get(`https://coverartarchive.org/release/${releaseId}/front`, {
          responseType: 'arraybuffer',
        });
        return Buffer.from(coverResponse.data);
      }
    } catch (error) {
      logger.warn(`Failed to download cover art for ${artist} - ${album}`, error);
    }
    return null;
  },

  traditionalToSimplified(text: string): string {
    const map: Record<string, string> = {
      '裡': '里', '後': '后', '為': '为',
      '會': '会', '從': '从', '說': '说',
      '過': '过', '個': '个', '這': '这', '麼': '么', '與': '与',
      '們': '们', '你們': '你们', '他們': '他们', '她們': '她们', '它們': '它们',
      '來': '来', '頭': '头', '聲': '声', '風': '风', '電': '电', '雲': '云',
    };

    return text.split('').map(char => map[char] || char).join('');
  },

  async fetchFromDouban(artist: string, title: string): Promise<ScrapeResult | null> {
    try {
      const response = await axios.get('https://api.douban.com/v2/music/search', {
        params: {
          q: `${artist} ${title}`,
          count: 1,
        },
        headers: {
          'User-Agent': 'MusicOrganize/1.0.0 (https://example.com)',
        },
      });

      const result = response.data;
      if (result && result.musics && result.musics.length > 0) {
        const music = result.musics[0];
        return {
          source: 'douban',
          title: music.title || title,
          artist: music.artist || artist,
          album: music.album || '',
          year: music.attrs?.year ? parseInt(music.attrs.year) : undefined,
          genre: music.attrs?.genre,
          coverUrl: music.image,
          lyrics: undefined,
          confidence: 0.75,
        };
      }
    } catch (error) {
      logger.warn(`Failed to fetch from Douban for ${artist} - ${title}`, error);
    }
    return null;
  },

  async fetchFromNetease(artist: string, title: string): Promise<ScrapeResult | null> {
    try {
      const searchResponse = await axios.get('https://music.163.com/api/search/pc', {
        params: {
          s: `${artist} ${title}`,
          type: 1,
          limit: 1,
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://music.163.com',
        },
      });

      const result = searchResponse.data;
      if (result && result.result && result.result.songs && result.result.songs.length > 0) {
        const song = result.result.songs[0];
        const albumInfo = await this.getNeteaseAlbumInfo(song.album.id);
        
        return {
          source: 'netease',
          title: song.name || title,
          artist: song.ar?.[0]?.name || artist,
          album: song.al?.name || '',
          trackNumber: song.no,
          year: albumInfo?.year,
          genre: albumInfo?.genre,
          coverUrl: song.al?.picUrl,
          lyrics: await this.getNeteaseLyrics(song.id),
          confidence: 0.85,
        };
      }
    } catch (error) {
      logger.warn(`Failed to fetch from Netease for ${artist} - ${title}`, error);
    }
    return null;
  },

  async getNeteaseAlbumInfo(albumId: number): Promise<{ year?: number; genre?: string } | null> {
    try {
      const response = await axios.get(`https://music.163.com/api/album/${albumId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://music.163.com',
        },
      });

      const result = response.data;
      if (result && result.album) {
        return {
          year: result.album.publishTime ? Math.floor(result.album.publishTime / 1000 / 60 / 60 / 24 / 365) + 1970 : undefined,
          genre: result.album.type,
        };
      }
    } catch (error) {
      logger.warn(`Failed to fetch Netease album info for ${albumId}`, error);
    }
    return null;
  },

  async getNeteaseLyrics(songId: number): Promise<string | undefined> {
    try {
      const response = await axios.get(`https://music.163.com/api/song/lyric?id=${songId}&lv=1&kv=1&tv=-1`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://music.163.com',
        },
      });

      const result = response.data;
      if (result && result.lrc && result.lrc.lyric) {
        return result.lrc.lyric;
      }
    } catch (error) {
      logger.warn(`Failed to fetch lyrics for song ${songId}`, error);
    }
    return undefined;
  },

  async fetchLyricsFromGenius(artist: string, title: string): Promise<string | null> {
    try {
      const response = await axios.get('https://api.genius.com/search', {
        params: {
          q: `${artist} ${title}`,
        },
        headers: {
          'Authorization': 'Bearer ' + process.env.GENIUS_API_KEY,
          'User-Agent': 'MusicOrganize/1.0.0',
        },
      });

      const result = response.data;
      if (result.response && result.response.hits && result.response.hits.length > 0) {
        const hit = result.response.hits[0];
        if (hit.result && hit.result.url) {
          return hit.result.url;
        }
      }
    } catch (error) {
      logger.warn(`Failed to fetch lyrics from Genius for ${artist} - ${title}`, error);
    }
    return null;
  },

  async writeTags(filePath: string, tags: ParsedTag): Promise<void> {
    try {
      const common: Record<string, unknown> = {
        title: tags.title,
        artist: tags.artist,
        album: tags.album,
      };

      if (tags.trackNumber !== null) {
        common.track = { no: tags.trackNumber };
      }
      if (tags.year !== null) {
        common.year = tags.year;
      }
      if (tags.genre) {
        common.genre = [tags.genre];
      }

      logger.info(`Tags would be written to ${filePath}:`, common);
    } catch (error) {
      logger.error(`Failed to write tags to ${filePath}:`, error);
      throw error;
    }
  },

  async downloadCoverArtByUrl(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    return Buffer.from(response.data);
  },
};
