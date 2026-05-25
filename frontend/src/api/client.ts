import axios from 'axios';
import { 
  Artist, 
  Album, 
  Song, 
  Playlist, 
  ScanDirectory, 
  Settings, 
  ScanStatus, 
  Task,
  LibraryStats,
  SearchResult,
  AddDirectoryRequest
} from '../types';

const api = axios.create({
  baseURL: '/api',
});

export const scanApi = {
  getStatus: async (): Promise<ScanStatus> => {
    const response = await api.get('/scan');
    return response.data;
  },
  
  startScan: async (): Promise<{ success: boolean; message: string; taskId?: string }> => {
    const response = await api.post('/scan');
    return response.data;
  },
  
  stopScan: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/scan');
    return response.data;
  },
  
  getDirectories: async (): Promise<ScanDirectory[]> => {
    const response = await api.get('/scan/directories');
    return response.data;
  },
  
  addDirectory: async (data: AddDirectoryRequest): Promise<ScanDirectory> => {
    const response = await api.post('/scan/directories', data);
    return response.data;
  },
  
  deleteDirectory: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/scan/directories/${id}`);
    return response.data;
  },
};

export const libraryApi = {
  getArtists: async (search?: string): Promise<{ data: Artist[]; total: number; page: number; limit: number }> => {
    const params = search ? { search } : {};
    const response = await api.get('/library/artists', { params });
    return response.data;
  },
  
  getArtistById: async (id: string): Promise<Artist> => {
    const response = await api.get(`/library/artists/${id}`);
    return response.data;
  },
  
  getAlbums: async (search?: string, artistId?: string): Promise<{ data: Album[]; total: number; page: number; limit: number }> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (artistId) params.artistId = artistId;
    const response = await api.get('/library/albums', { params });
    return response.data;
  },
  
  getAlbumById: async (id: string): Promise<Album> => {
    const response = await api.get(`/library/albums/${id}`);
    return response.data;
  },
  
  getSongs: async (page = 0, limit = 20, artistId?: string, albumId?: string): Promise<{ data: Song[]; total: number; page: number; limit: number }> => {
    const params: Record<string, string | number> = { page, limit };
    if (artistId) params.artistId = artistId;
    if (albumId) params.albumId = albumId;
    const response = await api.get('/library/songs', { params });
    return response.data;
  },
  
  getSongById: async (id: string): Promise<Song> => {
    const response = await api.get(`/library/songs/${id}`);
    return response.data;
  },
  
  updateSong: async (id: string, data: Partial<Song>): Promise<Song> => {
    const response = await api.put(`/library/songs/${id}`, data);
    return response.data;
  },
  
  deleteSong: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/library/songs/${id}`);
    return response.data;
  },
  
  getStats: async (): Promise<LibraryStats> => {
    const response = await api.get('/library/stats');
    return response.data;
  },
  
  search: async (query: string, type: 'artist' | 'album' | 'song' | 'all' = 'all', limit = 20): Promise<SearchResult> => {
    const response = await api.get('/search', { params: { query, type, limit } });
    return response.data;
  },
};

export const playlistApi = {
  getPlaylists: async (): Promise<Playlist[]> => {
    const response = await api.get('/playlists');
    return response.data;
  },
  
  getPlaylistById: async (id: string): Promise<Playlist> => {
    const response = await api.get(`/playlists/${id}`);
    return response.data;
  },
  
  createPlaylist: async (name: string, description?: string): Promise<Playlist> => {
    const response = await api.post('/playlists', { name, description });
    return response.data;
  },
  
  updatePlaylist: async (id: string, name: string, description?: string): Promise<Playlist> => {
    const response = await api.put(`/playlists/${id}`, { name, description });
    return response.data;
  },
  
  deletePlaylist: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/playlists/${id}`);
    return response.data;
  },
  
  addSong: async (id: string, songId: string): Promise<{ success: boolean }> => {
    const response = await api.post(`/playlists/${id}/songs`, { songId });
    return response.data;
  },
  
  removeSong: async (id: string, songId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/playlists/${id}/songs`, { data: { songId } });
    return response.data;
  },
};

export const settingsApi = {
  getSettings: async (): Promise<Settings> => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  updateSettings: async (data: Partial<Settings>): Promise<Settings> => {
    const response = await api.put('/settings', data);
    return response.data;
  },
};

export const taskApi = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data;
  },
  
  getTaskById: async (id: string): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  
  deleteTask: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};
