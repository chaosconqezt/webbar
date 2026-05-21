import path from 'path';

export const PORT = 3000;
const rawMusicDir = process.env.MUSIC_DIR || 'music';
export const MUSIC_DIR = path.isAbsolute(rawMusicDir) ? rawMusicDir : path.resolve(process.cwd(), rawMusicDir);

export const READ_ONLY_MODE = process.env.ENABLE_READ_ONLY_MODE === 'true';
