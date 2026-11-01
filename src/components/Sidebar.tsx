import React, { useState } from 'react';
import { Hash, Plus, X, Users, Edit3, Volume2, Shield } from 'lucide-react';
import type { Room, User } from '../types';

interface SidebarProps {
  rooms: Room[];
  currentRoom: Room;
  currentUser: User;
  activeUsers: User[];
  isOpen: boolean;
  onSelectRoom: (room: Room) => void;
  onCreateRoom: (name: string, description: string) => void;
  onUpdateUser: (name: string, color: string) => void;
  onCloseMobile: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({
  rooms,
  currentRoom,
  currentUser,
  activeUsers,
  isOpen,
  onSelectRoom,
  onCreateRoom,
  onUpdateUser,
  onCloseMobile,
}) => {
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userName, setUserName] = useState(currentUser.name);
  const [selectedColor, setSelectedColor] = useState(currentUser.avatarColor);

  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      onUpdateUser(userName.trim(), selectedColor);
      setIsEditingUser(false);
    }
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim(), newRoomDesc.trim() || 'Ovozli suhbat xonasi');
      setNewRoomName('');
      setNewRoomDesc('');
      setIsCreatingRoom(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-slate-950 border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Sidebar Header / User Card */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: currentUser.avatarColor }}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg text-sm"
            >
              {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-slate-100 flex items-center gap-1.5">
                {currentUser.name}
                <button
                  onClick={() => setIsEditingUser(true)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Profilni tahrirlash"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </span>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Onlayn
              </span>
            </div>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Edit Modal / Dropdown */}
        {isEditingUser && (
          <form onSubmit={handleSaveUser} className="p-3 bg-slate-900 border-b border-white/10 flex flex-col gap-2.5">
            <label className="text-xs text-slate-300 font-medium">Ismingiz:</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="px-2.5 py-1.5 bg-black/40 border border-white/15 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500"
              placeholder="Ismingizni kiriting"
              maxLength={20}
              required
            />
            <label className="text-xs text-slate-300 font-medium">Avatar rangi:</label>
            <div className="flex items-center gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                onClick={() => setIsEditingUser(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-violet-600 hover:bg-violet-500 text-white rounded text-xs font-semibold"
              >
                Saqlash
              </button>
            </div>
          </form>
        )}

        {/* Rooms / Channels Section */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              <span>Ovozli Xonalar</span>
              <button
                onClick={() => setIsCreatingRoom(!isCreatingRoom)}
                className="p-1 hover:text-white transition-colors"
                title="Yangi xona ochish"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Create Room Form */}
            {isCreatingRoom && (
              <form onSubmit={handleCreateRoomSubmit} className="mb-3 p-2.5 bg-slate-900 border border-white/10 rounded-xl flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Xona nomi (masalan: Dizayn)"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="px-2 py-1 bg-black/40 border border-white/15 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Tavsifi (ixtiyoriy)"
                  value={newRoomDesc}
                  onChange={(e) => setNewRoomDesc(e.target.value)}
                  className="px-2 py-1 bg-black/40 border border-white/15 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingRoom(false)}
                    className="px-2 py-0.5 text-xs text-slate-400"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-0.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-medium"
                  >
                    Ochish
                  </button>
                </div>
              </form>
            )}

            {/* Room List */}
            <div className="flex flex-col gap-1">
              {rooms.map((room) => {
                const isActive = room.id === currentRoom.id;
                return (
                  <button
                    key={room.id}
                    onClick={() => {
                      onSelectRoom(room);
                      onCloseMobile();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                      isActive
                        ? 'bg-violet-600 text-white font-semibold shadow-md shadow-violet-600/30'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-base">{room.icon || <Hash className="w-4 h-4 opacity-60" />}</span>
                      <div className="truncate">
                        <div className="text-xs truncate">{room.name}</div>
                        <div className="text-[10px] text-slate-400 truncate group-hover:text-slate-300">
                          {room.description}
                        </div>
                      </div>
                    </div>

                    <Volume2 className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Online in this room */}
          <div className="pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-2">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                Faol Suhbatdoshlar ({activeUsers.length})
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {activeUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] text-xs text-slate-300"
                >
                  <div
                    style={{ backgroundColor: user.avatarColor || '#8b5cf6' }}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] text-white"
                  >
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="truncate">{user.name}</span>
                  {user.id === currentUser.id && (
                    <span className="text-[10px] text-slate-500 ml-auto">(Siz)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-3 border-t border-white/10 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-400" />
            End-to-End P2P Audio
          </span>
          <span>v1.0.0</span>
        </div>
      </aside>
    </>
  );
};
