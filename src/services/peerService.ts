import Peer, { type MediaConnection, type DataConnection } from 'peerjs';
import type { User, VoiceMessage } from '../types';

export interface PeerMessagePayload {
  type: 'voice-message' | 'user-join' | 'user-state' | 'reaction' | 'ping';
  voiceMessage?: {
    id: string;
    senderId: string;
    senderName: string;
    senderColor: string;
    roomId: string;
    audioData: ArrayBuffer;
    mimeType: string;
    duration: number;
    waveform: number[];
    timestamp: number;
    transcription?: string;
    filterApplied?: 'normal' | 'robot' | 'deep' | 'chipmunk';
    reactions: Record<string, number>;
  };
  reactionData?: {
    messageId: string;
    emoji: string;
  };
  userData?: User;
}

export class PeerRoomService {
  private peer: Peer | null = null;
  private myUser: User;
  private currentRoomId = '';
  private localStream: MediaStream | null = null;
  private activeCalls = new Map<string, MediaConnection>();
  private activeDataConnections = new Map<string, DataConnection>();
  private broadcastChannel: BroadcastChannel | null = null;
  private audioElements = new Map<string, HTMLAudioElement>();

  public onNewVoiceMessage?: (msg: VoiceMessage) => void;
  public onReactionUpdate?: (messageId: string, emoji: string) => void;
  public onPeersChange?: (peers: User[]) => void;
  public onSpeakingChange?: (userId: string, isSpeaking: boolean) => void;

  constructor(user: User) {
    this.myUser = user;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('voxwave_sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handlePayload(event.data);
      };
    }
  }

  public initPeer(): Promise<string> {
    return new Promise((resolve) => {
      // Peer ID includes user ID
      const peerId = `vox_${this.myUser.id}`;
      this.peer = new Peer(peerId, {
        debug: 1,
      });

      this.peer.on('open', (id) => {
        console.log('PeerJS connected with ID:', id);
        resolve(id);
      });

      this.peer.on('error', (err) => {
        console.warn('PeerJS error (continuing in local sync mode):', err);
        // Fallback gracefully
        resolve(this.myUser.id);
      });

      // Handle incoming data connections (for live messages)
      this.peer.on('connection', (conn) => {
        this.setupDataConnection(conn);
      });

      // Handle incoming live voice calls
      this.peer.on('call', (call) => {
        if (this.localStream) {
          call.answer(this.localStream);
        } else {
          // Answer without sending local audio if not live
          call.answer();
        }
        this.setupMediaCall(call);
      });
    });
  }

  public joinRoom(roomId: string, localAudioStream?: MediaStream | null) {
    this.currentRoomId = roomId;
    this.localStream = localAudioStream || null;

    // Broadcast user join to channel
    this.broadcastPayload({
      type: 'user-join',
      userData: { ...this.myUser, isOnline: true },
    });
  }

  public async startLiveAudio(stream: MediaStream, knownPeerIds: string[]) {
    this.localStream = stream;

    // Call all known peers in the room
    for (const peerId of knownPeerIds) {
      if (peerId !== this.myUser.id && this.peer && !this.peer.destroyed) {
        const targetId = peerId.startsWith('vox_') ? peerId : `vox_${peerId}`;
        try {
          const call = this.peer.call(targetId, stream);
          if (call) {
            this.setupMediaCall(call);
          }
        } catch (e) {
          console.warn('Could not call peer:', targetId, e);
        }
      }
    }
  }

  public stopLiveAudio() {
    for (const [, call] of this.activeCalls) {
      call.close();
    }
    this.activeCalls.clear();

    for (const [, audio] of this.audioElements) {
      audio.pause();
      audio.remove();
    }
    this.audioElements.clear();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
  }

  private setupMediaCall(call: MediaConnection) {
    this.activeCalls.set(call.peer, call);

    call.on('stream', (remoteStream) => {
      // Play remote audio
      let audio = this.audioElements.get(call.peer);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audioElements.set(call.peer, audio);
      }
      audio.srcObject = remoteStream;
      audio.play().catch(() => {});

      // Setup audio speaking analyzer
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(remoteStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkSpeaking = () => {
          if (!this.activeCalls.has(call.peer)) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const isSpeaking = average > 18;
          const rawId = call.peer.replace('vox_', '');
          if (this.onSpeakingChange) {
            this.onSpeakingChange(rawId, isSpeaking);
          }
          requestAnimationFrame(checkSpeaking);
        };
        requestAnimationFrame(checkSpeaking);
      } catch (err) {
        console.warn('Audio analysis setup error:', err);
      }
    });

    call.on('close', () => {
      this.activeCalls.delete(call.peer);
      const audio = this.audioElements.get(call.peer);
      if (audio) {
        audio.pause();
        audio.remove();
        this.audioElements.delete(call.peer);
      }
    });
  }

  public async broadcastVoiceMessage(msg: VoiceMessage, blob: Blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const payload: PeerMessagePayload = {
      type: 'voice-message',
      voiceMessage: {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderColor: msg.senderColor,
        roomId: msg.roomId,
        audioData: arrayBuffer,
        mimeType: blob.type || 'audio/webm',
        duration: msg.duration,
        waveform: msg.waveform,
        timestamp: msg.timestamp,
        transcription: msg.transcription,
        filterApplied: msg.filterApplied,
        reactions: msg.reactions,
      },
    };

    this.broadcastPayload(payload);
  }

  public broadcastReaction(messageId: string, emoji: string) {
    this.broadcastPayload({
      type: 'reaction',
      reactionData: { messageId, emoji },
    });
  }

  private broadcastPayload(payload: PeerMessagePayload) {
    // 1. BroadcastChannel for instant local / cross-tab sync
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(payload);
      } catch (err) {
        console.warn('BroadcastChannel error:', err);
      }
    }

    // 2. PeerJS data connections for remote online peers
    for (const [, conn] of this.activeDataConnections) {
      if (conn.open) {
        try {
          conn.send(payload);
        } catch {
          // Ignore failed send
        }
      }
    }
  }

  private setupDataConnection(conn: DataConnection) {
    this.activeDataConnections.set(conn.peer, conn);

    conn.on('data', (data) => {
      this.handlePayload(data as PeerMessagePayload);
    });

    conn.on('close', () => {
      this.activeDataConnections.delete(conn.peer);
    });
  }

  private handlePayload(payload: PeerMessagePayload) {
    if (!payload) return;

    if (payload.type === 'voice-message' && payload.voiceMessage) {
      const vm = payload.voiceMessage;
      if (vm.roomId !== this.currentRoomId) return;

      // Convert ArrayBuffer back to Object URL Blob
      const blob = new Blob([vm.audioData], { type: vm.mimeType });
      const audioUrl = URL.createObjectURL(blob);

      const message: VoiceMessage = {
        id: vm.id,
        senderId: vm.senderId,
        senderName: vm.senderName,
        senderColor: vm.senderColor,
        roomId: vm.roomId,
        audioUrl,
        duration: vm.duration,
        waveform: vm.waveform,
        timestamp: vm.timestamp,
        transcription: vm.transcription,
        filterApplied: vm.filterApplied,
        reactions: vm.reactions || {},
      };

      if (this.onNewVoiceMessage) {
        this.onNewVoiceMessage(message);
      }
    } else if (payload.type === 'reaction' && payload.reactionData) {
      if (this.onReactionUpdate) {
        this.onReactionUpdate(payload.reactionData.messageId, payload.reactionData.emoji);
      }
    }
  }

  public destroy() {
    this.stopLiveAudio();
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
