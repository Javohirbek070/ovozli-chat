// Speech to Text transcription using browser Web Speech API

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: { resultIndex: number; results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
  onerror: (event: { error: string }) => void;
  onend: () => void;
}

interface WindowWithSpeech extends Window {
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  SpeechRecognition?: new () => SpeechRecognitionInstance;
}

export class LiveSpeechTranscriber {
  private recognition: SpeechRecognitionInstance | null = null;
  private currentTranscript = '';
  private onUpdateCallback: ((text: string) => void) | null = null;
  public isSupported = false;

  constructor() {
    const win = window as unknown as WindowWithSpeech;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRec();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'uz-UZ'; // Default Uzbek
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    }
  }

  public setLanguage(lang: 'uz-UZ' | 'ru-RU' | 'en-US') {
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  public start(onUpdate: (text: string) => void) {
    if (!this.recognition) return;

    this.currentTranscript = '';
    this.onUpdateCallback = onUpdate;

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        const item = event.results[i];
        if (item && item[0]) {
          const text = item[0].transcript;
          final += text + ' ';
        }
      }

      const combined = (this.currentTranscript + ' ' + final + interim).trim();
      if (this.onUpdateCallback) {
        this.onUpdateCallback(combined);
      }
    };

    this.recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.warn('Speech recognition error:', e.error);
      }
    };

    try {
      this.recognition.start();
    } catch {
      // Ignore if already started
    }
  }

  public stop(): string {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }
    return this.currentTranscript;
  }
}
