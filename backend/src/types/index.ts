export interface Artist {
  id: string;
  name: string;
  albumCount: number;
  songCount: number;
  createdAt: string;
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
  filePath: string;
  fileSize: number;
  genre: string | null;
  year: number | null;
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  songCount: number;
  createdAt: string;
}

export interface ScanDirectory {
  id: string;
  path: string;
  name: string;
  createdAt: string;
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
