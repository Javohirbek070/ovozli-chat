import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Bot, Sparkles, Smile, Volume2, FileText } from 'lucide-react';
import type { VoiceMessage, User } from '../types';
import { playSound } from '../utils/audioEffects';

interface VoiceMessageCardProps {
  message: VoiceMessage;
  currentUser: User;
  onReact: (messageId: string, emoji: string) => void;
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
    robot: { label: 'Robot', icon: Bot, color: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/30' },
    deep: { label: 'Bass', icon: Volume2, color: 'text-indigo-300 bg-indigo-950/40 border-indigo-500/30' },
    chipmunk: { label: 'Chipmunk', icon: Sparkles, color: 'text-amber-300 bg-amber-950/40 border-amber-500/30' },
  };

  const currentFilter = message.filterApplied ? filterLabels[message.filterApplied] : null;
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const totalWaveBars = message.waveform?.length || 32;

  return (
    <div className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'} my-2.5 transition-all`}>
      <div
        className={`max-w-[88%] sm:max-w-md rounded-3xl p-4 transition-all relative group ${
          isMine ? 'liquid-bubble-mine' : 'liquid-bubble-other'
        }`}
      >
        {/* Header: Sender & Meta */}
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm ring-1 ring-white/30"
              style={{ backgroundColor: message.senderColor || '#8b5cf6' }}
            >
              {message.senderName ? message.senderName[0].toUpperCase() : 'U'}
            </div>
            <span className="font-semibold tracking-wide text-white/95">
              {isMine ? "Siz" : message.senderName}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentFilter && (
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border backdrop-blur-sm ${currentFilter.color}`}>
                <currentFilter.icon className="w-2.5 h-2.5" />
                {currentFilter.label}
              </span>
            )}
            <span className="text-[11px] text-white/60 font-mono">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Audio Player Controls & Waveform */}
        <div className="flex items-center gap-3">
          {/* Glass Play/Pause Button */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "To'xtatish" : "Eshitish"}
            className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-95 shadow-xl ${
              isMine
                ? 'bg-white text-violet-800 hover:bg-slate-100 shadow-white/20'
                : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          {/* Waveform Scrubber */}
          <div className="flex-1 flex flex-col gap-1 min-w-[170px]">
            <div className="flex items-center gap-[2.5px] h-9 py-1 cursor-pointer">
              {message.waveform.map((peak, idx) => {
                const barProgress = (idx + 1) / totalWaveBars;
                const isPlayed = barProgress <= progressRatio;
                const heightPercent = Math.max(20, Math.min(100, Math.round(peak * 100)));

                return (
                  <div
                    key={idx}
                    onClick={() => handleSeek(idx, totalWaveBars)}
                    className="flex-1 flex items-center justify-center group/bar h-full"
                    title={`O'tish: ${formatTime((idx / totalWaveBars) * duration)}`}
                  >
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-full transition-all duration-75 ${
                        isPlayed
                          ? isMine
                            ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)]'
                            : 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.9)]'
                          : isMine
                          ? 'bg-white/35 group-hover/bar:bg-white/60'
                          : 'bg-white/20 group-hover/bar:bg-white/40'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Time progress & Speed Toggle */}
            <div className="flex items-center justify-between text-[11px] font-mono text-white/75">
              <span>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={cycleSpeed}
                  className="px-1.5 py-0.5 rounded-lg bg-black/25 hover:bg-black/40 text-[10px] font-bold font-sans transition-all border border-white/10 backdrop-blur-sm"
                  title="Tezlikni o'zgartirish"
                >
                  {playbackSpeed}x
                </button>
                <a
                  href={message.audioUrl}
                  download={`ovozli_xabar_${message.id}.wav`}
                  className="p-1 rounded-lg hover:bg-black/25 transition-colors text-white/70 hover:text-white"
                  title="Yuklab olish (.wav)"
                >
                  <Download className="w-3.5 h-3.5" />
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
              className="flex items-center gap-1.5 text-cyan-300/80 hover:text-cyan-200 transition-colors font-medium mb-1 text-[11px]"
            >
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>Matnga aylantirilgan:</span>
            </button>
            {showTranscript && (
              <p className="bg-black/20 backdrop-blur-md rounded-xl p-2.5 font-sans italic text-[11px] leading-relaxed border border-white/10 text-white/90">
                "{message.transcription}"
              </p>
            )}
          </div>
        )}

        {/* Reactions Bar */}
        <div className="mt-2.5 pt-1.5 flex items-center justify-between relative">
          <div className="flex items-center gap-1 flex-wrap">
            {Object.entries(message.reactions || {}).map(([emoji, count]) => {
              if (count <= 0) return null;
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-black/20 hover:bg-black/40 border border-white/15 backdrop-blur-md transition-all active:scale-90"
                >
                  <span>{emoji}</span>
                  <span className="text-[10px] font-bold text-white/90">{count}</span>
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
            <div className="absolute bottom-8 left-0 z-20 flex items-center gap-1 p-2 rounded-2xl liquid-glass shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 border border-white/25">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="p-1 text-base hover:scale-130 transition-transform active:scale-95"
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
