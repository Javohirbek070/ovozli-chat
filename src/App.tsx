import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, MessageSquare } from 'lucide-react';
import type { User, VoiceMessage, Room } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LiveVoiceRoom } from './components/LiveVoiceRoom';
import { VoiceMessageCard } from './components/VoiceMessageCard';
import { VoiceRecorderDock } from './components/VoiceRecorderDock';
import { PeerRoomService } from './services/peerService';
import { playSound } from './utils/audioEffects';

const INITIAL_ROOMS: Room[] = [
  {
    id: 'umumiy',
    name: 'Umumiy Suhbat',
    description: "Barcha foydalanuvchilar uchun ochiq ovozli muloqot",
    icon: '🎙️',
  },
  {
    id: 'it-dasturlash',
    name: 'IT va Dasturlash',
    description: "Dasturchilar, texnologiyalar va startup muhokamalari",
    icon: '💻',
  },
  {
    id: 'ingliz-tili',
    name: 'Ingliz Tili (Speaking)',
    description: "Ingliz tilida ovozli amaliyot va erkin gaplashish",
    icon: '🌍',
  },
  {
    id: 'musiqa-kayfiyat',
    name: 'Musiqa va Kayfiyat',
    description: "Kafolatli yaxshi kayfiyat va qiziqarli fikrlar",
    icon: '🎧',
  },
];

// Generate synthetic pleasant chime audio blob for initial demo voice message
function createWelcomeAudioBlob(): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve) => {
    try {
      const sampleRate = 44100;
      const durationSec = 3.5;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * durationSec, sampleRate);

      // Create warm harmonic chord sequence (C - E - G - B - C)
      const freqs = [261.63, 329.63, 392.00, 493.88, 523.25];
      freqs.forEach((freq, idx) => {
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, 0);

        const startTime = idx * 0.45;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.8);
      });

      offlineCtx.startRendering().then((renderedBuffer) => {
        const channelData = renderedBuffer.getChannelData(0);
        const dataByteCount = channelData.length * 2;
        const wavBuffer = new ArrayBuffer(44 + dataByteCount);
        const view = new DataView(wavBuffer);

        const writeString = (offset: number, str: string) => {
          for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
          }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataByteCount, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataByteCount, true);

        let offset = 44;
        for (let i = 0; i < channelData.length; i++) {
          const s = Math.max(-1, Math.min(1, channelData[i]));
          view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
          offset += 2;
        }

        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        resolve({ blob, url });
      });
    } catch {
      // Fallback empty blob
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      resolve({ blob: emptyBlob, url: '' });
    }
  });
}

