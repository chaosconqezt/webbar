import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const Visualizer: React.FC<VisualizerProps> = ({ audioRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  useEffect(() => {
    let isInitialized = false;

    const initAudio = () => {
      const audioElement = audioRef.current;
      if (!audioElement || !canvasRef.current || isInitialized) return;

      if (!contextRef.current) {
        contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyzerRef.current = contextRef.current.createAnalyser();
        analyzerRef.current.fftSize = 256; 
        
        const bufferLength = analyzerRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        try {
          sourceRef.current = contextRef.current.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyzerRef.current);
          analyzerRef.current.connect(contextRef.current.destination);
          isInitialized = true;
        } catch (e) {
          console.error("Visualizer initialization error:", e);
        }
      }
    };

    // Try to initialize immediately or when audio starts playing
    const handlePlay = () => {
      initAudio();
      if (contextRef.current && contextRef.current.state === 'suspended') {
        contextRef.current.resume();
      }
    };

    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.addEventListener('play', handlePlay);
      // Also try to init now if already playing
      if (!audioElement.paused) {
        handlePlay();
      }
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      if (!analyzerRef.current || !dataArrayRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barCount = 64; 
      const barWidth = (canvas.width / barCount);
      
      for (let i = 0; i < barCount; i++) {
        const val = dataArrayRef.current[i];
        const barHeight = (val / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#ff9900');
        gradient.addColorStop(1, '#ffcc33');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(i * barWidth, canvas.height - barHeight, barWidth - 1, barHeight);
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      if (audioElement) {
        audioElement.removeEventListener('play', handlePlay);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioRef.current]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center p-1">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={40} 
        className="w-full h-full opacity-80"
      />
    </div>
  );
};
