import { useEffect, useState } from 'react';
import { ArrowLeft, Disc3, Music, Calendar, Users, ChevronDown, ChevronUp, X, FileAudio } from 'lucide-react';
import { libraryApi } from '../api/client';
import { Album, SongEntry, SongFile } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

interface AlbumWithEntries extends Album {
  songEntries?: SongEntry[];
}

function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<AlbumWithEntries | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [entryFiles, setEntryFiles] = useState<Record<string, SongFile[]>>({});

  useEffect(() => {
    if (id) {
      fetchAlbum();
    }
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const data = await libraryApi.getAlbumById(id!);
      setAlbum(data as AlbumWithEntries);
    } catch (error) {
      console.error('Failed to fetch album:', error);
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
    setAlbum(prev => prev ? {
      ...prev,
      songEntries: prev.songEntries?.map(e =>
        e.id === entryId ? { ...e, fileCount: e.fileCount - 1 } : e
      )
    } : null);
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

  const totalDuration = album?.songEntries?.reduce((acc, entry) => acc + entry.duration, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/library')}
          className="btn btn-secondary flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
      </div>

      {album && (
        <>
          <div className="card p-8">
            <div className="flex items-center gap-8">
              <div className="w-48 h-48 bg-[#4a1942] rounded-xl flex items-center justify-center">
                {album.coverPath ? (
                  <img
                    src={`/covers/${album.id}`}
                    alt={album.name}
                    className="w-full h-full object-cover rounded-xl"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-20 h-20 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
                    }}
                  />
                ) : (
                  <Disc3 className="w-20 h-20 text-white/70" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{album.name}</h1>
                <p className="text-xl text-gray-400 mt-2">{album.artistName}</p>
                <div className="flex items-center gap-6 mt-4 text-gray-400">
                  {album.year && (
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {album.year}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    {album.songCount} 首歌曲
                  </span>
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    {formatDuration(totalDuration)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="p-6 border-b border-purple-900/50">
              <h2 className="text-xl font-semibold text-white">曲目列表</h2>
            </div>
            <div className="divide-y divide-purple-900/30">
              {album.songEntries?.length && album.songEntries.length > 0 ? (
                album.songEntries.map((entry, index) => (
                  <>
                    <div
                      key={entry.id}
                      className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => toggleEntry(entry.id)}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-gray-500 w-8 text-center">{index + 1}</span>
                        {expandedEntryId === entry.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                        <div className="w-10 h-10 bg-[#4a1942] rounded-lg flex items-center justify-center">
                          <Music className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{entry.title}</p>
                          <p className="text-gray-500 text-sm">
                            {entry.trackNumber && `#${entry.trackNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {entry.fileCount > 1 && (
                          <span className="bg-purple-900/50 px-2 py-1 rounded text-sm text-gray-400">
                            {entry.fileCount} 版本
                          </span>
                        )}
                        <span className="text-gray-400">{formatDuration(entry.duration)}</span>
                      </div>
                    </div>
                    {expandedEntryId === entry.id && (
                      <div className="bg-slate-900/50">
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
                    )}
                  </>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无曲目</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AlbumDetail;