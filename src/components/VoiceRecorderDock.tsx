import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Bot, Volume2, Sparkles, Wand2, Globe } from 'lucide-react';
import { AudioRecorder } from '../utils/audioRecorder';
import { LiveSpeechTranscriber } from '../utils/speechRecognition';
import { AudioVisualizer } from './AudioVisualizer';
import { playSound } from '../utils/audioEffects';

interface VoiceRecorderDockProps {
  onSendVoice: (
    blob: Blob,
    duration: number,
    waveform: number[],
    transcription: string,
    filter: 'normal' | 'robot' | 'deep' | 'chipmunk'
  ) => void;
  disabled?: boolean;
}

export const VoiceRecorderDock: React.FC<VoiceRecorderDockProps> = ({ onSendVoice, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'normal' | 'robot' | 'deep' | 'chipmunk'>('normal');
  const [selectedLang, setSelectedLang] = useState<'uz-UZ' | 'ru-RU' | 'en-US'>('uz-UZ');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const recorderRef = useRef<AudioRecorder | null>(null);
  const transcriberRef = useRef<LiveSpeechTranscriber | null>(null);

  useEffect(() => {
    transcriberRef.current = new LiveSpeechTranscriber();
  }, []);

  const startRecording = async () => {
    if (disabled || isRecording || isProcessing) return;

    try {
      playSound('record-start');
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;

      recorder.onTimeUpdate = (secs) => {
        setRecordSeconds(secs);
      };

      const analyserNode = await recorder.start();
      setAnalyser(analyserNode);
      setIsRecording(true);
      setRecordSeconds(0);
      setLiveTranscript('');

      // Start live speech-to-text
      if (transcriberRef.current) {
        transcriberRef.current.setLanguage(selectedLang);
        transcriberRef.current.start((text) => {
          setLiveTranscript(text);
        });
      }
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert("Mikrofonga ruxsat berilmadi yoki qurilmada mikrofon topilmadi.");
    }
  };

  const handleStopAndSend = async () => {
    if (!isRecording || !recorderRef.current) return;

    try {
      setIsProcessing(true);
      playSound('record-stop');

      let finalTranscript = liveTranscript;
      if (transcriberRef.current) {
        finalTranscript = transcriberRef.current.stop() || liveTranscript;
      }

      const result = await recorderRef.current.stop(selectedFilter);
      setIsRecording(false);
      setAnalyser(null);
      setRecordSeconds(0);

      onSendVoice(result.blob, result.duration, result.waveform, finalTranscript.trim(), selectedFilter);
      playSound('send');
    } catch (err) {
      console.error('Error stopping recorder:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (!isRecording || !recorderRef.current) return;
    playSound('leave');
    recorderRef.current.cancel();
    if (transcriberRef.current) {
      transcriberRef.current.stop();
    }
    setIsRecording(false);
    setAnalyser(null);
    setRecordSeconds(0);
    setLiveTranscript('');
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const filterOptions = [
    { id: 'normal', label: 'Tabiiy ovoz', icon: Wand2 },
    { id: 'robot', label: 'Robot ovoz', icon: Bot },
    { id: 'deep', label: 'Bass / Chuqur', icon: Volume2 },
    { id: 'chipmunk', label: 'Chipmunk (Yuqori)', icon: Sparkles },
  ] as const;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-3 relative">
      {/* Voice filter & Language Selector Popover */}
      {showFilterMenu && (
        <div className="absolute bottom-20 left-4 sm:left-auto right-4 sm:right-auto z-30 p-3.5 liquid-glass rounded-3xl shadow-2xl backdrop-blur-3xl animate-in fade-in slide-in-from-bottom-3 flex flex-col gap-3 min-w-[270px] border border-white/20">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Ovoz Effektlari (Filtr)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    setSelectedFilter(opt.id);
                    setShowFilterMenu(false);
                  }}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                    selectedFilter === opt.id
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-md shadow-violet-600/30 ring-1 ring-white/30'
                      : 'liquid-glass-pill text-slate-300 hover:text-white'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2.5 border-t border-white/10">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nutqni aniqlash tili</span>
            </div>
            <div className="flex gap-1.5">
              {[
                { code: 'uz-UZ', name: "O'zbekcha" },
                { code: 'ru-RU', name: 'Русский' },
                { code: 'en-US', name: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code as 'uz-UZ' | 'ru-RU' | 'en-US');
                    if (transcriberRef.current) {
                      transcriberRef.current.setLanguage(lang.code as 'uz-UZ' | 'ru-RU' | 'en-US');
                    }
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-medium text-center transition-all ${
                    selectedLang === lang.code
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md shadow-cyan-600/30 ring-1 ring-white/30'
                      : 'liquid-glass-pill text-slate-400 hover:text-white'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Floating Liquid Glass Dock */}
      <div className="flex items-center gap-2.5 p-2 liquid-glass rounded-3xl shadow-2xl backdrop-blur-3xl transition-all">
        {/* Voice effect & Settings Trigger Button */}
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          disabled={isRecording}
          title="Ovoz effektlari va til"
          className={`p-2.5 rounded-2xl border transition-all ${
            selectedFilter !== 'normal'
              ? 'bg-violet-500/25 border-violet-400/50 text-violet-200 shadow-lg shadow-violet-500/20'
              : 'liquid-glass-pill text-slate-400 hover:text-white'
          }`}
        >
          <Wand2 className="w-4 h-4" />
        </button>

        {!isRecording ? (
          /* Normal State: Prompt & Record Action */
          <>
            <div
              onClick={startRecording}
              className="flex-1 px-3 py-2 text-slate-400 text-sm flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <span className="text-slate-300 group-hover:text-white transition-colors font-medium">
                  Ovozli habar yozish uchun bosing...
                </span>
              </div>
              <span className="text-[11px] text-slate-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10 hidden sm:inline-block">
                {selectedFilter !== 'normal' ? `Filtr: ${selectedFilter}` : "Nutq-matn yoqilgan"}
              </span>
            </div>

            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              title="Ovoz yozishni boshlash"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 hover:opacity-95 text-white font-semibold text-sm flex items-center gap-2 shadow-xl shadow-violet-600/30 transition-all active:scale-95 shrink-0 border border-white/25"
            >
              <Mic className="w-4 h-4" />
              <span>Yozish</span>
            </button>
          </>
        ) : (
          /* Active Recording State */
          <>
            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              title="Bekor qilish"
              className="p-2.5 rounded-2xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all shrink-0"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Pulsing Red Dot & Timer */}
            <div className="flex items-center gap-2 px-2 shrink-0">
              <span className="w-3 h-3 rounded-full bg-red-500 recording-pulse" />
              <span className="font-mono text-sm font-bold text-red-400">
                {formatTimer(recordSeconds)}
              </span>
            </div>

            {/* Live Audio Visualizer Canvas */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
              <AudioVisualizer analyser={analyser} isRecording={isRecording} />
            </div>

            {/* Stop & Send Button */}
            <button
              onClick={handleStopAndSend}
              disabled={isProcessing}
              title="Yuborish"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-400 hover:opacity-95 text-slate-950 font-bold text-sm flex items-center gap-1.5 shadow-xl shadow-emerald-500/30 transition-all active:scale-95 shrink-0 border border-white/30"
            >
              <Send className="w-4 h-4 fill-slate-950" />
              <span className="hidden sm:inline">Yuborish</span>
            </button>
          </>
        )}
      </div>

      {/* Live transcription balloon during recording */}
      {isRecording && liveTranscript && (
        <div className="mt-2.5 p-2.5 liquid-glass rounded-2xl text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 border border-cyan-400/30">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
          <span className="italic truncate font-medium">"{liveTranscript}"</span>
        </div>
      )}
    </div>
  );
};
