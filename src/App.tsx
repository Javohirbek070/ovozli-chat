import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import type { User, VoiceMessage, Room } from './types';
import { Navbar } from './components/Navbar';
import { LiveVoiceRoom } from './components/LiveVoiceRoom';
import { VoiceMessageCard } from './components/VoiceMessageCard';
import { VoiceRecorderDock } from './components/VoiceRecorderDock';
import { ParticipantsModal } from './components/ParticipantsModal';
import { ProfileModal } from './components/ProfileModal';
import { GlobalRealtimeService } from './services/realtimeService';
import { playSound } from './utils/audioEffects';

const UMUMIY_ROOM: Room = {
  id: 'umumiy',
  name: 'Umumiy Suhbat',
  description: "Barcha foydalanuvchilar va qurilmalar uchun global ochiq ovozli muloqot xonasi",
  icon: '🎙️',
};

// Procedural harmonic welcome chime
function createWelcomeAudioBlob(): Promise<{ blob: Blob; url: string }> {
  return new Promise((resolve) => {
    try {
      const sampleRate = 44100;
      const durationSec = 3.5;
      const offlineCtx = new OfflineAudioContext(1, sampleRate * durationSec, sampleRate);

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
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      resolve({ blob: emptyBlob, url: '' });
    }
  });
}

