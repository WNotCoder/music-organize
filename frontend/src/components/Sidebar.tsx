import { LayoutDashboard, Search, Music, ListMusic, Settings, FolderSearch, ClipboardList } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard },
  { path: '/scan', label: '扫描管理', icon: FolderSearch },
  { path: '/library', label: '音乐库', icon: Music },
  { path: '/playlists', label: '播放列表', icon: ListMusic },
  { path: '/tasks', label: '任务管理', icon: ClipboardList },
  { path: '/settings', label: '系统设置', icon: Settings },
];

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#16213e] border-r border-purple-900/50 flex flex-col">
      <div className="p-6 border-b border-purple-900/50">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Music className="w-8 h-8 text-[#4a1942]" />
          Music Organize
        </h1>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-[#4a1942] text-white'
                        : 'text-gray-400 hover:text-white hover:bg-slate-800'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-purple-900/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="搜索音乐..."
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f1a] border border-slate-700 rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#4a1942] transition-colors"
          />
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
