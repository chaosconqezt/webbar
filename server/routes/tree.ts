import { Router } from 'express';
import fsp from 'fs/promises';
import path from 'path';
import { MUSIC_DIR } from '../config.js';

const router = Router();

// Recursive function to get folder tree
async function getTree(dir: string, baseDir: string): Promise<any> {
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  const children = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      children.push({
        name: entry.name,
        path: relativePath,
        children: await getTree(fullPath, baseDir)
      });
    }
  }
  return children;
}

router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    await fsp.mkdir(MUSIC_DIR, { recursive: true });

    const tree = [{
      name: 'music',
      path: '',
      children: await getTree(MUSIC_DIR, MUSIC_DIR)
    }];
    res.json(tree);
  } catch (error) {
    console.error('Error getting tree:', error);
    res.status(500).json({ error: 'Failed to read directory tree' });
  }
});

export default router;
