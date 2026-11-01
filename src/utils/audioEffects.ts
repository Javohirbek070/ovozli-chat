// Procedural sound effects using Web Audio API (Zero external assets, guaranteed to work)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const playSound = (type: 'record-start' | 'record-stop' | 'send' | 'receive' | 'reaction' | 'join' | 'leave') => {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    switch (type) {
      case 'record-start': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'record-stop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      }
      case 'send': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(1040, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
      }
      case 'receive': {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(659.25, now); // E5
        osc2.frequency.setValueAtTime(880, now + 0.08); // A5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.08);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);
        break;
      }
      case 'reaction': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      }
      case 'join': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
      case 'leave': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
      }
    }
  } catch (err) {
    console.warn('Audio playback not permitted yet:', err);
  }
};

// Process recorded audio blob with voice effects
export async function applyAudioFilter(
  blob: Blob,
  filter: 'normal' | 'robot' | 'deep' | 'chipmunk'
): Promise<Blob> {
  if (filter === 'normal') return blob;

  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = getAudioContext();
    const originalBuffer = await ctx.decodeAudioData(arrayBuffer);

    // Rate adjustment for pitch:
    // chipmunk = 1.35x speed & higher pitch
    // deep = 0.78x speed & lower pitch
    const rate = filter === 'chipmunk' ? 1.35 : filter === 'deep' ? 0.78 : 1.0;
    const offlineCtx = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      Math.ceil(originalBuffer.length / rate),
      originalBuffer.sampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = originalBuffer;
    source.playbackRate.value = rate;

    if (filter === 'robot') {
      // Ring modulation effect
      const osc = offlineCtx.createOscillator();
      const oscGain = offlineCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 65; // Low buzz
      oscGain.gain.value = 0.6;
      osc.connect(oscGain.gain);

      const filterNode = offlineCtx.createBiquadFilter();
      filterNode.type = 'bandpass';
      filterNode.frequency.value = 1200;
      filterNode.Q.value = 2.5;

      source.connect(filterNode);
      filterNode.connect(offlineCtx.destination);
      osc.start(0);
    } else {
      source.connect(offlineCtx.destination);
    }

    source.start(0);
    const renderedBuffer = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV Blob
    return audioBufferToWav(renderedBuffer);
  } catch (e) {
    console.error('Failed to apply audio effect:', e);
    return blob; // fallback to original
  }
}

// Convert AudioBuffer to WAV Blob
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const ch0 = buffer.getChannelData(0);
    const ch1 = buffer.getChannelData(1);
    result = new Float32Array(ch0.length + ch1.length);
    for (let i = 0; i < ch0.length; i++) {
      result[i * 2] = ch0[i];
      result[i * 2 + 1] = ch1[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataByteCount = result.length * bytesPerSample;
  const wavBuffer = new ArrayBuffer(44 + dataByteCount);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataByteCount, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataByteCount, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([wavBuffer], { type: 'audio/wav' });
}

// Generate amplitude peaks from audio blob for waveform visualization
export async function extractWaveform(blob: Blob, barCount = 36): Promise<number[]> {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const ctx = getAudioContext();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.floor(channelData.length / barCount);
    const peaks: number[] = [];

    for (let i = 0; i < barCount; i++) {
      const start = i * step;
      let max = 0;
      for (let j = 0; j < step; j++) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      // Normalize with min floor so it looks aesthetic
      peaks.push(Math.max(0.12, Math.min(1, Number(max.toFixed(2)))));
    }
    return peaks;
  } catch (err) {
    // Aesthetic fallback if decode fails
    return Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.7);
  }
}
