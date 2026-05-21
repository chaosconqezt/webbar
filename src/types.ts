export interface TreeNode {
  name: string;
  path: string;
  children?: TreeNode[];
}

export interface Track {
  fileName: string;
  path: string;
  trackNo: string;
  artist: string;
  title: string;
  album: string;
  duration: string;
  date: string;
  rawDuration: number;
  bitrate?: number;
  sampleRate?: number;
  codec?: string;
}