export function App() {
  // Current user state (persisted)
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

  // Only Umumiy Suhbat room
  const currentRoom = UMUMIY_ROOM;

  // Messages in Umumiy Suhbat
  const [messages, setMessages] = useState<VoiceMessage[]>(() => {
    const saved = localStorage.getItem('voxwave_messages_umumiy');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  const [activeUsers, setActiveUsers] = useState<User[]>([currentUser]);

  // Modals state
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Live WebRTC Call State
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const realtimeRef = useRef<GlobalRealtimeService | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initial welcome message if none exist
  useEffect(() => {
    if (messages.length === 0) {
      createWelcomeAudioBlob().then(({ url }) => {
        if (url) {
          const welcomeMessage: VoiceMessage = {
            id: 'welcome-msg',
            senderId: 'system-bot',
            senderName: 'VoxWave Bot 🤖',
            senderColor: '#06b6d4',
            roomId: 'umumiy',
            audioUrl: url,
            duration: 3,
            waveform: [0.3, 0.45, 0.7, 0.85, 0.95, 0.75, 0.88, 0.65, 0.92, 0.72, 0.55, 0.35, 0.65, 0.85, 0.45, 0.25],
            timestamp: Date.now() - 60000,
            transcription: "Assalomu alaykum! VoxWave Umumiy Suhbatiga xush kelibsiz! Barcha qurilmalardan ulanganlar bir-birlarini onlayn ko'rishlari va ovozli gaplashishlari mumkin.",
            filterApplied: 'normal',
            reactions: { '❤️': 5, '🔥': 4, '👏': 3 },
          };
          setMessages([welcomeMessage]);
        }
      });
    }
  }, [messages.length]);

  // Initialize Global Realtime Service (MQTT + WebRTC)
  useEffect(() => {
    const service = new GlobalRealtimeService(currentUser);
    realtimeRef.current = service;

    // Incoming voice message from ANY device in the world
    service.onNewVoiceMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        const updated = [...prev, msg];
        return updated;
      });
      playSound('receive');
    };

    // Live presence update (All devices connected)
    service.onUsersChange = (users) => {
      setActiveUsers(users);
    };

    // Live reaction update
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

    // Live speaking indicator
    service.onSpeakingChange = (userId, isSpeaking) => {
      setActiveUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isSpeaking } : u))
      );
    };

    service.init();

    return () => {
      service.destroy();
    };
  }, [currentUser]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleUpdateUser = (name: string, color: string) => {
    const updated = { ...currentUser, name, avatarColor: color };
    setCurrentUser(updated);
    localStorage.setItem('voxwave_user', JSON.stringify(updated));
    if (realtimeRef.current) {
      realtimeRef.current.updateUser(updated);
    }
    confetti({ particleCount: 35, spread: 60, origin: { y: 0.8 } });
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
      roomId: 'umumiy',
      audioUrl,
      duration,
      waveform,
      timestamp: Date.now(),
      transcription: transcription || undefined,
      filterApplied: filter,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMessage]);

    // Broadcast across all devices via Global MQTT
    if (realtimeRef.current) {
      realtimeRef.current.sendVoiceMessage(newMessage, blob);
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

    if (realtimeRef.current) {
      realtimeRef.current.sendReaction(messageId, emoji);
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
        confetti({ particleCount: 45, spread: 70, origin: { y: 0.1 } });

        if (realtimeRef.current) {
          realtimeRef.current.startLiveCall(stream);
        }
      } catch (err) {
        console.error('Microphone error:', err);
        alert("Jonli efir uchun mikrofonga ruxsat bering!");
      }
    } else {
      setIsCallActive(false);
      playSound('leave');
      if (realtimeRef.current) {
        realtimeRef.current.stopLiveCall();
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
    <div className="relative flex flex-col h-screen w-full bg-[#07090e] text-slate-100 overflow-hidden font-sans select-none">
      {/* 🌟 Liquid Glass Ambient Fluid Blobs (Background) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-full bg-gradient-to-tr from-violet-600/30 to-purple-500/20 blur-[100px] animate-liquid-blob-1" />
        <div className="absolute top-1/3 -right-28 w-96 h-96 sm:w-[520px] sm:h-[520px] rounded-full bg-gradient-to-bl from-cyan-500/25 via-blue-600/20 to-teal-400/20 blur-[110px] animate-liquid-blob-2" />
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-pink-600/20 via-indigo-600/20 to-violet-500/15 blur-[100px] animate-liquid-blob-3" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col h-full w-full max-w-4xl mx-auto overflow-hidden">
        {/* Top Liquid Glass Navbar */}
        <Navbar
          currentUser={currentUser}
          onlineCount={activeUsers.length}
          isCallActive={isCallActive}
          onToggleCall={handleToggleCall}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenParticipants={() => setIsParticipantsOpen(true)}
        />

        {/* Live Audio Room Banner */}
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

        {/* Voice Messages Conversation Feed */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-3">
          {/* Liquid Glass Room Banner */}
          <div className="max-w-md mx-auto my-5 text-center liquid-glass rounded-3xl p-6 shadow-2xl backdrop-blur-3xl border border-white/15 animate-in fade-in duration-300">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-gradient-to-tr from-violet-500 via-indigo-500 to-cyan-400 p-[1.5px] mb-3 shadow-xl shadow-violet-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-[#0a0d18]/90 backdrop-blur-md rounded-[22px] flex items-center justify-center text-2xl">
                🎙️
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">Umumiy Suhbat</h2>
            <p className="text-xs text-slate-300/80 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Barcha foydalanuvchilar va qurilmalar uchun global ochiq ovozli muloqot xonasi. Har qanday qurilmadan kirganlar bir-birini ko'radi!
            </p>
            <div className="mt-4 flex items-center justify-center gap-2.5 text-[11px] text-slate-300 flex-wrap">
              <span className="flex items-center gap-1.5 liquid-glass-pill px-3 py-1 rounded-full">
                <Volume2 className="w-3.5 h-3.5 text-cyan-300" /> Realtime Global
              </span>
              <span className="flex items-center gap-1.5 liquid-glass-pill px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5 text-violet-300" /> Nutq-Matn AI
              </span>
              <span className="flex items-center gap-1.5 liquid-glass-pill px-3 py-1 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Liquid Glass
              </span>
            </div>
          </div>

          {/* Messages list */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <MessageSquare className="w-12 h-12 opacity-30 mb-2" />
              <p className="text-sm font-medium">Hozircha ovozli xabarlar yo'q.</p>
              <p className="text-xs text-slate-500 mt-1">Pastdagi mikrofonni bosib birinchi bo'lib ovoz yozing!</p>
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

        {/* Bottom Liquid Glass Floating Recording Dock */}
        <footer className="shrink-0 pb-3 pt-1">
          <VoiceRecorderDock onSendVoice={handleSendVoice} />
        </footer>
      </div>

      {/* Modals */}
      <ParticipantsModal
        isOpen={isParticipantsOpen}
        onClose={() => setIsParticipantsOpen(false)}
        activeUsers={activeUsers}
        currentUserId={currentUser.id}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onSave={handleUpdateUser}
      />
    </div>
  );
}

export default App;
