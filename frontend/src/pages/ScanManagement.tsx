import { useState, useEffect, useRef } from 'react';
import { FolderPlus, Trash2, Play, Square, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { scanApi } from '../api/client';
import { ScanDirectory, ScanStatus, AddDirectoryRequest } from '../types';

function ScanManagement() {
  const [directories, setDirectories] = useState<ScanDirectory[]>([]);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDirectory, setNewDirectory] = useState<AddDirectoryRequest>({ path: '', name: '' });
  const pollIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchDirectories();
    fetchScanStatus();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (scanStatus?.isRunning) {
      pollIntervalRef.current = window.setInterval(() => {
        fetchScanStatus();
      }, 1000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [scanStatus?.isRunning]);

  const fetchDirectories = async () => {
    try {
      const data = await scanApi.getDirectories();
      setDirectories(data);
    } catch (error) {
      console.error('Failed to fetch directories:', error);
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

  const handleAddDirectory = async () => {
    if (!newDirectory.path || !newDirectory.name) return;
    
    try {
      await scanApi.addDirectory(newDirectory);
      setNewDirectory({ path: '', name: '' });
      setShowAddModal(false);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to add directory:', error);
    }
  };

  const handleDeleteDirectory = async (id: string) => {
    try {
      await scanApi.deleteDirectory(id);
      fetchDirectories();
    } catch (error) {
      console.error('Failed to delete directory:', error);
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

  const handleStopScan = async () => {
    try {
      await scanApi.stopScan();
      fetchScanStatus();
    } catch (error) {
      console.error('Failed to stop scan:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">扫描管理</h1>
          <p className="text-gray-400 mt-1">配置扫描目录并管理扫描任务</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FolderPlus className="w-4 h-4" />
          添加目录
        </button>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#4a1942]" />
            <h2 className="text-lg font-semibold text-white">扫描状态</h2>
          </div>
          {scanStatus?.isRunning ? (
            <button onClick={handleStopScan} className="btn btn-danger flex items-center gap-2">
              <Square className="w-4 h-4" />
              停止扫描
            </button>
          ) : (
            <button onClick={handleStartScan} className="btn btn-primary flex items-center gap-2">
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
                <p className="text-gray-400">已扫描</p>
                <p className="text-white font-semibold">{scanStatus.scannedCount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">已整理</p>
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

      <div className="card">
        <div className="p-6 border-b border-purple-900/50">
          <h2 className="text-lg font-semibold text-white">扫描目录</h2>
        </div>
        <div className="divide-y divide-purple-900/50">
          {directories.length > 0 ? (
            directories.map((dir) => (
              <div
                key={dir.id}
                className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-white font-medium">{dir.name}</p>
                  <p className="text-gray-400 text-sm truncate">{dir.path}</p>
                </div>
                <button
                  onClick={() => handleDeleteDirectory(dir.id)}
                  className="btn btn-danger btn-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无扫描目录</p>
              <p className="text-sm">点击上方按钮添加扫描目录</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md animate-fadeIn">
            <h3 className="text-lg font-semibold text-white mb-4">添加扫描目录</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">目录名称</label>
                <input
                  type="text"
                  value={newDirectory.name}
                  onChange={(e) => setNewDirectory({ ...newDirectory, name: e.target.value })}
                  className="input"
                  placeholder="例如：下载文件夹"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">目录路径</label>
                <input
                  type="text"
                  value={newDirectory.path}
                  onChange={(e) => setNewDirectory({ ...newDirectory, path: e.target.value })}
                  className="input"
                  placeholder="例如：/Users/username/Downloads"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  取消
                </button>
                <button onClick={handleAddDirectory} className="btn btn-primary flex-1">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScanManagement;
