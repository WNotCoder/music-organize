import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Disc3, Music } from 'lucide-react';
import { libraryApi } from '../api/client';
import { Artist, Album, SongEntry } from '../types';
import { useParams, useNavigate } from 'react-router-dom';

interface ArtistWithEntries extends Artist {
  songEntries?: SongEntry[];
}

function ArtistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [artist, setArtist] = useState<ArtistWithEntries | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);

  useEffect(() => {
    if (id) {
      fetchArtist();
      fetchAlbums();
    }
  }, [id]);

  const fetchArtist = async () => {
    try {
      const data = await libraryApi.getArtistById(id!);
      setArtist(data as ArtistWithEntries);
    } catch (error) {
      console.error('Failed to fetch artist:', error);
    }
  };

  const fetchAlbums = async () => {
    try {
      const result = await libraryApi.getAlbums(undefined, id!);
      setAlbums(result.data);
    } catch (error) {
      console.error('Failed to fetch albums:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

      {artist && (
        <div className="card p-8">
          <div className="flex items-center gap-8">
            <div className="w-32 h-32 bg-[#4a1942] rounded-xl overflow-hidden">
              {artist.coverPath ? (
                <img
                  src={`/artist-covers/${artist.id}`}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-16 h-16 text-white/70 mx-auto mt-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>';
                  }}
                />
              ) : (
                <Users className="w-16 h-16 text-white/70 mx-auto mt-8" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{artist.name}</h1>
              <div className="flex items-center gap-6 mt-4 text-gray-400">
                <span className="flex items-center gap-2">
                  <Disc3 className="w-4 h-4" />
                  {artist.albumCount} 专辑
                </span>
                <span className="flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  {artist.songCount} 歌曲
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">专辑</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  <p className="text-gray-400 text-sm mt-1">{album.year}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              <Disc3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无专辑</p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-purple-900/50">
          <h2 className="text-xl font-semibold text-white">歌曲</h2>
        </div>
        <div className="divide-y divide-purple-900/30">
          {artist?.songEntries?.length && artist.songEntries.length > 0 ? (
            artist.songEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/library/album/${entry.albumId}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#4a1942] rounded-lg overflow-hidden">
                    <img
                      src={`/covers/${entry.albumId}`}
                      alt={entry.albumName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg class="w-5 h-5 text-white mx-auto mt-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
                      }}
                    />
                  </div>
                  <div>
                    <p className="text-white font-medium">{entry.title}</p>
                    <p className="text-gray-400 text-sm">{entry.albumName}</p>
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
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无歌曲</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArtistDetail;