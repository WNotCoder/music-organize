import { Router } from 'express';
import { scanController } from '../controllers/scanController';
import { libraryController } from '../controllers/libraryController';
import { playlistController } from '../controllers/playlistController';
import { settingsController } from '../controllers/settingsController';
import { taskController } from '../controllers/taskController';
import { scrapeController } from '../controllers/scrapeController';

const router = Router();

router.get('/scan', scanController.getScanStatus);
router.post('/scan', scanController.startScan);
router.delete('/scan', scanController.stopScan);
router.get('/scan/directories', scanController.getScanDirectories);
router.post('/scan/directories', scanController.addScanDirectory);
router.delete('/scan/directories/:id', scanController.deleteScanDirectory);
router.post('/scan/preview', scanController.previewScan);
router.post('/scan/confirm', scanController.confirmScan);

router.get('/scrape/sources', scrapeController.getAvailableSources);
router.post('/scrape/preview', scrapeController.previewScrape);
router.post('/scrape/execute', scrapeController.executeScrape);
router.post('/scrape/single', scrapeController.scrapeSingle);

router.get('/library/artists', libraryController.getArtists);
router.get('/library/artists/:id', libraryController.getArtistById);
router.get('/library/albums', libraryController.getAlbums);
router.get('/library/albums/:id', libraryController.getAlbumById);
router.get('/library/entries', libraryController.getSongEntries);
router.get('/library/entries/:id', libraryController.getSongEntryById);
router.put('/library/entries/:id', libraryController.updateSongEntry);
router.delete('/library/entries/:id', libraryController.deleteSongEntry);
router.get('/library/files', libraryController.getSongFiles);
router.get('/library/files/:id', libraryController.getSongFileById);
router.delete('/library/files/:id', libraryController.deleteSongFile);
router.get('/library/stats', libraryController.getStats);

router.get('/search', libraryController.search);

router.get('/playlists', playlistController.getPlaylists);
router.get('/playlists/:id', playlistController.getPlaylistById);
router.post('/playlists', playlistController.createPlaylist);
router.put('/playlists/:id', playlistController.updatePlaylist);
router.delete('/playlists/:id', playlistController.deletePlaylist);
router.post('/playlists/:id/songs', playlistController.addSongToPlaylist);
router.delete('/playlists/:id/songs', playlistController.removeSongFromPlaylist);

router.get('/settings', settingsController.getSettings);
router.put('/settings', settingsController.updateSettings);

router.get('/tasks', taskController.getTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.delete('/tasks/:id', taskController.deleteTask);

export default router;
