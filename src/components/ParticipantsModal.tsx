import React from 'react';
import { X, Users, Mic, MicOff, ShieldCheck } from 'lucide-react';
import type { User } from '../types';

interface ParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeUsers: User[];
  currentUserId: string;
}

export const ParticipantsModal: React.FC<ParticipantsModalProps> = ({
  isOpen,
  onClose,
  activeUsers,
  currentUserId,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm liquid-glass rounded-3xl p-5 border border-white/20 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Umumiy Suhbatdagilar ({activeUsers.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="my-4 max-h-64 overflow-y-auto space-y-2 pr-1">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{ backgroundColor: user.avatarColor || '#8b5cf6' }}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm ring-1 ring-white/30"
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>{user.name}</span>
                    {user.id === currentUserId && (
                      <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-1.5 py-0.2 rounded-full border border-cyan-400/20">
                        Siz
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Onlayn
                  </span>
                </div>
              </div>

              <div className="text-slate-400">
                {user.isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> WebRTC P2P
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-medium transition-colors"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
