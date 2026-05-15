# WebBar (Web foobar2000)

A web-based music player inspired by foobar2000, specialized in streaming local music directly via browser. It features a full folder tree navigation, metadata reading, ID3 tag support, album art extraction, and a retro minimalist desktop interface.

## Features

* **Folder Tree Navigation:** Browse your local `music/` folder exactly how it's structured on disk. 
* **Audio Playback:** Supports standard audio formats such as MP3, FLAC, WAV, OGG, and M4A. Includes basic Gapless/Stream configurations (via range requests).
* **Metadata Extraction:** Reads ID3 tags, FLAC tags, etc., directly from files using `music-metadata`. Shows Bitrate, Sample Rate, Codec, Title, Artist, Album, Date, and Track lengths.
* **Album Art Support:** Looks for local `cover.jpg`, `folder.jpg`, etc., in the folder, or extracts embedded cover art smoothly from the audio files.
* **Retro UI:** Foobar2000-inspired layout, built in React and Tailwind CSS.
* **Visualizer:** Quick Canvas-based spectrum visualizer synchronized with Web Audio API.

## Installation & Usage

1. Create a `music` folder in the root of the project directory (same level as `package.json` and `server.ts`).
2. Add your albums, folders, and tracks to the `music` directory.
   - Example path: `music/FLACs/Pink Floyd/The Dark Side of the Moon/01 - Speak to Me.flac`
   - You can also drop a `cover.jpg` or `folder.jpg` inside the album directory to ensure album artwork is loaded.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the Dev Server:
   ```bash
   npm run dev
   ```
5. Open your browser and listen to your music.

## Commands

- `npm run dev`: Starts the local Express + Vite server with auto-refresh on port 3000.
- `npm run build`: Compiles the React SPA for production.
- `npm run start`: Runs the production server and serves built files in `./dist/`.

## Architecture details

**Backend (`server.ts`):**
- Serves API routes: `/api/tree` for crawling recursive directories.
- `/api/folder-content`: Extrapolates detailed music metadata using `music-metadata`.
- `/api/stream`: HTTP 206 Partial Content streams for fast and native-like audio.
- `/api/cover`: Retrieves valid artwork prioritizing files first, embedded tags second.

**Frontend (React):**
- Layout consists of resizable or fixed grid/flex layouts echoing foobar2000 default columns UI.
- Direct standard HTML5 `<audio>` tag linked to a visualizer.

## Limitations
- Performance over extremely large library directories (e.g., 1TB+ / >10k files) may take too long to fetch via `/api/tree` since it's recursive synchronous-like loading. Deeply nested tracks might require database indexing for a more robust setup.
