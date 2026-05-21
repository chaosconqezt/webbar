import { Router } from 'express';
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { MUSIC_DIR } from '../config.js';

const router = Router();

function getValidPath(res: any, target: string) {
  const fullPath = path.resolve(MUSIC_DIR, target || '');
  const normalizedMusicDir = path.normalize(MUSIC_DIR);
  if (!fullPath.startsWith(normalizedMusicDir + path.sep) && fullPath !== normalizedMusicDir) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  return fullPath;
}

router.post('/folder', async (req, res) => {
  const { path: relativePath, name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  const parentPath = getValidPath(res, relativePath);
  if (!parentPath) return;

  const targetPath = path.join(parentPath, name);
  try {
    await fsp.mkdir(targetPath, { recursive: true });
    res.json({ success: true, path: path.relative(MUSIC_DIR, targetPath) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete('/delete', async (req, res) => {
  const { path: relativePath } = req.body;
  if (!relativePath) return res.status(400).json({ error: 'Path is required' });

  const targetPath = getValidPath(res, relativePath);
  if (!targetPath || targetPath === path.normalize(MUSIC_DIR)) {
    return res.status(403).json({ error: 'Cannot delete root directory' });
  }

  try {
    const stat = await fsp.stat(targetPath);
    if (stat.isDirectory()) {
      await fsp.rm(targetPath, { recursive: true, force: true });
    } else {
      await fsp.unlink(targetPath);
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/move', async (req, res) => {
  const { source, destination } = req.body;
  if (!source || destination === undefined) return res.status(400).json({ error: 'Source and destination required' });

  const oldPath = getValidPath(res, source);
  const newPath = getValidPath(res, destination);

  if (!oldPath || !newPath) return;

  try {
    await fsp.rename(oldPath, newPath);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const parentPath = req.query.path ? String(req.query.path) : '';
    const fullPath = path.resolve(MUSIC_DIR, parentPath);
    
    const normalizedMusicDir = path.normalize(MUSIC_DIR);
    if (!fullPath.startsWith(normalizedMusicDir + path.sep) && fullPath !== normalizedMusicDir) {
      return cb(new Error('Access denied'), '');
    }

    let finalDest = fullPath;
    const clientPath = req.query.filepath ? String(req.query.filepath).replace(/\\/g, '/') : file.originalname.replace(/\\/g, '/');

    if (clientPath && clientPath.includes('/')) {
        const dir = path.dirname(clientPath);
        finalDest = path.join(fullPath, dir);
        if (!finalDest.startsWith(normalizedMusicDir + path.sep) && finalDest !== normalizedMusicDir) {
           return cb(new Error('Access denied'), '');
        }
        fs.mkdirSync(finalDest, { recursive: true });
    }

    cb(null, finalDest);
  },
  filename: function (req, file, cb) {
    const clientPath = req.query.filepath ? String(req.query.filepath).replace(/\\/g, '/') : file.originalname.replace(/\\/g, '/');
    cb(null, path.basename(clientPath));
  }
});
const upload = multer({ storage });

router.post('/upload', upload.array('files'), (req, res) => {
  res.json({ success: true, count: req.files ? (req.files as any[]).length : 0 });
});

export default router;
