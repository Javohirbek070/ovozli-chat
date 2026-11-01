import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import type { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (name: string, color: string) => void;
}

const AVATAR_COLORS = [
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#ef4444', // Red
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [selectedColor, setSelectedColor] = useState(currentUser.avatarColor);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), selectedColor);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm liquid-glass rounded-3xl p-5 border border-white/20 shadow-2xl backdrop-blur-3xl animate-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Profil Sozlamalari</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="my-4 space-y-4">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-2 py-1">
            <div
              style={{ backgroundColor: selectedColor }}
              className="w-16 h-16 rounded-3xl flex items-center justify-center font-extrabold text-2xl text-white shadow-2xl ring-4 ring-white/20 transition-all scale-105"
            >
              {name ? name[0].toUpperCase() : 'U'}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Avatar ko'rinishi</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Ismingiz yoki Taxallusingiz:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-2xl text-sm text-white focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 transition-all font-medium"
              placeholder="Masalan: Sardor"
              maxLength={22}
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              Rangni tanlang:
            </label>
            <div className="flex items-center justify-between gap-1.5">
              {AVATAR_COLORS.map((color) => (
                <button
                  type="button"
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{ backgroundColor: color }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    selectedColor === color
                      ? 'scale-125 ring-2 ring-white shadow-lg'
                      : 'opacity-70 hover:opacity-100 hover:scale-110'
                  }`}
                >
                  {selectedColor === color && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-violet-600/30 transition-all"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
