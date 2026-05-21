import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../types';

export function useAudioPlayer(tracks: Track[]) {
  const [playingTrack, setPlayingTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Audio player logic
  useEffect(() => {
    if (playingTrack && audioRef.current) {
      const streamUrl = `/api/stream?path=${encodeURIComponent(playingTrack.path)}`;
      
      const currentSrc = audioRef.current.getAttribute('src');
      if (currentSrc !== streamUrl) {
        audioRef.current.src = streamUrl;
      }

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Playback failed:", e.message, e);
            }
          });
      } else {
        setIsPlaying(true);
      }
    } else if (!playingTrack && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, [playingTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  };

  const playRandom = () => {
    if (tracks.length > 0) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      const randomTrack = tracks[randomIndex];
      setPlayingTrack(randomTrack);
      return randomTrack;
    }
    return null;
  };

  const playNext = () => {
    if (tracks.length === 0) return null;
    if (shuffle) {
      return playRandom();
    }
    const currentIndex = tracks.findIndex(t => t.path === playingTrack?.path);
    if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      setPlayingTrack(nextTrack);
      return nextTrack;
    } else {
      stopPlayback();
      return null;
    }
  };

  const playPrev = () => {
    if (tracks.length === 0) return null;
    const currentIndex = tracks.findIndex(t => t.path === playingTrack?.path);
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      setPlayingTrack(prevTrack);
      return prevTrack;
    } else {
      stopPlayback();
      return null;
    }
  };

  const handleEnded = () => {
    playNext();
  };

  const togglePlayPause = (selectedTrack: Track | null, setSelectedTrack: (t: Track) => void) => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        if (playingTrack) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => setIsPlaying(true)).catch(e => {
              if (e.name !== 'AbortError') console.error("Play failed:", e);
            });
          } else {
            setIsPlaying(true);
          }
        } else if (selectedTrack) {
          setPlayingTrack(selectedTrack);
        } else if (tracks.length > 0) {
          setPlayingTrack(tracks[0]);
          setSelectedTrack(tracks[0]);
        }
      }
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - bounds.left;
    let newVolume = clickX / bounds.width;
    newVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(newVolume);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && playingTrack) {
      const bounds = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - bounds.left;
      const percentage = clickX / bounds.width;
      audioRef.current.currentTime = percentage * audioRef.current.duration;
      setProgress(percentage * 100);
    }
  };

  return {
    audioRef,
    playingTrack,
    setPlayingTrack,
    isPlaying,
    progress,
    currentTime,
    volume,
    shuffle,
    setShuffle,
    stopPlayback,
    playNext,
    playPrev,
    handleTimeUpdate,
    handleEnded,
    togglePlayPause,
    handleVolumeClick,
    handleProgressClick
  };
}
