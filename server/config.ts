import path from 'path';

export const PORT = 3000;
const rawMusicDir = process.env.MUSIC_DIR || 'music';
export const MUSIC_DIR = path.isAbsolute(rawMusicDir) ? rawMusicDir : path.resolve(process.cwd(), rawMusicDir);
