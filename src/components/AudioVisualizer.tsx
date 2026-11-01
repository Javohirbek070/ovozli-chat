import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isRecording }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isRecording || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationFrameId: number;

    const render = () => {
      animationFrameId = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const usableBars = Math.floor(bufferLength / 2);
      const barWidth = (canvas.width / usableBars) * 1.4;
      let x = 0;

      for (let i = 0; i < usableBars; i++) {
        const barHeight = Math.max(3, (dataArray[i] / 255) * canvas.height * 0.9);

        // Fluid liquid gradient
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#06b6d4');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#f43f5e');

        ctx.fillStyle = gradient;

        // Draw rounded liquid pill bar
        const width = Math.max(2, barWidth - 1.5);
        const y = canvas.height - barHeight;
        if (ctx.roundRect) {
          ctx.beginPath();
          ctx.roundRect(x, y, width, barHeight, 3);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, width, barHeight);
        }

        x += barWidth;
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRecording, analyser]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={38}
      className="rounded-xl bg-white/[0.04] backdrop-blur-md border border-white/10 shadow-inner"
    />
  );
};
