import React, { useState } from 'react';
import { Waves, Share2, Check, Radio, Menu } from 'lucide-react';
import type { Room } from '../types';

interface NavbarProps {
  currentRoom: Room;
  onlineCount: number;
  isCallActive: boolean;
  onToggleSidebar: () => void;
  onToggleCall: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoom,
  onlineCount,
  isCallActive,
  onToggleSidebar,
  onToggleCall,
}) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('room', currentRoom.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-slate-950/80 border-b border-white/10 px-4 py-3 backdrop-blur-xl sticky top-0 z-40 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 md:hidden text-slate-300"
          title="Menyu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-violet-600/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                VoxWave
              </span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Ovozli
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {currentRoom.name} — {currentRoom.description}
            </p>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Call Toggle pill */}
        <button
          onClick={onToggleCall}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
            isCallActive
              ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30 animate-pulse'
              : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isCallActive ? "Jonli Efirda" : "Jonli Ovoz"}
          </span>
        </button>

        {/* Share Room Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
          title="Do'stlarga havola yuborish"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Nusxalandi!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden md:inline">Ulashish</span>
            </>
          )}
        </button>

        {/* Online Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-white/5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{onlineCount} onlayn</span>
        </div>

        {/* GitHub link */}
        <a
          href="https://github.com/Javohirbek070/ovozli-chat"
          target="_blank"
          rel="noreferrer"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          title="GitHub Repo"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </a>
      </div>
    </header>
  );
};
