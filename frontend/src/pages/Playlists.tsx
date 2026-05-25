import { useState, useEffect } from 'react';
import { Plus, Trash2, Music, Edit2, CheckCircle, X } from 'lucide-react';
import { playlistApi, libraryApi } from '../api/client';
import { Playlist, Song } from '../types';

function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddSongModal, setShowAddSongModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [availableSongs, setAvailableSongs] = useState<Song[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const data = await playlistApi.getPlaylists();
      setPlaylists(data);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const fetchAvailableSongs = async (playlistId: string) => {
    try {
      const playlist = await playlistApi.getPlaylistById(playlistId);
      const playlistSongIds = playlist.songs?.map(s => s.id) || [];
      const result = await libraryApi.getSongs(0, 100);
      const available = result.data.filter(s => !playlistSongIds.includes(s.id));
      setAvailableSongs(available);
      setSelectedSongs([]);
    } catch (error) {
      console.error('Failed to fetch available songs:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name) return;
    
    try {
      await playlistApi.createPlaylist(newPlaylist.name, newPlaylist.description);
      setNewPlaylist({ name: '', description: '' });
      setShowCreateModal(false);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylist) return;
    
    try {
      await playlistApi.updatePlaylist(editingPlaylist.id, editingPlaylist.name, editingPlaylist.description || undefined);
      setEditingPlaylist(null);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to update playlist:', error);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      await playlistApi.deletePlaylist(id);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const handleAddSongs = async () => {
    if (!selectedPlaylistId || selectedSongs.length === 0) return;
    
    try {
      for (const songId of selectedSongs) {
        await playlistApi.addSong(selectedPlaylistId, songId);
      }
      setShowAddSongModal(false);
      setSelectedSongs([]);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to add songs:', error);
    }
  };

  const handleRemoveSong = async (playlistId: string, songId: string) => {
    try {
      await playlistApi.removeSong(playlistId, songId);
      fetchPlaylists();
    } catch (error) {
      console.error('Failed to remove song:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddSongClick = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    fetchAvailableSongs(playlistId);
    setShowAddSongModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">播放列表</h1>
          <p className="text-gray-400 mt-1">创建和管理自定义播放列表</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          创建播放列表
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {playlists.length > 0 ? (
          playlists.map((playlist) => (
            <div key={playlist.id} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                {editingPlaylist?.id === playlist.id ? (
                  <div className="flex-1 mr-4">
                    <input
                      type="text"
                      value={editingPlaylist.name}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })}
                      className="input mb-2"
                    />
                    <input
                      type="text"
                      value={editingPlaylist.description || ''}
                      onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                      className="input"
                      placeholder="描述（可选）"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{playlist.name}</h3>
                    {playlist.description && (
                      <p className="text-gray-400 text-sm mt-1">{playlist.description}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {editingPlaylist?.id === playlist.id ? (
                    <>
                      <button
                        onClick={handleUpdatePlaylist}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingPlaylist(null)}
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingPlaylist(playlist)}
                        className="btn btn-secondary btn-sm flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeletePlaylist(playlist.id)}
                        className="btn btn-danger btn-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                {playlist.songs?.length && playlist.songs.length > 0 ? (
                  playlist.songs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center justify-between p-2 bg-[#0f0f1a] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#4a1942] rounded flex items-center justify-center">
                          <Music className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white text-sm">{song.title}</p>
                          <p className="text-gray-500 text-xs">{song.artistName}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveSong(playlist.id, song.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无歌曲</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleAddSongClick(playlist.id)}
                className="btn btn-secondary btn-sm w-full mt-4 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                添加歌曲
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>暂无播放列表</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary mt-4"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              创建第一个播放列表
            </button>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-lg font-semibold text-white mb-4">创建播放列表</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">名称</label>
                <input
                  type="text"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                  className="input"
                  placeholder="播放列表名称"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">描述（可选）</label>
                <input
                  type="text"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                  className="input"
                  placeholder="添加描述..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleCreatePlaylist} className="btn btn-primary flex-1">
                  创建
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddSongModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-2xl animate-fadeIn max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">添加歌曲到播放列表</h3>
              <button
                onClick={() => setShowAddSongModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="relative mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索歌曲..."
                className="input"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {availableSongs.filter(s => 
                  s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.artistName.toLowerCase().includes(searchQuery.toLowerCase())
                ).map((song) => (
                  <div
                    key={song.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSongs.includes(song.id)
                        ? 'bg-[#4a1942]'
                        : 'bg-[#0f0f1a] hover:bg-slate-800'
                    }`}
                    onClick={() => {
                      if (selectedSongs.includes(song.id)) {
                        setSelectedSongs(selectedSongs.filter(id => id !== song.id));
                      } else {
                        setSelectedSongs([...selectedSongs, song.id]);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#4a1942] rounded flex items-center justify-center">
                        <Music className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white">{song.title}</p>
                        <p className="text-gray-400 text-sm">{song.artistName} - {song.albumName}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-sm">{formatDuration(song.duration)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 pt-4 border-t border-purple-900/50">
              <button
                onClick={() => setShowAddSongModal(false)}
                className="btn btn-secondary flex-1"
              >
                取消
              </button>
              <button onClick={handleAddSongs} className="btn btn-primary flex-1">
                添加 {selectedSongs.length} 首歌曲
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playlists;