export function App() {
  // Current user state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('voxwave_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const randomId = Math.random().toString(36).substring(2, 9);
    const names = ['Jasur', 'Madina', 'Azizbek', 'Dilorom', 'Shahzod', 'Nilufar', 'Sardor'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const colors = ['#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const user: User = {
      id: randomId,
      name: randomName,
      avatarColor: randomColor,
      avatarIcon: 'user',
      isOnline: true,
      isSpeaking: false,
    };
    localStorage.setItem('voxwave_user', JSON.stringify(user));
    return user;
  });

  // Rooms state
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('voxwave_rooms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_ROOMS;
  });

  // Current active room (checked from URL ?room=...)
  const [currentRoom, setCurrentRoom] = useState<Room>(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      const match = INITIAL_ROOMS.find((r) => r.id === roomParam);
      if (match) return match;
      return {
        id: roomParam,
        name: `Xona #${roomParam}`,
        description: 'Maxsus yaratilgan ovozli suhbat xonasi',
        icon: '💬',
      };
    }
    return INITIAL_ROOMS[0];
  });

  // Messages per room
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([currentUser]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Live WebRTC Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const peerServiceRef = useRef<PeerRoomService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Welcome message
  useEffect(() => {
    createWelcomeAudioBlob().then(({ url }) => {
      if (url) {
        const welcomeMessage: VoiceMessage = {
          id: 'welcome-msg',
          senderId: 'system-bot',
          senderName: 'VoxWave Bot 🤖',
          senderColor: '#06b6d4',
          roomId: currentRoom.id,
          audioUrl: url,
          duration: 3,
          waveform: [0.3, 0.4, 0.6, 0.8, 0.9, 0.7, 0.85, 0.6, 0.95, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.2],
          timestamp: Date.now() - 60000,
          transcription: "Assalomu alaykum! VoxWave ovozli xabarlar platformasiga xush kelibsiz! Pastdagi mikrofon tugmasini bosib ovoz yozing.",
          filterApplied: 'normal',
          reactions: { '❤️': 3, '🔥': 2 },
        };
        setMessages((prev) => (prev.length === 0 ? [welcomeMessage] : prev));
      }
    });
  }, [currentRoom.id]);

  // Setup Peer Service
  useEffect(() => {
    const service = new PeerRoomService(currentUser);
    peerServiceRef.current = service;

    service.onNewVoiceMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      playSound('receive');
    };

    service.onReactionUpdate = (messageId, emoji) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const currentCount = m.reactions[emoji] || 0;
          return {
            ...m,
            reactions: { ...m.reactions, [emoji]: currentCount + 1 },
          };
        })
      );
    };

    service.onSpeakingChange = (userId, isSpeaking) => {
      setActiveUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSpeaking } : u))
      );
    };

    service.initPeer().then(() => {
      service.joinRoom(currentRoom.id);
    });

    return () => {
      service.destroy();
    };
  }, [currentUser, currentRoom.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update URL on room change
  const handleSelectRoom = (room: Room) => {
    setCurrentRoom(room);
    const url = new URL(window.location.href);
    url.searchParams.set('room', room.id);
    window.history.pushState({}, '', url.toString());
    if (peerServiceRef.current) {
      peerServiceRef.current.joinRoom(room.id);
    }
  };

  const handleCreateRoom = (name: string, description: string) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const newRoom: Room = {
      id: `${slug}-${Math.floor(Math.random() * 1000)}`,
      name,
      description,
      icon: '✨',
    };
    const updated = [...rooms, newRoom];
    setRooms(updated);
    localStorage.setItem('voxwave_rooms', JSON.stringify(updated));
    handleSelectRoom(newRoom);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
  };

  const handleUpdateUser = (name: string, color: string) => {
    const updated = { ...currentUser, name, avatarColor: color };
    setCurrentUser(updated);
    localStorage.setItem('voxwave_user', JSON.stringify(updated));
    setActiveUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updated : u)));
  };

  const handleSendVoice = (
    blob: Blob,
    duration: number,
    waveform: number[],
    transcription: string,
    filter: 'normal' | 'robot' | 'deep' | 'chipmunk'
  ) => {
    const audioUrl = URL.createObjectURL(blob);
    const newMessage: VoiceMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderColor: currentUser.avatarColor,
      roomId: currentRoom.id,
      audioUrl,
      duration,
      waveform,
      timestamp: Date.now(),
      transcription: transcription || undefined,
      filterApplied: filter,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMessage]);

    // Broadcast to online peers in the room
    if (peerServiceRef.current) {
      peerServiceRef.current.broadcastVoiceMessage(newMessage, blob);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const currentCount = m.reactions[emoji] || 0;
        return {
          ...m,
          reactions: { ...m.reactions, [emoji]: currentCount + 1 },
        };
      })
    );

    if (peerServiceRef.current) {
      peerServiceRef.current.broadcastReaction(messageId, emoji);
    }
  };

  const handleToggleCall = async () => {
    if (!isCallActive) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        setIsCallActive(true);
        playSound('join');
        confetti({ particleCount: 40, spread: 70, origin: { y: 0.1 } });

        if (peerServiceRef.current) {
          const peerIds = activeUsers.map((u) => u.id);
          peerServiceRef.current.startLiveAudio(stream, peerIds);
        }
      } catch (err) {
        console.error('Microphone error:', err);
        alert("Jonli efir uchun mikrofonga ruxsat bering!");
      }
    } else {
      setIsCallActive(false);
      playSound('leave');
      if (peerServiceRef.current) {
        peerServiceRef.current.stopLiveAudio();
      }
    }
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    playSound('reaction');
  };

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
    playSound('reaction');
  };

  return (
    <div className="flex h-screen bg-[#090b10] text-slate-100 overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        rooms={rooms}
        currentRoom={currentRoom}
        currentUser={currentUser}
        activeUsers={activeUsers}
        isOpen={isSidebarOpen}
        onSelectRoom={handleSelectRoom}
        onCreateRoom={handleCreateRoom}
        onUpdateUser={handleUpdateUser}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-radial from-slate-900/50 via-[#090b10] to-[#06070a]">
        {/* Top Navbar */}
        <Navbar
          currentRoom={currentRoom}
          onlineCount={activeUsers.length}
          isCallActive={isCallActive}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onToggleCall={handleToggleCall}
        />

        {/* Live Voice WebRTC Call Bar */}
        <LiveVoiceRoom
          roomName={currentRoom.name}
          activeUsers={activeUsers}
          isCallActive={isCallActive}
          isMuted={isMuted}
          isDeafened={isDeafened}
          onToggleCall={handleToggleCall}
          onToggleMute={handleToggleMute}
          onToggleDeafen={handleToggleDeafen}
        />

        {/* Voice Messages Feed */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Room Banner / Welcome Header */}
          <div className="max-w-md mx-auto my-6 text-center bg-white/[0.02] border border-white/5 rounded-2xl p-6 backdrop-blur-sm">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 mb-3 shadow-lg shadow-violet-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-xl">
                {currentRoom.icon || '🎙️'}
              </div>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">{currentRoom.name}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
              {currentRoom.description}
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                <Volume2 className="w-3 h-3 text-cyan-400" /> WebRTC Audio
              </span>
              <span className="flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                <Sparkles className="w-3 h-3 text-violet-400" /> Nutq-Matn AI
              </span>
            </div>
          </div>

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <MessageSquare className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-xs">Bu xonada hali ovozli xabarlar yo'q.</p>
              <p className="text-[11px] text-slate-600">Birinchi bo'lib ovoz yozib yuboring!</p>
            </div>
          ) : (
            messages.map((message) => (
              <VoiceMessageCard
                key={message.id}
                message={message}
                currentUser={currentUser}
                onReact={handleReact}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Bottom Floating Voice Recording Dock */}
        <footer className="shrink-0 bg-slate-950/70 border-t border-white/10 backdrop-blur-xl">
          <VoiceRecorderDock onSendVoice={handleSendVoice} />
        </footer>
      </div>
    </div>
  );
}

export default App;
