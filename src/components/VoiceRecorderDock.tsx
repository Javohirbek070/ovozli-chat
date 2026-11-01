import React, { useState, useRef, useEffect } from 'react';
import { Mic, Trash2, Send, Bot, Volume2, Sparkles, Wand2, Globe } from 'lucide-react';
import { AudioRecorder } from '../utils/audioRecorder';
import { LiveSpeechTranscriber } from '../utils/speechRecognition';
import { AudioVisualizer } from './AudioVisualizer';
import { playSound } from '../utils/audioEffects';

interface VoiceRecorderDockProps {
  onSendVoice: (blob: Blob, duration: number, waveform: number[], transcription: string, filter: 'normal' | 'robot' | 'deep' | 'chipmunk') => void;
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

      // Start live transcription
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
        <div className="absolute bottom-20 left-4 sm:left-auto right-4 sm:right-auto z-30 p-3 bg-slate-900/95 border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-3 min-w-[260px]">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
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
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedFilter === opt.id
                      ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <opt.icon className="w-3.5 h-3.5" />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
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
                  className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-medium text-center transition-all ${
                    selectedLang === lang.code
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="flex items-center gap-2.5 p-2 bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl">
        {/* Voice effect & Settings Trigger Button */}
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          disabled={isRecording}
          title="Ovoz effektlari va til"
          className={`p-2.5 rounded-xl border transition-all ${
            selectedFilter !== 'normal'
              ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
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
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-300 group-hover:text-white transition-colors">
                  Ovozli habar yozish uchun bosing...
                </span>
              </div>
              <span className="text-[11px] text-slate-500 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                {selectedFilter !== 'normal' ? `Filtr: ${selectedFilter}` : "Nutq-matn yoqilgan"}
              </span>
            </div>

            <button
              onClick={startRecording}
              disabled={disabled || isProcessing}
              title="Ovoz yozishni boshlash"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all active:scale-95 shrink-0"
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
              className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all shrink-0"
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
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Yuborish</span>
            </button>
          </>
        )}
      </div>

      {/* Live transcription balloon during recording */}
      {isRecording && liveTranscript && (
        <div className="mt-2 p-2 bg-slate-900/95 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-spin" />
          <span className="italic truncate">"{liveTranscript}"</span>
        </div>
      )}
    </div>
  );
};
