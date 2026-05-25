import { useEffect, useState } from 'react';
import { ArrowLeft, Disc3, Music, Calendar, Users } from 'lucide-react';
import { libraryApi } from '../api/client';
import { Album } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<Album | null>(null);

  useEffect(() => {
    if (id) {
      fetchAlbum();
    }
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const data = await libraryApi.getAlbumById(id!);
      setAlbum(data);
    } catch (error) {
      console.error('Failed to fetch album:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = album?.songs?.reduce((acc, song) => acc + song.duration, 0) || 0;

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
              {album.songs?.length && album.songs.length > 0 ? (
                album.songs.map((song, index) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 w-8 text-center">{index + 1}</span>
                      <div className="w-10 h-10 bg-[#4a1942] rounded-lg flex items-center justify-center">
                        <Music className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{song.title}</p>
                        <p className="text-gray-500 text-sm">
                          {song.trackNumber && `#${song.trackNumber}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-400">{formatDuration(song.duration)}</span>
                  </div>
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
