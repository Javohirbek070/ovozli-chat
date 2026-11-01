export interface User {
  id: string;
  name: string;
  avatarColor: string;
  avatarIcon: string;
  isOnline?: boolean;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

export interface VoiceMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  roomId: string;
  audioUrl: string;
  duration: number; // in seconds
  waveform: number[]; // amplitude peaks for visualization (0 to 1)
  timestamp: number;
  transcription?: string;
  filterApplied?: 'normal' | 'robot' | 'deep' | 'chipmunk';
  reactions: Record<string, number>; // emoji -> count
}

export interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  isPrivate?: boolean;
  activeCallCount?: number;
}
