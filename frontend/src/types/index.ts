export interface Artist {
  id: string;
  name: string;
  coverPath: string | null;
  albumCount: number;
  songCount: number;
  createdAt: string;
}

export interface Song {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  trackNumber: number | null;
  duration: number;
  genre: string | null;
  year: number | null;
}

export interface Album {
  id: string;
  name: string;
  artistId: string;
  artistName: string;
  year: number | null;
  coverPath: string | null;
  songCount: number;
  createdAt: string;
  songs?: Song[];
}

export interface SongEntry {
  id: string;
  title: string;
  artistId: string;
  artistName: string;
  albumId: string;
  albumName: string;
  trackNumber: number | null;
  duration: number;
  genre: string | null;
  year: number | null;
  fileCount: number;
  createdAt: string;
}

export interface SongFile {
  id: string;
  entryId: string;
  filePath: string;
  fileSize: number;
  duration: number;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  songCount: number;
  createdAt: string;
  songs?: { id: string; title: string; artistName: string; albumName: string; position: number }[];
}

export interface ScanDirectory {
  id: string;
  path: string;
  name: string;
  createdAt: string;
}

export interface ScraperConfig {
  name: string;
  enabled: boolean;
  priority: number;
  requestInterval: number;
}

export interface AcoustidConfig {
  enabled: boolean;
  apiKey: string;
  minDuration: number;
  timeout: number;
  confidenceThreshold: number;
}

export interface Settings {
  storagePath: string;
  autoScanEnabled: boolean;
  autoScanInterval: number;
  subsonicEnabled: boolean;
  subsonicPort: number;
  subsonicUsername: string;
  subsonicPassword: string;
  fileStructureTemplate: string;
  coverArtEnabled: boolean;
  fileOrganizeMode: 'copy' | 'move' | 'rename';
  fileNameTemplate: string;
  artistSeparator: string;
  usePrimaryArtist: boolean;
  traditionalToSimplified: boolean;
  scrapers: ScraperConfig[];
  acoustid: AcoustidConfig;
}

export interface ScanStatus {
  isRunning: boolean;
  progress: number;
  lastScanTime: string | null;
  scannedCount: number;
  organizedCount: number;
}

export interface Task {
  id: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  message: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AddDirectoryRequest {
  path: string;
  name: string;
}

export interface SearchResult {
  artists: Artist[];
  albums: Album[];
  songs: Song[];
}

export interface LibraryStats {
  songCount: number;
  entryCount: number;
  fileCount: number;
  artistCount: number;
  albumCount: number;
}
