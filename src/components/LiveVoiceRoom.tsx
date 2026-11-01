import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Radio } from 'lucide-react';
import type { User } from '../types';

interface LiveVoiceRoomProps {
  roomName: string;
  activeUsers: User[];
  isCallActive: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  onToggleCall: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
}

export const LiveVoiceRoom: React.FC<LiveVoiceRoomProps> = ({
  roomName,
  activeUsers,
  isCallActive,
  isMuted,
  isDeafened,
  onToggleCall,
  onToggleMute,
  onToggleDeafen,
}) => {
  if (!isCallActive) {
    return null;
  }

  return (
    <div className="w-full px-3 sm:px-6 my-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="max-w-4xl mx-auto liquid-glass rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-violet-400/25 shadow-2xl backdrop-blur-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Call Status & Active Speaking Avatars */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Jonli Efir • {roomName}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {activeUsers.length} suhbatdosh ulangan (P2P Audio)
              </p>
            </div>
          </div>

          {/* Avatars with Fluid Glow */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            {activeUsers.map((user) => (
              <div key={user.id} className="relative group">
                <div
                  style={{ backgroundColor: user.avatarColor || '#8b5cf6' }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white transition-all shadow-lg ${
                    user.isSpeaking
                      ? 'ring-4 ring-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.9)] scale-110'
                      : 'border border-white/25'
                  }`}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                {user.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-[#0a0d18]">
                    <MicOff className="w-2 h-2 text-white" />
                  </div>
                )}
                {/* Tooltip */}
                <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] text-white whitespace-nowrap z-30 border border-white/10">
                  {user.name} {user.isSpeaking ? '• Gapiryapti' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Liquid Glass Audio Controls */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Mute Mic */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-inner'
                : 'liquid-glass-pill text-slate-200'
            }`}
          >
            {isMuted ? (
              <MicOff className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>{isMuted ? "Ovozim o'chiq" : "Ovozim ochiq"}</span>
          </button>

          {/* Deafen */}
          <button
            onClick={onToggleDeafen}
            className={`p-2 rounded-xl transition-all ${
              isDeafened
                ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                : 'liquid-glass-pill text-slate-200'
            }`}
            title={isDeafened ? "Karnayni yoqish" : "Karnayni o'chirish"}
          >
            {isDeafened ? (
              <VolumeX className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
          </button>

          {/* Leave Call */}
          <button
            onClick={onToggleCall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
