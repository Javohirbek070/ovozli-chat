import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Users, Radio } from 'lucide-react';
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
    return (
      <div className="w-full bg-slate-900/40 border-b border-white/5 py-2 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-slate-500" />
          <span>Jonli ovozli efir hozir nofaol</span>
        </div>
        <button
          onClick={onToggleCall}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-medium transition-colors"
        >
          <Mic className="w-3 h-3 text-violet-400" />
          <span>Jonli Efirga Kirish</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-violet-950/40 via-slate-900/60 to-slate-950/60 border-b border-violet-500/20 p-3 shadow-lg backdrop-blur-md animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Room Status & Participant Avatars */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-xs text-white flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Jonli Efir: {roomName}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Users className="w-2.5 h-2.5" /> {activeUsers.length} suhbatdosh
              </span>
            </div>
          </div>

          {/* Participant list with dynamic speaking glow */}
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            {activeUsers.map((user) => (
              <div key={user.id} className="relative group">
                <div
                  style={{ backgroundColor: user.avatarColor || '#8b5cf6' }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white transition-all shadow-md ${
                    user.isSpeaking
                      ? 'ring-4 ring-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)] scale-105'
                      : 'border border-white/20'
                  }`}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                {user.isMuted && (
                  <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-0.5 border border-slate-900">
                    <MicOff className="w-2 h-2 text-white" />
                  </div>
                )}
                {/* Tooltip on hover */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/80 px-1.5 py-0.5 rounded text-[9px] text-white whitespace-nowrap z-30">
                  {user.name} {user.isSpeaking ? '(Gapiryapti)' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Audio Control Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {/* Mute Mic */}
          <button
            onClick={onToggleMute}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isMuted
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15'
            }`}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? "Ovozim o'chiq" : "Ovozim ochiq"}</span>
          </button>

          {/* Deafen Audio */}
          <button
            onClick={onToggleDeafen}
            className={`p-1.5 rounded-lg border transition-all ${
              isDeafened
                ? 'bg-red-500/20 text-red-300 border-red-500/30'
                : 'bg-white/10 text-slate-200 border-white/10 hover:bg-white/15'
            }`}
            title={isDeafened ? "Karnayni yoqish" : "Karnayni o'chirish"}
          >
            {isDeafened ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          {/* Leave Call */}
          <button
            onClick={onToggleCall}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/30 transition-all active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Chiqish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
