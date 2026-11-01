import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Bot, Sparkles, Smile, Volume2, FileText } from 'lucide-react';
import type { VoiceMessage, User } from '../types';
import { playSound } from '../utils/audioEffects';

interface VoiceMessageCardProps {
  message: VoiceMessage;
  currentUser: User;
  onReact: (messageId: string, emoji: string) => void;
  onDelete?: (messageId: string) => void;
}

const EMOJI_OPTIONS = ['❤️', '🔥', '👍', '😂', '👏', '🎉'];

export const VoiceMessageCard: React.FC<VoiceMessageCardProps> = ({
  message,
  currentUser,
  onReact,
}) => {
  const isMine = message.senderId === currentUser.id;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(message.duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(message.audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(Math.round(audio.duration));
      }
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [message.audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
      });
    }
  };

  const cycleSpeed = () => {
    const nextSpeed: 1 | 1.5 | 2 = playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1;
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleSeek = (index: number, totalBars: number) => {
    if (!audioRef.current || !duration) return;
    const targetTime = (index / totalBars) * duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleReactionClick = (emoji: string) => {
    playSound('reaction');
    onReact(message.id, emoji);
    setShowEmojiPicker(false);
  };

  const filterLabels = {
    normal: null,
    robot: { label: 'Robot', icon: Bot, color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/50' },
    deep: { label: 'Bass', icon: Volume2, color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/50' },
    chipmunk: { label: 'Chipmunk', icon: Sparkles, color: 'text-amber-400 bg-amber-950/60 border-amber-800/50' },
  };

  const currentFilter = message.filterApplied ? filterLabels[message.filterApplied] : null;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const totalWaveBars = message.waveform?.length || 32;

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} my-2`}>
      <div
        className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 shadow-xl transition-all border backdrop-blur-md ${
          isMine
            ? 'bg-gradient-to-br from-violet-600/90 to-purple-700/90 text-white border-violet-400/30 shadow-violet-900/20'
            : 'bg-slate-900/90 text-slate-100 border-white/10 shadow-black/40'
        }`}
      >
        {/* Header: Sender Info & Filter tag */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
              style={{ backgroundColor: message.senderColor || '#8b5cf6' }}
            >
              {message.senderName ? message.senderName[0].toUpperCase() : 'U'}
            </div>
            <span className="font-semibold tracking-wide">
              {isMine ? "Siz" : message.senderName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentFilter && (
              <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${currentFilter.color}`}>
                <currentFilter.icon className="w-2.5 h-2.5" />
                {currentFilter.label}
              </span>
            )}
            <span className="text-[11px] opacity-60">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Main Audio Player Controls & Waveform */}
        <div className="flex items-center gap-3">
          {/* Play / Pause button */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "To'xtatish" : "Eshitish"}
            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-lg ${
              isMine
                ? 'bg-white text-violet-700 hover:bg-slate-100'
                : 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/30'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Interactive Scrubbable Waveform */}
          <div className="flex-1 flex flex-col gap-1 min-w-[170px]">
            <div className="flex items-center gap-[2.5px] h-9 py-1 cursor-pointer">
              {message.waveform.map((peak, idx) => {
                const barProgress = (idx + 1) / totalWaveBars;
                const isPlayed = barProgress <= progressRatio;
                const heightPercent = Math.max(18, Math.min(100, Math.round(peak * 100)));

                return (
                  <div
                    key={idx}
                    onClick={() => handleSeek(idx, totalWaveBars)}
                    className="flex-1 flex items-center justify-center group h-full"
                    title={`O'tish: ${formatTime((idx / totalWaveBars) * duration)}`}
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-full transition-all duration-75 ${
                        isPlayed
                          ? isMine
                            ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]'
                            : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.7)]'
                          : isMine
                          ? 'bg-white/35 group-hover:bg-white/60'
                          : 'bg-slate-700 group-hover:bg-slate-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Time progress & Speed Toggle */}
            <div className="flex items-center justify-between text-[11px] font-mono opacity-80">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={cycleSpeed}
                  className="px-1.5 py-0.5 rounded bg-black/25 hover:bg-black/40 text-[10px] font-bold font-sans transition-colors border border-white/10"
                  title="Tezlikni o'zgartirish"
                >
                  {playbackSpeed}x
                </button>
                <a
                  href={message.audioUrl}
                  download={`ovozli_xabar_${message.id}.wav`}
                  className="p-1 rounded hover:bg-black/20 transition-colors"
                  title="Yuklab olish"
                >
                  <Download className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Live Speech-to-Text Transcription */}
        {message.transcription && (
          <div className="mt-2.5 pt-2 border-t border-white/10 text-xs">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity font-medium mb-1 text-[11px]"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Matnga aylantirilgan:</span>
            </button>
            {showTranscript && (
              <p className="bg-black/25 rounded-lg p-2 font-sans italic text-[11px] leading-relaxed border border-white/5 selection:bg-cyan-500/30">
                "{message.transcription}"
              </p>
            )}
          </div>
        )}

        {/* Reactions Bar */}
        <div className="mt-2 pt-1 flex items-center justify-between relative">
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(message.reactions || {}).map(([emoji, count]) => {
              if (count <= 0) return null;
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs bg-black/20 hover:bg-black/40 border border-white/10 transition-all active:scale-90"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-bold">{count}</span>
                </button>
              );
            })}

            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 rounded-full hover:bg-white/15 text-white/60 hover:text-white transition-colors"
              title="Reaksiya bildirish"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Emoji Selector Popup */}
          {showEmojiPicker && (
            <div className="absolute bottom-7 left-0 z-20 flex items-center gap-1 p-1.5 rounded-xl bg-slate-900 border border-white/20 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="p-1.5 text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
