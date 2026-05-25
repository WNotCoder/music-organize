import { useState, useEffect } from 'react';
import { Search, Music, Users, Disc3 } from 'lucide-react';
import { libraryApi } from '../api/client';
import { Artist, Album, Song } from '../types';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'artists' | 'albums' | 'songs';

function Library() {
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [viewMode, searchQuery]);

  const fetchData = async () => {
    try {
      if (viewMode === 'artists') {
        const result = await libraryApi.getArtists(searchQuery || undefined);
        setArtists(result.data);
      } else if (viewMode === 'albums') {
        const result = await libraryApi.getAlbums(searchQuery || undefined);
        setAlbums(result.data);
      } else {
        const result = await libraryApi.getSongs(0, 50, undefined, undefined);
        setSongs(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch library data:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">音乐库</h1>
          <p className="text-gray-400 mt-1">浏览和管理您的音乐收藏</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索艺术家、专辑或歌曲..."
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f1a] border border-slate-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-[#4a1942] transition-colors"
          />
        </div>
        
        <div className="flex items-center bg-[#16213e] rounded-lg p-1">
          <button
            onClick={() => setViewMode('artists')}
            className={`btn flex items-center gap-2 px-3 py-1.5 ${
              viewMode === 'artists' ? 'btn-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">艺术家</span>
          </button>
          <button
            onClick={() => setViewMode('albums')}
            className={`btn flex items-center gap-2 px-3 py-1.5 ${
              viewMode === 'albums' ? 'btn-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Disc3 className="w-4 h-4" />
            <span className="hidden sm:inline">专辑</span>
          </button>
          <button
            onClick={() => setViewMode('songs')}
            className={`btn flex items-center gap-2 px-3 py-1.5 ${
              viewMode === 'songs' ? 'btn-primary' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span className="hidden sm:inline">歌曲</span>
          </button>
        </div>
      </div>

      {viewMode === 'artists' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {artists.length > 0 ? (
            artists.map((artist) => (
              <div
                key={artist.id}
                className="card p-6 cursor-pointer hover:translate-y-[-4px] transition-all"
                onClick={() => navigate(`/library/artist/${artist.id}`)}
              >
                <div className="w-full aspect-square bg-[#4a1942] rounded-lg mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-white/70" />
                </div>
                <h3 className="text-white font-semibold truncate">{artist.name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {artist.albumCount} 专辑 · {artist.songCount} 歌曲
                </p>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无艺术家</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'albums' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {albums.length > 0 ? (
            albums.map((album) => (
              <div
                key={album.id}
                className="card overflow-hidden cursor-pointer hover:translate-y-[-4px] transition-all"
                onClick={() => navigate(`/library/album/${album.id}`)}
              >
                <div className="w-full aspect-square bg-[#4a1942] flex items-center justify-center">
                  {album.coverPath ? (
                    <img
                      src={`/covers/${album.id}`}
                      alt={album.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-12 h-12 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
                      }}
                    />
                  ) : (
                    <Disc3 className="w-12 h-12 text-white/70" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold truncate">{album.name}</h3>
                  <p className="text-gray-400 text-sm mt-1 truncate">{album.artistName}</p>
                  <p className="text-gray-500 text-xs mt-1">
                    {album.year} · {album.songCount} 首歌曲
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Disc3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暂无专辑</p>
            </div>
          )}
        </div>
      )}

      {viewMode === 'songs' && (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-900/50">
                <th className="text-left p-4 text-gray-400 font-medium">歌曲</th>
                <th className="text-left p-4 text-gray-400 font-medium">艺术家</th>
                <th className="text-left p-4 text-gray-400 font-medium">专辑</th>
                <th className="text-right p-4 text-gray-400 font-medium">时长</th>
                <th className="text-right p-4 text-gray-400 font-medium">大小</th>
              </tr>
            </thead>
            <tbody>
              {songs.length > 0 ? (
                songs.map((song) => (
                  <tr
                    key={song.id}
                    className="border-b border-purple-900/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/library/album/${song.albumId}`)}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#4a1942] rounded flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{song.title}</p>
                          {song.trackNumber && (
                            <p className="text-gray-500 text-xs">#{song.trackNumber}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400">{song.artistName}</td>
                    <td className="p-4 text-gray-400">{song.albumName}</td>
                    <td className="p-4 text-gray-400 text-right">{formatDuration(song.duration)}</td>
                    <td className="p-4 text-gray-400 text-right">{formatFileSize(song.fileSize)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>暂无歌曲</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Library;
