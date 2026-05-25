import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/music.db';

const dbDir = path.dirname(dbPath);

import fs from 'fs';
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function runQuery(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

export async function initDatabase(): Promise<sqlite3.Database> {
  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        await runQuery(`
          CREATE TABLE IF NOT EXISTS artists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS albums (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            artist_id TEXT NOT NULL,
            year INTEGER,
            cover_path TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id)
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS songs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            artist_id TEXT NOT NULL,
            album_id TEXT NOT NULL,
            track_number INTEGER,
            duration INTEGER,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            genre TEXT,
            year INTEGER,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (artist_id) REFERENCES artists(id),
            FOREIGN KEY (album_id) REFERENCES albums(id)
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS playlists (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS playlist_items (
            id TEXT PRIMARY KEY,
            playlist_id TEXT NOT NULL,
            song_id TEXT NOT NULL,
            position INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (playlist_id) REFERENCES playlists(id),
            FOREIGN KEY (song_id) REFERENCES songs(id)
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS scan_directories (
            id TEXT PRIMARY KEY,
            path TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            storage_path TEXT NOT NULL,
            auto_scan_enabled INTEGER NOT NULL DEFAULT 1,
            auto_scan_interval INTEGER NOT NULL DEFAULT 60,
            subsonic_enabled INTEGER NOT NULL DEFAULT 1,
            subsonic_port INTEGER NOT NULL DEFAULT 4040,
            subsonic_username TEXT NOT NULL DEFAULT 'admin',
            subsonic_password TEXT NOT NULL DEFAULT 'admin',
            file_structure_template TEXT NOT NULL DEFAULT '{artist}/{album}',
            cover_art_enabled INTEGER NOT NULL DEFAULT 1,
            file_organize_mode TEXT NOT NULL DEFAULT 'copy',
            file_name_template TEXT NOT NULL DEFAULT '{trackNumber} - {title}',
            artist_separator TEXT NOT NULL DEFAULT '&',
            use_primary_artist INTEGER NOT NULL DEFAULT 1,
            traditional_to_simplified INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        await runQuery(`
          CREATE TABLE IF NOT EXISTS tasks (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            progress INTEGER NOT NULL DEFAULT 0,
            message TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            started_at TEXT,
            completed_at TEXT
          );
        `);

        await runQuery(`CREATE INDEX IF NOT EXISTS idx_albums_artist_id ON albums(artist_id);`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_songs_artist_id ON songs(artist_id);`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_songs_album_id ON songs(album_id);`);
        await runQuery(`CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);`);

        await runQuery(`INSERT OR IGNORE INTO scan_directories (id, path, name) VALUES ('default_scan_dir', './media/downloads', '默认下载目录');`);

        const defaultDirs = ['./media/downloads', './media/organized'];
        for (const dir of defaultDirs) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
        }

        console.log('Connected to SQLite database');
        resolve(db);
      } catch (err) {
        reject(err);
      }
    });
  });
}

export default db;