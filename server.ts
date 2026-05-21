import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { PORT, MUSIC_DIR } from './server/config.js';
import treeRouter from './server/routes/tree.js';
import coverRouter from './server/routes/cover.js';
import folderContentRouter from './server/routes/folder-content.js';
import streamRouter from './server/routes/stream.js';
import manageRouter from './server/routes/manage.js';

const app = express();
app.disable('etag');
app.use(express.json());

// Add CORS headers for internal API and streaming
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Define API routes
app.use('/api/tree', treeRouter);
app.use('/api/cover', coverRouter);
app.use('/api/folder-content', folderContentRouter);
app.use('/api/stream', streamRouter);
app.use('/api/manage', manageRouter);

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
