import { useEffect, useState } from 'react';
import { Music, Users, Disc3, Clock, Play, Activity, RefreshCw, FileAudio } from 'lucide-react';
import { libraryApi, scanApi } from '../api/client';
import { LibraryStats, ScanStatus, SongEntry } from '../types';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [stats, setStats] = useState<LibraryStats | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [recentEntries, setRecentEntries] = useState<SongEntry[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
    fetchScanStatus();
    fetchRecentEntries();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await libraryApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchScanStatus = async () => {
    try {
      const data = await scanApi.getStatus();
      setScanStatus(data);
    } catch (error) {
      console.error('Failed to fetch scan status:', error);
    }
  };

  const fetchRecentEntries = async () => {
    try {
      const result = await libraryApi.getSongEntries(0, 5);
      setRecentEntries(result.data);
    } catch (error) {
      console.error('Failed to fetch recent entries:', error);
    }
  };

  const handleStartScan = async () => {
    try {
      await scanApi.startScan();
      fetchScanStatus();
    } catch (error) {
      console.error('Failed to start scan:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards = [
    {
      title: '歌曲条目',
      value: stats?.entryCount || 0,
      icon: Music,
      color: 'bg-blue-600',
    },
    {
      title: '文件总数',
      value: stats?.fileCount || 0,
      icon: FileAudio,
      color: 'bg-orange-600',
    },
    {
      title: '歌手数量',
      value: stats?.artistCount || 0,
      icon: Users,
      color: 'bg-green-600',
    },
    {
      title: '专辑数量',
      value: stats?.albumCount || 0,
      icon: Disc3,
      color: 'bg-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">仪表盘</h1>
          <p className="text-gray-400 mt-1">查看音乐库概览和系统状态</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="card p-6 hover:translate-y-[-4px] transition-transform cursor-pointer"
              onClick={() => navigate('/library')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.title}</p>
                  <p className="text-3xl font-bold text-white mt-2">{card.value.toLocaleString()}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#4a1942]" />
            <h2 className="text-lg font-semibold text-white">扫描状态</h2>
          </div>
          {scanStatus?.isRunning ? (
            <button className="btn btn-secondary flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              扫描中...
            </button>
          ) : (
            <button
              onClick={handleStartScan}
              className="btn btn-primary flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              开始扫描
            </button>
          )}
        </div>

        {scanStatus && (
          <div className="space-y-4">
            {scanStatus.isRunning && (
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>扫描进度</span>
                  <span>{scanStatus.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${scanStatus.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">已扫描歌曲</p>
                <p className="text-white font-semibold">{scanStatus.scannedCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">已整理文件</p>
                <p className="text-white font-semibold">{scanStatus.organizedCount.toLocaleString()}</p>
              </div>
            </div>

            {scanStatus.lastScanTime && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>上次扫描: {new Date(scanStatus.lastScanTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">最近添加</h2>
        <div className="space-y-3">
          {recentEntries.length > 0 ? (
            recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-4 p-3 bg-[#0f0f1a] rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                onClick={() => navigate(`/library/album/${entry.albumId}`)}
              >
                <div className="w-10 h-10 bg-[#4a1942] rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{entry.title}</p>
                  <p className="text-gray-400 text-sm">{entry.artistName} - {entry.albumName}</p>
                </div>
                <div className="flex items-center gap-3">
                  {entry.fileCount > 1 && (
                    <span className="bg-purple-900/50 px-2 py-1 rounded text-xs text-gray-400">
                      {entry.fileCount} 版本
                    </span>
                  )}
                  <span className="text-gray-400 text-sm">
                    {formatDuration(entry.duration)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无音乐文件</p>
              <p className="text-sm">点击上方按钮开始扫描</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;