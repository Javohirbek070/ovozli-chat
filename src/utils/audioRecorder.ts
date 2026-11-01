import { extractWaveform, applyAudioFilter } from './audioEffects';

export interface RecordResult {
  blob: Blob;
  duration: number;
  waveform: number[];
  audioUrl: string;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private startTime = 0;
  private timerInterval: number | null = null;
  public onTimeUpdate?: (seconds: number) => void;

  public async start(): Promise<AnalyserNode> {
    this.audioChunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.audioCtx = new AudioContextClass();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);

    // Prefer webm / ogg / mp4 depending on browser
    const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
    let selectedMime = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMime = type;
        break;
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, selectedMime ? { mimeType: selectedMime } : undefined);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.audioChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100);
    this.startTime = Date.now();

    this.timerInterval = window.setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      if (this.onTimeUpdate) {
        this.onTimeUpdate(Math.floor(elapsed));
      }
    }, 200);

    return this.analyser;
  }

  public async stop(filter: 'normal' | 'robot' | 'deep' | 'chipmunk' = 'normal'): Promise<RecordResult> {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        return reject(new Error('Recorder not initialized'));
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const rawBlob = new Blob(this.audioChunks, {
            type: this.mediaRecorder?.mimeType || 'audio/webm',
          });

          // Apply voice filter if chosen
          const finalBlob = await applyAudioFilter(rawBlob, filter);
          const waveform = await extractWaveform(finalBlob);
          const audioUrl = URL.createObjectURL(finalBlob);

          this.cleanup();
          resolve({
            blob: finalBlob,
            duration,
            waveform,
            audioUrl,
          });
        } catch (err) {
          this.cleanup();
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
  }

  private cleanup() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
