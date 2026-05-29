import { Router } from 'express';
import path from 'path';
import { MUSIC_DIR } from '../config.js';
import NodeID3 from 'node-id3';
import fs from 'fs';
import fsp from 'fs/promises';
import { requireAdmin } from '../auth.js';

const router = Router();
router.use(requireAdmin);

function getValidPath(res: any, target: any) {
  const safeTarget = target !== undefined ? String(target).replace(/\0/g, '') : '';
  const fullPath = path.resolve(MUSIC_DIR, safeTarget);
  const normalizedMusicDir = path.normalize(MUSIC_DIR);
  if (!fullPath.startsWith(normalizedMusicDir + path.sep) && fullPath !== normalizedMusicDir) {
    if (!res.headersSent) {
      res.status(403).json({ error: 'Access denied' });
    }
    return null;
  }
  return fullPath;
}

router.post('/edit', async (req, res) => {
  const { paths, tags } = req.body;
  if (!paths || !Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'No files specified' });
  }

  let updated = 0;
  let errors = [];

  for (const relPath of paths) {
    const fullPath = getValidPath(res, relPath);
    if (!fullPath || !fs.existsSync(fullPath)) {
      errors.push(`${relPath}: file not found or access denied`);
      continue;
    }
    const ext = path.extname(fullPath).toLowerCase();
    
    if (ext === '.mp3') {
      try {
        const currentTags = NodeID3.read(fullPath);
        const newTags: any = { ...currentTags };
        if (tags.artist !== undefined) newTags.artist = tags.artist;
        if (tags.albumArtist !== undefined) newTags.performerInfo = tags.albumArtist; // TPE2
        if (tags.album !== undefined) newTags.album = tags.album;
        if (tags.title !== undefined) newTags.title = tags.title;
        if (tags.date !== undefined) newTags.year = tags.date;
        
        const success = NodeID3.update(newTags, fullPath);
        if (success) {
          updated++;
        } else {
          errors.push(`${relPath}: failed to write ID3 tags`);
        }
      } catch (err: any) {
        errors.push(`${relPath}: error - ${err.message}`);
      }
    } else {
      errors.push(`${relPath}: tag editing not currently supported for ${ext}`);
    }
  }

  if (updated === 0 && errors.length > 0) {
    return res.status(500).json({ error: 'Failed to update tags', details: errors });
  }

  res.json({ success: true, updated, errors: errors.length > 0 ? errors : undefined });
});

export default router;
