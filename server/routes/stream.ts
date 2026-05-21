import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { MUSIC_DIR } from '../config.js';

const router = Router();

router.get('/', (req, res) => {
  const relativePath = req.query.path as string;
  if (!relativePath) {
    return res.status(400).send('No path provided');
  }

  const fullPath = path.resolve(MUSIC_DIR, relativePath);
  const normalizedMusicDir = path.normalize(MUSIC_DIR);

  // Prevent directory traversal
  if (!fullPath.startsWith(normalizedMusicDir + path.sep) && fullPath !== normalizedMusicDir) {
    return res.status(403).send('Access denied');
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).send('File not found');
  }

  const stat = fs.statSync(fullPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
      return;
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(fullPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg', // Generic fallback, though ideally based on extension
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    };
    res.writeHead(200, head);
    fs.createReadStream(fullPath).pipe(res);
  }
});

export default router;
