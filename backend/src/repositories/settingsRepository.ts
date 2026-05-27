import db from '../utils/database';
import { Settings, ScraperConfig, ScraperUsageConfig, ConflictResolution, AcoustidConfig } from '../types';

const DEFAULT_SCRAPERS: ScraperConfig[] = [
  { name: 'netease', enabled: true, priority: 1, requestInterval: 1000, timeout: 10000, retryCount: 3, apiParams: {} },
  { name: 'qqmusic', enabled: true, priority: 2, requestInterval: 1000, timeout: 10000, retryCount: 3, apiParams: {} },
  { name: 'kugou', enabled: true, priority: 3, requestInterval: 1000, timeout: 10000, retryCount: 3, apiParams: {} },
  { name: 'migu', enabled: true, priority: 4, requestInterval: 1000, timeout: 10000, retryCount: 3, apiParams: {} },
  { name: 'musicbrainz', enabled: true, priority: 5, requestInterval: 1000, timeout: 15000, retryCount: 3, apiParams: {} },
  { name: 'douban', enabled: false, priority: 6, requestInterval: 1000, timeout: 10000, retryCount: 3, apiParams: {} },
  { name: 'spotify', enabled: false, priority: 7, requestInterval: 2000, timeout: 15000, retryCount: 3, apiParams: {} },
  { name: 'itunes', enabled: false, priority: 8, requestInterval: 2000, timeout: 15000, retryCount: 3, apiParams: {} },
];

const DEFAULT_SCRAPER_USAGE: ScraperUsageConfig = {
  tags: ['netease', 'qqmusic', 'kugou', 'migu', 'musicbrainz'],
  cover: ['netease', 'qqmusic', 'kugou', 'migu'],
  lyrics: ['netease', 'qqmusic', 'kugou', 'migu'],
};

const DEFAULT_CONFLICT_RESOLUTION: ConflictResolution = {
  strategy: 'scraped',
};

const DEFAULT_ACOUSTID_CONFIG: AcoustidConfig = {
  enabled: true,
  apiKey: process.env.ACOUSTID_API_KEY || '',
  minDuration: 10,
  timeout: 15000,
  confidenceThreshold: 0.7,
};

