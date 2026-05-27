import { useState, useEffect } from 'react';
import { Search, Music, Users, Disc3, ChevronDown, ChevronUp, X, FileAudio } from 'lucide-react';
import { libraryApi } from '../api/client';
import { Artist, Album, SongEntry, SongFile } from '../types';
import { useNavigate } from 'react-router-dom';

type ViewMode = 'artists' | 'albums' | 'songs';

function Library() {
  const [viewMode, setViewMode] = useState<ViewMode>('albums');
  const [searchQuery, setSearchQuery] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [entries, setEntries] = useState<SongEntry[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [entryFiles, setEntryFiles] = useState<Record<string, SongFile[]>>({});

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
        const result = await libraryApi.getSongEntries(0, 50, undefined, undefined);
        setEntries(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch library data:', error);
    }
  };

  const toggleEntry = async (entryId: string) => {
    if (expandedEntryId === entryId) {
      setExpandedEntryId(null);
    } else {
      setExpandedEntryId(entryId);
      if (!entryFiles[entryId]) {
        const result = await libraryApi.getSongFiles(entryId);
        setEntryFiles(prev => ({ ...prev, [entryId]: result.data }));
      }
    }
  };

  const handleDeleteFile = async (fileId: string, entryId: string) => {
    await libraryApi.deleteSongFile(fileId);
    setEntryFiles(prev => ({
      ...prev,
      [entryId]: prev[entryId].filter(f => f.id !== fileId)
    }));
    setEntries(prev => prev.map(e => 
      e.id === entryId ? { ...e, fileCount: e.fileCount - 1 } : e
    ));
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

  const getBitrate = (fileSize: number, duration: number): string => {
    const bitrateKbps = (fileSize * 8) / (duration * 1000);
    return `${Math.round(bitrateKbps)} kbps`;
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
                <div className="w-full aspect-square bg-[#4a1942] rounded-lg mb-4 overflow-hidden">
                  {artist.coverPath ? (
                    <img
                      src={`/artist-covers/${artist.id}`}
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-12 h-12 text-white/70 mx-auto mt-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
                      }}
                    />
                  ) : (
                    <Users className="w-12 h-12 text-white/70 mx-auto mt-8" />
                  )}
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
                <th className="text-right p-4 text-gray-400 font-medium">版本数</th>
                <th className="text-right p-4 text-gray-400 font-medium">时长</th>
                <th className="text-right p-4 text-gray-400 font-medium">年份</th>
              </tr>
            </thead>
            <tbody>
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <>
                    <tr
                      key={entry.id}
                      className="border-b border-purple-900/30 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => toggleEntry(entry.id)}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {expandedEntryId === entry.id ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="w-8 h-8 bg-[#4a1942] rounded overflow-hidden flex-shrink-0">
                            <img
                              src={`/covers/${entry.albumId}`}
                              alt={entry.albumName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-4 h-4 text-white mx-auto mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-white font-medium">{entry.title}</p>
                            {entry.trackNumber && (
                              <p className="text-gray-500 text-xs">#{entry.trackNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400">{entry.artistName}</td>
                      <td className="p-4 text-gray-400">{entry.albumName}</td>
                      <td className="p-4 text-gray-400 text-right">
                        <span className="bg-purple-900/50 px-2 py-1 rounded text-sm">
                          {entry.fileCount} 版本
                        </span>
                      </td>
                      <td className="p-4 text-gray-400 text-right">{formatDuration(entry.duration)}</td>
                      <td className="p-4 text-gray-400 text-right">{entry.year || '-'}</td>
                    </tr>
                    {expandedEntryId === entry.id && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <div className="bg-slate-900/50 border-t border-purple-900/30">
                            <div className="p-4">
                              <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                                <FileAudio className="w-4 h-4" />
                                可用版本 ({entryFiles[entry.id]?.length || 0})
                              </h4>
                              {entryFiles[entry.id] && entryFiles[entry.id].length > 0 ? (
                                <div className="space-y-2">
                                  {entryFiles[entry.id].map((file) => (
                                    <div
                                      key={file.id}
                                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                                    >
                                      <div className="flex-1">
                                        <p className="text-white text-sm truncate">
                                          {file.filePath.split('/').pop()}
                                        </p>
                                        <p className="text-gray-400 text-xs mt-1">
                                          {formatFileSize(file.fileSize)} · {getBitrate(file.fileSize, file.duration)} · {formatDuration(file.duration)}
                                        </p>
                                      </div>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteFile(file.id, entry.id);
                                        }}
                                        className="ml-4 p-2 text-gray-400 hover:text-red-400 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-400 text-sm">暂无文件版本</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
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