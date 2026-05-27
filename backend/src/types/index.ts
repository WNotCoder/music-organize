export interface Artist {
  id: string;
  name: string;
  coverPath: string | null;
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

export interface SongEntry {
  id: string;
  title: string;
  albumId: string;
  albumName: string;
  trackNumber: number | null;
  duration: number;
  genre: string | null;
  year: number | null;
  fileCount: number;
  createdAt: string;
}

export interface ArtistSongEntry {
  id: string;
  artistId: string;
  entryId: string;
  isPrimary: boolean;
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
  requestInterval: number; // 毫秒
  timeout: number; // 超时时间（毫秒）
  retryCount: number; // 重试次数
  apiParams: Record<string, string>; // 自定义API参数
}

export interface ScraperUsageConfig {
  tags: string[]; // 用于歌曲标签的刮削器名称列表
  cover: string[]; // 用于封面的刮削器名称列表
  lyrics: string[]; // 用于歌词的刮削器名称列表
}

export interface ConflictResolution {
  strategy: 'original' | 'scraped' | 'manual'; // 信息冲突时的处理策略
}

export interface AcoustidConfig {
  enabled: boolean; // 是否启用Acoustid指纹匹配
  apiKey: string; // Acoustid API密钥
  minDuration: number; // 最小音频时长（秒），低于此值不进行指纹匹配
  timeout: number; // 请求超时时间（毫秒）
  confidenceThreshold: number; // 置信度阈值，低于此值不使用匹配结果
}

export interface AcoustidMatchResult {
  success: boolean;
  title?: string;
  artist?: string;
  album?: string;
  allMatched: boolean; // 三个信息是否全部匹配
  confidence: number;
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
  scraperUsage: ScraperUsageConfig;
  conflictResolution: ConflictResolution;
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
  songEntries: SongEntry[];
}
