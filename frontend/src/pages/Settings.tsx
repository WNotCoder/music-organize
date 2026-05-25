import { useState, useEffect } from 'react';
import { Save, Server, FolderOpen, RefreshCw, Music } from 'lucide-react';
import { settingsApi } from '../api/client';
import { Settings as SettingsType } from '../types';

function Settings() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await settingsApi.updateSettings(settings);
      setIsSaving(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setIsSaving(false);
    }
  };

  const handleChange = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">系统设置</h1>
          <p className="text-gray-400 mt-1">配置音乐整理系统的各项参数</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? '保存中...' : '保存设置'}
        </button>
      </div>

      {settings && (
        <>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <FolderOpen className="w-5 h-5 text-[#4a1942]" />
              <h2 className="text-lg font-semibold text-white">存储配置</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-gray-400 text-sm mb-2">音乐存储路径</label>
                <input
                  type="text"
                  value={settings.storagePath}
                  onChange={(e) => handleChange('storagePath', e.target.value)}
                  className="input"
                  placeholder="音乐文件存储目录"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">目录结构模板</label>
                <input
                  type="text"
                  value={settings.fileStructureTemplate}
                  onChange={(e) => handleChange('fileStructureTemplate', e.target.value)}
                  className="input"
                  placeholder="{artist}/{album}/{title}"
                />
                <p className="text-gray-500 text-xs mt-1">可用变量: &#123;artist&#125;, &#123;album&#125;, &#123;year&#125;, &#123;genre&#125;</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">文件名模板</label>
                <input
                  type="text"
                  value={settings.fileNameTemplate}
                  onChange={(e) => handleChange('fileNameTemplate', e.target.value)}
                  className="input"
                  placeholder="{trackNumber} - {title}"
                />
                <p className="text-gray-500 text-xs mt-1">可用变量: &#123;trackNumber&#125;, &#123;title&#125;, &#123;artist&#125;, &#123;album&#125;, &#123;year&#125;, &#123;discNumber&#125;</p>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">整理方式</label>
                <select
                  value={settings.fileOrganizeMode}
                  onChange={(e) => handleChange('fileOrganizeMode', e.target.value as SettingsType['fileOrganizeMode'])}
                  className="select"
                >
                  <option value="copy">复制模式 - 保留源文件</option>
                  <option value="move">移动模式 - 删除源文件</option>
                  <option value="rename">重命名模式 - 原地重命名</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Music className="w-5 h-5 text-[#4a1942]" />
              <h2 className="text-lg font-semibold text-white">刮削配置</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">启用专辑封面下载</p>
                  <p className="text-gray-400 text-sm">自动从网络下载专辑封面图片</p>
                </div>
                <button
                  onClick={() => handleChange('coverArtEnabled', !settings.coverArtEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.coverArtEnabled ? 'bg-[#4a1942]' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.coverArtEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">繁简转换</p>
                  <p className="text-gray-400 text-sm">自动将繁体中文标签转换为简体中文</p>
                </div>
                <button
                  onClick={() => handleChange('traditionalToSimplified', !settings.traditionalToSimplified)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.traditionalToSimplified ? 'bg-[#4a1942]' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.traditionalToSimplified ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">艺术家分隔符</label>
                <select
                  value={settings.artistSeparator}
                  onChange={(e) => handleChange('artistSeparator', e.target.value)}
                  className="select max-w-xs"
                >
                  <option value="&">& (A & B)</option>
                  <option value="/">/ (A / B)</option>
                  <option value=",">, (A, B)</option>
                  <option value=";">; (A; B)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-5 h-5 text-[#4a1942]" />
              <h2 className="text-lg font-semibold text-white">扫描配置</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">自动扫描</p>
                  <p className="text-gray-400 text-sm">定时自动扫描扫描目录</p>
                </div>
                <button
                  onClick={() => handleChange('autoScanEnabled', !settings.autoScanEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.autoScanEnabled ? 'bg-[#4a1942]' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.autoScanEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">扫描间隔（分钟）</label>
                <input
                  type="number"
                  value={settings.autoScanInterval}
                  onChange={(e) => handleChange('autoScanInterval', parseInt(e.target.value) || 60)}
                  className="input max-w-xs"
                  min="5"
                  max="1440"
                />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Server className="w-5 h-5 text-[#4a1942]" />
              <h2 className="text-lg font-semibold text-white">Subsonic 配置</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">启用 Subsonic 服务</p>
                  <p className="text-gray-400 text-sm">允许远程播放器通过 Subsonic API 访问音乐库</p>
                </div>
                <button
                  onClick={() => handleChange('subsonicEnabled', !settings.subsonicEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.subsonicEnabled ? 'bg-[#4a1942]' : 'bg-gray-600'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.subsonicEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">服务端口</label>
                <input
                  type="number"
                  value={settings.subsonicPort}
                  onChange={(e) => handleChange('subsonicPort', parseInt(e.target.value) || 4040)}
                  className="input max-w-xs"
                  min="1"
                  max="65535"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">用户名</label>
                <input
                  type="text"
                  value={settings.subsonicUsername}
                  onChange={(e) => handleChange('subsonicUsername', e.target.value)}
                  className="input max-w-xs"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-2">密码</label>
                <input
                  type="password"
                  value={settings.subsonicPassword}
                  onChange={(e) => handleChange('subsonicPassword', e.target.value)}
                  className="input max-w-xs"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Settings;