import db from '../utils/database';
import { ArtistSongEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface RawArtistSongEntry {
  id: string;
  artistId: string;
  entryId: string;
  isPrimary: number;
  createdAt: string;
}

export const artistSongEntryRepository = {
  create: async (artistId: string, entryId: string, isPrimary: boolean = true): Promise<ArtistSongEntry> => {
    const id = uuidv4();
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO artist_song_entry (id, artist_id, entry_id, is_primary) VALUES (?, ?, ?, ?)',
        [id, artistId, entryId, isPrimary ? 1 : 0],
        async function(err) {
          if (err) reject(err);
          else {
            const result = await artistSongEntryRepository.getById(id);
            if (result) resolve(result);
            else {
              const existing = await artistSongEntryRepository.getByArtistAndEntry(artistId, entryId);
              if (existing) resolve(existing);
              else reject(new Error('Failed to create artist song entry'));
            }
          }
        }
      );
    });
  },

  createMany: async (artistIds: string[], entryId: string, primaryArtistIndex: number = 0): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        try {
          for (let i = 0; i < artistIds.length; i++) {
            await artistSongEntryRepository.create(artistIds[i], entryId, i === primaryArtistIndex);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  },

  getById: async (id: string): Promise<ArtistSongEntry | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id, artist_id as artistId, entry_id as entryId, is_primary as isPrimary, created_at as createdAt
        FROM artist_song_entry
        WHERE id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else {
          if (!row) {
            resolve(null);
          } else {
            const r = row as RawArtistSongEntry;
            resolve({ ...r, isPrimary: r.isPrimary === 1 });
          }
        }
      });
    });
  },

  getByArtistAndEntry: async (artistId: string, entryId: string): Promise<ArtistSongEntry | null> => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT id, artist_id as artistId, entry_id as entryId, is_primary as isPrimary, created_at as createdAt
        FROM artist_song_entry
        WHERE artist_id = ? AND entry_id = ?
      `, [artistId, entryId], (err, row) => {
        if (err) reject(err);
        else {
          if (!row) {
            resolve(null);
          } else {
            const r = row as RawArtistSongEntry;
            resolve({ ...r, isPrimary: r.isPrimary === 1 });
          }
        }
      });
    });
  },

  getByEntryId: async (entryId: string): Promise<ArtistSongEntry[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, artist_id as artistId, entry_id as entryId, is_primary as isPrimary, created_at as createdAt
        FROM artist_song_entry
        WHERE entry_id = ?
        ORDER BY is_primary DESC, created_at
      `, [entryId], (err, rows) => {
        if (err) reject(err);
        else {
          const result = (rows as RawArtistSongEntry[]).map(r => ({ ...r, isPrimary: r.isPrimary === 1 }));
          resolve(result);
        }
      });
    });
  },

  getByArtistId: async (artistId: string): Promise<ArtistSongEntry[]> => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT id, artist_id as artistId, entry_id as entryId, is_primary as isPrimary, created_at as createdAt
        FROM artist_song_entry
        WHERE artist_id = ?
        ORDER BY created_at
      `, [artistId], (err, rows) => {
        if (err) reject(err);
        else {
          const result = (rows as RawArtistSongEntry[]).map(r => ({ ...r, isPrimary: r.isPrimary === 1 }));
          resolve(result);
        }
      });
    });
  },

  deleteByEntryId: async (entryId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM artist_song_entry WHERE entry_id = ?', [entryId], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  deleteByArtistId: async (artistId: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM artist_song_entry WHERE artist_id = ?', [artistId], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },
};