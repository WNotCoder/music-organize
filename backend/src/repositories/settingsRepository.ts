import db from '../utils/database';
import { Settings } from '../types';

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
            use_primary_artist: number; traditional_to_simplified: number 
          };
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
          });
        }
      });
    });
  },

  createDefault: async (): Promise<Settings> => {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO settings (id, storage_path) VALUES ("default", ?)',
        [process.env.STORAGE_PATH || './media/organized'],
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

    values.push('default');

    return new Promise((resolve, reject) => {
      db.run(`UPDATE settings SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, function(err) {
        if (err) reject(err);
        else settingsRepository.get().then(resolve).catch(reject);
      });
    });
  },
};
