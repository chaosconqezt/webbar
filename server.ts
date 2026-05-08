import express from 'express';
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { parseFile } from 'music-metadata';
import { createServer as createViteServer } from 'vite';

const app = express();
app.disable('etag');

// Add CORS headers for internal API and streaming
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const PORT = 3000;
const MUSIC_DIR = path.resolve(process.cwd(), 'music');

// Define API routes

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

app.get('/api/tree', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    console.log(`[GET /api/tree] Reading from: ${MUSIC_DIR}`);
    // Ensure the music directory exists
    await fsp.mkdir(MUSIC_DIR, { recursive: true });
    
    const entries = await fsp.readdir(MUSIC_DIR);
    console.log('[GET /api/tree] Root entries:', entries);

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

app.get('/api/cover', async (req, res) => {
  try {
    const folderPath = (req.query.path as string) || '';
    const dirPath = path.join(MUSIC_DIR, folderPath);
    
    if (!dirPath.startsWith(MUSIC_DIR)) {
      return res.status(403).send('Forbidden');
    }

    if (!fs.existsSync(dirPath)) {
      return res.status(404).send('Not found');
    }

    const files = await fsp.readdir(dirPath);
    console.log(`[api/cover] Folder: ${folderPath}, Files found: ${files.length}`);
    
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

    console.log(`[api/cover] Potential cover files:`, coverFiles);

    for (const f of coverFiles) {
      const fullPath = path.join(dirPath, f);
      try {
        const stats = fs.statSync(fullPath);
        if (stats.size > 0) {
          console.log(`[api/cover] Serving file: ${fullPath}`);
          return res.sendFile(fullPath);
        }
      } catch (e) {
        console.error(`[api/cover] Stat error for ${fullPath}:`, e);
      }
    }

    // 2. If no file found, try extracting from the first audio file
    const audioFile = files.find(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(ext);
    });

    if (audioFile) {
      const filePath = path.join(dirPath, audioFile);
      console.log(`[api/cover] Attempting extraction from: ${filePath}`);
      try {
        const metadata = await parseFile(filePath);
        const picture = metadata.common.picture && metadata.common.picture[0];
        
        if (picture) {
          console.log(`[api/cover] Found embedded cover, format: ${picture.format}`);
          res.setHeader('Content-Type', picture.format);
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(picture.data);
        }
      } catch (e) {
        console.error(`[api/cover] Metadata extraction error:`, e);
      }
    }

    console.log(`[api/cover] No cover found for ${folderPath}`);
    res.status(404).send('Not found');
  } catch (e) {
    console.error('Error in /api/cover:', e);
    res.status(500).send('Error');
  }
});

app.get('/api/folder-content', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    const relativePath = (req.query.path as string) || '';
    const fullPath = path.join(MUSIC_DIR, relativePath);
    console.log(`[GET /api/folder-content] Path: ${relativePath} -> Full: ${fullPath}`);
    
    // Prevent directory traversal
    if (!fullPath.startsWith(MUSIC_DIR)) {
      console.warn(`[GET /api/folder-content] Potential traversal attempt: ${fullPath}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(fullPath)) {
      console.warn(`[GET /api/folder-content] Path not found: ${fullPath}`);
      return res.status(404).json({ error: 'Folder not found' });
    }

    const entries = await fsp.readdir(fullPath, { withFileTypes: true });
    const tracks = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        // Support some common audio extensions
        if (['.mp3', '.flac', '.wav', '.ogg', '.m4a'].includes(ext)) {
          const filePath = path.join(fullPath, entry.name);
          const relativeFilePath = path.relative(MUSIC_DIR, filePath);
          
          try {
            const metadata = await parseFile(filePath, { duration: true, skipCovers: true });
            
            // Format duration as mm:ss
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
              duration: durationStr,
              date: metadata.common.year || metadata.common.date || '',
              rawDuration: metadata.format.duration || 0,
              // extra metadata for info panel
              bitrate: metadata.format.bitrate,
              sampleRate: metadata.format.sampleRate,
              codec: metadata.format.codec
            });
          } catch (metadataError) {
            console.warn(`Could not parse metadata for ${filePath}:`, metadataError);
            tracks.push({
              fileName: entry.name,
              path: relativeFilePath,
              trackNo: '',
              artist: 'Unknown Artist',
              title: entry.name,
              album: 'Unknown Album',
              duration: '0:00',
              date: '',
              rawDuration: 0,
            });
          }
        }
      }
    }
    
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

app.get('/api/stream', (req, res) => {
  const relativePath = req.query.path as string;
  if (!relativePath) {
    return res.status(400).send('No path provided');
  }

  const fullPath = path.join(MUSIC_DIR, relativePath);

  // Prevent directory traversal
  if (!fullPath.startsWith(MUSIC_DIR)) {
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

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Music directory: ${MUSIC_DIR}`);
  });
}

startServer();