export const settingsRepository = {
  get: async (): Promise<Settings> => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM settings WHERE id = "default"', (err, row) => {
        if (err) reject(err);
        else if (!row) {
          settingsRepository.createDefault().then(resolve).catch(reject);
        } else {
          const r = row as { 
            storage_path: string; auto_scan_enabled: number; auto_scan_interval: number; 
            subsonic_enabled: number; subsonic_port: number; subsonic_username: string; 
            subsonic_password: string; file_structure_template: string; cover_art_enabled: number;
            file_organize_mode: string; file_name_template: string; artist_separator: string;
            use_primary_artist: number; traditional_to_simplified: number;
            scrapers_config: string; scraper_usage_config: string; conflict_resolution: string;
            acoustid_config: string;
          };
          
          let scrapers: ScraperConfig[] = DEFAULT_SCRAPERS;
          if (r.scrapers_config) {
            try {
              scrapers = JSON.parse(r.scrapers_config);
            } catch {
              scrapers = DEFAULT_SCRAPERS;
            }
          }
          
          let scraperUsage: ScraperUsageConfig = DEFAULT_SCRAPER_USAGE;
          if (r.scraper_usage_config) {
            try {
              scraperUsage = JSON.parse(r.scraper_usage_config);
            } catch {
              scraperUsage = DEFAULT_SCRAPER_USAGE;
            }
          }
          
          let conflictResolution: ConflictResolution = DEFAULT_CONFLICT_RESOLUTION;
          if (r.conflict_resolution) {
            try {
              conflictResolution = JSON.parse(r.conflict_resolution);
            } catch {
              conflictResolution = DEFAULT_CONFLICT_RESOLUTION;
            }
          }
          
          let acoustid: AcoustidConfig = { ...DEFAULT_ACOUSTID_CONFIG };
          if (r.acoustid_config) {
            try {
              const savedAcoustid = JSON.parse(r.acoustid_config);
              acoustid = {
                ...DEFAULT_ACOUSTID_CONFIG,
                ...savedAcoustid,
              };
            } catch {
              acoustid = { ...DEFAULT_ACOUSTID_CONFIG };
            }
          }
          
          if (process.env.ACOUSTID_API_KEY) {
            acoustid.apiKey = process.env.ACOUSTID_API_KEY;
            acoustid.enabled = true;
          }
          
          resolve({
            storagePath: r.storage_path,
            autoScanEnabled: r.auto_scan_enabled === 1,
            autoScanInterval: r.auto_scan_interval,
            subsonicEnabled: r.subsonic_enabled === 1,
            subsonicPort: r.subsonic_port,
            subsonicUsername: r.subsonic_username,
            subsonicPassword: r.subsonic_password,
            fileStructureTemplate: r.file_structure_template,
            coverArtEnabled: r.cover_art_enabled === 1,
            fileOrganizeMode: r.file_organize_mode as Settings['fileOrganizeMode'],
            fileNameTemplate: r.file_name_template,
            artistSeparator: r.artist_separator,
            usePrimaryArtist: r.use_primary_artist === 1,
            traditionalToSimplified: r.traditional_to_simplified === 1,
            scrapers,
            scraperUsage,
            conflictResolution,
            acoustid,
          });
        }
      });
    });
  },

  createDefault: async (): Promise<Settings> => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO settings (
          id, storage_path, scrapers_config, scraper_usage_config, conflict_resolution, acoustid_config
        ) VALUES ("default", ?, ?, ?, ?, ?)`,
        [
          process.env.STORAGE_PATH || './media/organized',
          JSON.stringify(DEFAULT_SCRAPERS),
          JSON.stringify(DEFAULT_SCRAPER_USAGE),
          JSON.stringify(DEFAULT_CONFLICT_RESOLUTION),
          JSON.stringify(DEFAULT_ACOUSTID_CONFIG),
        ],
        function(err) {
          if (err) reject(err);
          else settingsRepository.get().then(resolve).catch(reject);
        }
      );
    });
  },

  update: async (updates: Partial<Settings>): Promise<Settings> => {
    const setClauses: string[] = [];
    const values: unknown[] = [];

    if (updates.storagePath !== undefined) {
      setClauses.push('storage_path = ?');
      values.push(updates.storagePath);
    }
    if (updates.autoScanEnabled !== undefined) {
      setClauses.push('auto_scan_enabled = ?');
      values.push(updates.autoScanEnabled ? 1 : 0);
    }
    if (updates.autoScanInterval !== undefined) {
      setClauses.push('auto_scan_interval = ?');
      values.push(updates.autoScanInterval);
    }
    if (updates.subsonicEnabled !== undefined) {
      setClauses.push('subsonic_enabled = ?');
      values.push(updates.subsonicEnabled ? 1 : 0);
    }
    if (updates.subsonicPort !== undefined) {
      setClauses.push('subsonic_port = ?');
      values.push(updates.subsonicPort);
    }
    if (updates.subsonicUsername !== undefined) {
      setClauses.push('subsonic_username = ?');
      values.push(updates.subsonicUsername);
    }
    if (updates.subsonicPassword !== undefined) {
      setClauses.push('subsonic_password = ?');
      values.push(updates.subsonicPassword);
    }
    if (updates.fileStructureTemplate !== undefined) {
      setClauses.push('file_structure_template = ?');
      values.push(updates.fileStructureTemplate);
    }
    if (updates.coverArtEnabled !== undefined) {
      setClauses.push('cover_art_enabled = ?');
      values.push(updates.coverArtEnabled ? 1 : 0);
    }
    if (updates.fileOrganizeMode !== undefined) {
      setClauses.push('file_organize_mode = ?');
      values.push(updates.fileOrganizeMode);
    }
    if (updates.fileNameTemplate !== undefined) {
      setClauses.push('file_name_template = ?');
      values.push(updates.fileNameTemplate);
    }
    if (updates.artistSeparator !== undefined) {
      setClauses.push('artist_separator = ?');
      values.push(updates.artistSeparator);
    }
    if (updates.usePrimaryArtist !== undefined) {
      setClauses.push('use_primary_artist = ?');
      values.push(updates.usePrimaryArtist ? 1 : 0);
    }
    if (updates.traditionalToSimplified !== undefined) {
      setClauses.push('traditional_to_simplified = ?');
      values.push(updates.traditionalToSimplified ? 1 : 0);
    }
    if (updates.scrapers !== undefined) {
      setClauses.push('scrapers_config = ?');
      values.push(JSON.stringify(updates.scrapers));
    }
    if (updates.scraperUsage !== undefined) {
      setClauses.push('scraper_usage_config = ?');
      values.push(JSON.stringify(updates.scraperUsage));
    }
    if (updates.conflictResolution !== undefined) {
      setClauses.push('conflict_resolution = ?');
      values.push(JSON.stringify(updates.conflictResolution));
    }
    if (updates.acoustid !== undefined) {
      setClauses.push('acoustid_config = ?');
      values.push(JSON.stringify(updates.acoustid));
    }

    values.push('default');

    return new Promise((resolve, reject) => {
      db.run(`UPDATE settings SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else settingsRepository.get().then(resolve).catch(reject);
      });
    });
  },

  getScraperConfig: async (name: string): Promise<ScraperConfig | null> => {
    const settings = await settingsRepository.get();
    return settings.scrapers.find(s => s.name === name) || null;
  },

  updateScraperConfig: async (name: string, config: Partial<ScraperConfig>): Promise<Settings> => {
    const settings = await settingsRepository.get();
    const scrapers = settings.scrapers.map(s => 
      s.name === name ? { ...s, ...config } : s
    );
    return settingsRepository.update({ scrapers });
  },

  resetScraperConfig: async (name: string): Promise<Settings> => {
    const defaultScraper = DEFAULT_SCRAPERS.find(s => s.name === name);
    if (!defaultScraper) {
      throw new Error(`Scraper ${name} not found`);
    }
    const settings = await settingsRepository.get();
    const scrapers = settings.scrapers.map(s => 
      s.name === name ? { ...defaultScraper } : s
    );
    return settingsRepository.update({ scrapers });
  },

  updateScraperUsage: async (usage: Partial<ScraperUsageConfig>): Promise<Settings> => {
    const settings = await settingsRepository.get();
    return settingsRepository.update({ 
      scraperUsage: { ...settings.scraperUsage, ...usage } 
    });
  },

  updateConflictResolution: async (resolution: ConflictResolution): Promise<Settings> => {
    return settingsRepository.update({ conflictResolution: resolution });
  },
};