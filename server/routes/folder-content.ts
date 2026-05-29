import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import { MUSIC_DIR } from '../config.js';

const router = Router();

router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const rawPath = req.query.path !== undefined ? String(req.query.path).replace(/\0/g, '') : '';
    const relativePath = rawPath === '.' ? '' : rawPath;
    const fullPath = path.resolve(MUSIC_DIR, relativePath);
    
    // Prevent directory traversal
    const normalizedMusicDir = path.normalize(MUSIC_DIR);
    
    if (!fullPath.startsWith(normalizedMusicDir + path.sep) && fullPath !== normalizedMusicDir) {
      console.warn(`[GET /api/folder-content] Potential traversal attempt: ${fullPath}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      console.warn(`[GET /api/folder-content] Path not found: ${fullPath}`);
      return res.status(404).json({ error: 'Folder not found' });
    }

    const tracks: any[] = [];
    
    // limit depth logic: Infinite for both root and subfolders, unless deep=false for root
    const isRoot = relativePath === '' || relativePath === '/' || relativePath === '\\';
    let maxDepth = Infinity;
    if (isRoot && req.query.deep === 'false') {
        maxDepth = 0;
    }
    
    async function scanDir(currentPath: string, depth: number) {
      if (depth > maxDepth) return;
      try {
        const entries = await fsp.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) {
            await scanDir(path.join(currentPath, entry.name), depth + 1);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(ext)) {
              const filePath = path.join(currentPath, entry.name);
              const relativeFilePath = path.relative(MUSIC_DIR, filePath);
              
              try {
                const metadata = await parseFile(filePath, { duration: true, skipCovers: true });
                
                let durationStr = '0:00';
                if (metadata.format.duration) {
                  const mins = Math.floor(metadata.format.duration / 60);
                  const secs = Math.floor(metadata.format.duration % 60);
                  durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                }

                tracks.push({
                  fileName: entry.name,
                  path: relativeFilePath,
                  trackNo: metadata.common.track.no || '',
                  artist: metadata.common.artist || metadata.common.albumartist || 'Unknown Artist',
                  title: metadata.common.title || entry.name,
                  album: metadata.common.album || 'Unknown Album',
                  albumArtist: metadata.common.albumartist || '',
                  duration: durationStr,
                  date: metadata.common.year || metadata.common.date || '',
                  rawDuration: metadata.format.duration || 0,
                  bitrate: metadata.format.bitrate,
                  sampleRate: metadata.format.sampleRate,
                  codec: metadata.format.codec
                });
              } catch (metadataError) {
                tracks.push({
                  fileName: entry.name,
                  path: relativeFilePath,
                  trackNo: '',
                  artist: 'Unknown Artist',
                  title: entry.name,
                  album: 'Unknown Album',
                  albumArtist: '',
                  duration: '0:00',
                  date: '',
                  rawDuration: 0,
                });
              }
            }
          }
        }
      } catch (e) {
        console.error(`Error scanning ${currentPath}`, e);
      }
    }

    await scanDir(fullPath, 0);
    
    // Sort tracks by trackNo, then fallback to title
    tracks.sort((a, b) => {
      if (a.trackNo && b.trackNo) {
        return Number(a.trackNo) - Number(b.trackNo);
      }
      return a.title.localeCompare(b.title);
    });

    res.json(tracks);
  } catch (error) {
    console.error('Error reading folder content:', error);
    res.status(500).json({ error: 'Failed to read folder content' });
  }
});

export default router;
