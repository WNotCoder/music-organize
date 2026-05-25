import { Router, Request, Response } from 'express';
import { artistRepository } from '../repositories/artistRepository';
import { albumRepository } from '../repositories/albumRepository';
import { songRepository } from '../repositories/songRepository';
import { playlistRepository } from '../repositories/playlistRepository';
import { settingsRepository } from '../repositories/settingsRepository';
import fs from 'fs';
import path from 'path';

const router = Router();

function buildXmlResponse(data: unknown): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<subsonic-response xmlns="http://subsonic.org/restapi" status="ok" version="1.16.1">
${renderXml(data)}
</subsonic-response>`;
}

function renderXml(data: unknown, indent = 2): string {
  if (data === null || data === undefined) return '';
  
  if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return `${' '.repeat(indent)}<value>${String(data)}</value>`;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => renderXml(item, indent)).join('\n');
  }
  
  if (typeof data === 'object') {
    const keys = Object.keys(data);
    return keys.map(key => {
      const value = (data as Record<string, unknown>)[key];
      if (Array.isArray(value)) {
        return value.map(item => {
          const itemXml = renderXml(item, indent + 2).replace(/<value>(.+?)<\/value>/g, '<$1/>');
          return `${' '.repeat(indent)}<${key}>${itemXml}</${key}>`;
        }).join('\n');
      }
      const innerXml = renderXml(value, indent + 2);
      return `${' '.repeat(indent)}<${key}>${innerXml}</${key}>`;
    }).join('\n');
  }
  
  return '';
}

async function authenticate(req: Request): Promise<boolean> {
  const { u, p } = req.query;
  const settings = await settingsRepository.get();
  return u === settings.subsonicUsername && p === settings.subsonicPassword;
}

router.get('/ping.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse({}));
});

router.get('/getArtists.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const artists = await artistRepository.getAll();
  
  const result = {
    artists: {
      index: artists.reduce((acc, artist) => {
        const firstLetter = artist.name.charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push({
          id: artist.id,
          name: artist.name,
          albumCount: artist.albumCount,
        });
        return acc;
      }, {} as Record<string, unknown[]>)
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getArtist.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  const artist = await artistRepository.getById(id as string);
  
  if (!artist) {
    return res.status(404).send('Artist not found');
  }
  
  const albums = await albumRepository.getByArtistId(artist.id);
  
  const result = {
    artist: {
      id: artist.id,
      name: artist.name,
      album: albums.map(album => ({
        id: album.id,
        name: album.name,
        artist: artist.name,
        artistId: artist.id,
        year: album.year,
        coverArt: album.id,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getAlbum.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  const album = await albumRepository.getById(id as string);
  
  if (!album) {
    return res.status(404).send('Album not found');
  }
  
  const songs = await songRepository.getByAlbumId(album.id);
  
  const result = {
    album: {
      id: album.id,
      name: album.name,
      artist: album.artistName,
      artistId: album.artistId,
      year: album.year,
      coverArt: album.id,
      song: songs.map(song => ({
        id: song.id,
        title: song.title,
        track: song.trackNumber,
        duration: song.duration,
        artist: song.artistName,
        artistId: song.artistId,
        album: song.albumName,
        albumId: song.albumId,
        path: song.filePath,
        size: song.fileSize,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getSong.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  const song = await songRepository.getById(id as string);
  
  if (!song) {
    return res.status(404).send('Song not found');
  }
  
  const result = {
    song: {
      id: song.id,
      title: song.title,
      track: song.trackNumber,
      duration: song.duration,
      artist: song.artistName,
      artistId: song.artistId,
      album: song.albumName,
      albumId: song.albumId,
      path: song.filePath,
      size: song.fileSize,
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getAlbumList.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const albums = await albumRepository.getAll();
  
  const result = {
    albumList: {
      album: albums.map(album => ({
        id: album.id,
        name: album.name,
        artist: album.artistName,
        artistId: album.artistId,
        year: album.year,
        coverArt: album.id,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/stream.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  const song = await songRepository.getById(id as string);
  
  if (!song) {
    return res.status(404).send('Song not found');
  }
  
  const filePath = song.filePath;
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('File not found');
  }
  
  const ext = path.extname(filePath).toLowerCase();
  const contentType = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.wav': 'audio/wav',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
  }[ext] || 'audio/mpeg';
  
  res.set('Content-Type', contentType);
  res.set('Content-Length', song.fileSize.toString());
  
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

router.get('/search.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { query } = req.query;
  
  const artists = await artistRepository.search(query as string);
  const albums = await albumRepository.search(query as string);
  const songs = await songRepository.search(query as string, 20);
  
  const result = {
    searchResult: {
      artist: artists.map(a => ({ id: a.id, name: a.name })),
      album: albums.map(al => ({
        id: al.id,
        name: al.name,
        artist: al.artistName,
        artistId: al.artistId,
        coverArt: al.id,
      })),
      song: songs.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artistName,
        artistId: s.artistId,
        album: s.albumName,
        albumId: s.albumId,
        duration: s.duration,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getPlaylists.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const playlists = await playlistRepository.getAll();
  
  const result = {
    playlists: {
      playlist: playlists.map(p => ({
        id: p.id,
        name: p.name,
        songCount: p.songCount,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/getPlaylist.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  const playlist = await playlistRepository.getById(id as string);
  
  if (!playlist) {
    return res.status(404).send('Playlist not found');
  }
  
  const songs = await playlistRepository.getSongs(id as string);
  
  const result = {
    playlist: {
      id: playlist.id,
      name: playlist.name,
      song: songs.map(s => ({
        id: s.id,
        title: s.title,
        artist: s.artistName,
        album: s.albumName,
      }))
    }
  };
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse(result));
});

router.get('/createPlaylist.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { name, songId } = req.query;
  
  const playlist = await playlistRepository.create(name as string);
  
  if (songId) {
    const songIds = Array.isArray(songId) ? songId : [songId];
    for (const id of songIds) {
      await playlistRepository.addSong(playlist.id, id as string);
    }
  }
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse({}));
});

router.get('/deletePlaylist.view', async (req: Request, res: Response) => {
  if (!await authenticate(req)) {
    return res.status(401).send('Unauthorized');
  }
  
  const { id } = req.query;
  await playlistRepository.delete(id as string);
  
  res.set('Content-Type', 'application/xml');
  res.send(buildXmlResponse({}));
});

export default router;
