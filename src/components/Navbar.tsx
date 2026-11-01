import React, { useState } from 'react';
import { Waves, Share2, Check, Radio, Users, User, Sparkles } from 'lucide-react';
import type { User as UserType } from '../types';

interface NavbarProps {
  currentUser: UserType;
  onlineCount: number;
  isCallActive: boolean;
  onToggleCall: () => void;
  onOpenProfile: () => void;
  onOpenParticipants: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onlineCount,
  isCallActive,
  onToggleCall,
  onOpenProfile,
  onOpenParticipants,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = new URL(window.location.href);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full sticky top-0 z-40 px-3 sm:px-6 py-3.5">
      <div className="max-w-4xl mx-auto liquid-glass rounded-2xl sm:rounded-3xl px-4 py-2.5 flex items-center justify-between transition-all">
        {/* Brand & Room Info */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-violet-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d18]/85 backdrop-blur-md rounded-[14px] flex items-center justify-center">
                <Waves className="w-5 h-5 text-cyan-300 transition-transform group-hover:scale-110" />
              </div>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090b10] animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>VoxWave</span>
                <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
                  Umumiy Suhbat
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>Ochiq ovozli muloqot xonasi</span>
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Live Call Toggle Pill */}
          <button
            onClick={onToggleCall}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl text-xs font-semibold transition-all ${
              isCallActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/30 scale-105'
                : 'liquid-glass-pill text-violet-300 hover:text-white'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isCallActive ? 'animate-pulse' : 'text-violet-400'}`} />
            <span className="hidden sm:inline">
              {isCallActive ? "Jonli Efirda" : "Jonli Ovoz"}
            </span>
          </button>

          {/* Participants Counter Pill */}
          <button
            onClick={onOpenParticipants}
            className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl text-xs text-slate-300 hover:text-white transition-all"
            title="Suhbatdoshlarni ko'rish"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold">{onlineCount}</span>
          </button>

          {/* Share Link Pill */}
          <button
            onClick={handleShare}
            className="liquid-glass-pill flex items-center gap-1.5 px-3 py-1.5 rounded-xl sm:rounded-2xl text-xs text-slate-300 hover:text-white transition-all"
            title="Havolani nusxalash"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 text-[11px] font-bold hidden sm:inline">Nusxalandi!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden md:inline text-[11px]">Ulashish</span>
              </>
            )}
          </button>

          {/* User Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="relative p-0.5 rounded-xl sm:rounded-2xl border border-white/20 transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: currentUser.avatarColor || '#8b5cf6' }}
            title="Profil sozlamalari"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[10px] sm:rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-inner">
              {currentUser.name ? currentUser.name[0].toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-spin" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
