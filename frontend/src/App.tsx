import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ScanManagement from './pages/ScanManagement';
import Library from './pages/Library';
import ArtistDetail from './pages/ArtistDetail';
import AlbumDetail from './pages/AlbumDetail';
import Playlists from './pages/Playlists';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-[#1a1a2e]">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 animate-fadeIn">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scan" element={<ScanManagement />} />
            <Route path="/library" element={<Library />} />
            <Route path="/library/artist/:id" element={<ArtistDetail />} />
            <Route path="/library/album/:id" element={<AlbumDetail />} />
            <Route path="/playlists" element={<Playlists />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/tasks" element={<Tasks />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
