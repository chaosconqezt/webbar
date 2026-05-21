import { Router } from 'express';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { parseFile } from 'music-metadata';
import { MUSIC_DIR } from '../config.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const targetPath = (req.query.path as string) || '';
    const resolvedPath = path.resolve(MUSIC_DIR, targetPath);
    const normalizedMusicDir = path.normalize(MUSIC_DIR);
    
    if (!resolvedPath.startsWith(normalizedMusicDir + path.sep) && resolvedPath !== normalizedMusicDir) {
      return res.status(403).send('Forbidden');
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).send('Not found');
    }

    const stat = fs.statSync(resolvedPath);
    let dirPath = resolvedPath;

    // If it's a specific audio file, try extracting its embedded cover first
    if (stat.isFile()) {
      dirPath = path.dirname(resolvedPath);
      try {
        const metadata = await parseFile(resolvedPath, { skipPostHeaders: true });
        const picture = metadata.common.picture && metadata.common.picture[0];
        if (picture) {
          res.setHeader('Content-Type', picture.format);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(Buffer.from(picture.data));
        }
      } catch (e) {
        // Fallback to folder cover logic
      }
    }

    // Now look for folder-level cover images
    const files = await fsp.readdir(dirPath);
    
    // 1. Look for common cover filenames first (fastest)
    const coverFiles = files.filter(f => {
      const lower = f.toLowerCase();
      return lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif');
    }).sort((a, b) => {
      // Prioritize "cover", "folder", "front"
      const prio = (name: string) => {
        const ln = name.toLowerCase();
        if (ln.startsWith('cover')) return 1;
        if (ln.startsWith('folder')) return 2;
        if (ln.startsWith('front')) return 3;
        return 10;
      };
      return prio(a) - prio(b);
    });

    for (const f of coverFiles) {
      const fullPath = path.join(dirPath, f);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > 0) {
          return res.sendFile(fullPath);
        }
      } catch (e) {
        console.error(`[api/cover] Stat error for ${fullPath}:`, e);
      }
    }

    // 2. If no file found, try extracting from the first few audio files
    const audioFiles = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(ext);
    }).slice(0, 3); // Check up to 3 audio files

    for (const audioFile of audioFiles) {
      const filePath = path.join(dirPath, audioFile);
      try {
        // Only parse what we need for the cover
        const metadata = await parseFile(filePath, { skipPostHeaders: true });
        const picture = metadata.common.picture && metadata.common.picture[0];
        
        if (picture) {
          res.setHeader('Content-Type', picture.format);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(Buffer.from(picture.data));
        }
      } catch (e) {}
    }

    res.status(404).send('Not found');
  } catch (e) {
    console.error('Error in /api/cover:', e);
    res.status(500).send('Error');
  }
});

export default router;
