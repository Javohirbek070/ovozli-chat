import mqtt, { type MqttClient } from 'mqtt';
import Peer, { type MediaConnection } from 'peerjs';
import type { User, VoiceMessage } from '../types';

export interface PresencePayload {
  user: User;
  timestamp: number;
}

export interface VoiceMessagePayload {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  roomId: string;
  audioBase64: string;
  mimeType: string;
  duration: number;
  waveform: number[];
  timestamp: number;
  transcription?: string;
  filterApplied?: 'normal' | 'robot' | 'deep' | 'chipmunk';
  reactions: Record<string, number>;
}

export interface ReactionPayload {
  messageId: string;
  emoji: string;
}

export interface CallSignalPayload {
  fromUserId: string;
  targetUserId?: string;
  type: 'call-join' | 'call-leave' | 'speaking';
  isSpeaking?: boolean;
}

export class GlobalRealtimeService {
  private mqttClient: MqttClient | null = null;
  private peer: Peer | null = null;
  private myUser: User;
  private activePeers = new Map<string, { user: User; lastSeen: number }>();
  private activeCalls = new Map<string, MediaConnection>();
  private audioElements = new Map<string, HTMLAudioElement>();
  private localStream: MediaStream | null = null;
  private heartbeatInterval: number | null = null;
  private cleanupInterval: number | null = null;

  public onNewVoiceMessage?: (msg: VoiceMessage) => void;
  public onReactionUpdate?: (messageId: string, emoji: string) => void;
  public onUsersChange?: (users: User[]) => void;
  public onSpeakingChange?: (userId: string, isSpeaking: boolean) => void;

  constructor(user: User) {
    this.myUser = user;
  }

  public async init(): Promise<void> {
    this.initMqtt();
    this.initPeer();
  }

  // 1. MQTT Global Realtime Messaging & Presence
  private initMqtt() {
    try {
      const clientId = `vox_${this.myUser.id}_${Math.random().toString(16).substring(2, 8)}`;
      // Connect to global public WebSocket broker
      this.mqttClient = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 3000,
      });

      this.mqttClient.on('connect', () => {
        console.log('[Realtime] MQTT brokerga muvaffaqiyatli ulandi');
        
        // Subscribe to global channels for Umumiy Suhbat
        const topics = [
          'voxwave/v1/umumiy/messages',
          'voxwave/v1/umumiy/presence',
          'voxwave/v1/umumiy/reactions',
          'voxwave/v1/umumiy/call',
        ];
        this.mqttClient?.subscribe(topics);

        // Send initial presence and start periodic heartbeat
        this.sendPresence();
        this.startHeartbeat();
      });

      this.mqttClient.on('message', (topic, payload) => {
        try {
          const str = payload.toString();
          const data = JSON.parse(str);

          if (topic === 'voxwave/v1/umumiy/messages') {
            this.handleIncomingMessage(data as VoiceMessagePayload);
          } else if (topic === 'voxwave/v1/umumiy/presence') {
            this.handleIncomingPresence(data as PresencePayload);
          } else if (topic === 'voxwave/v1/umumiy/reactions') {
            this.handleIncomingReaction(data as ReactionPayload);
          } else if (topic === 'voxwave/v1/umumiy/call') {
            this.handleIncomingCallSignal(data as CallSignalPayload);
          }
        } catch (e) {
          console.warn('[Realtime] MQTT message parsing error:', e);
        }
      });

      this.mqttClient.on('error', (err) => {
        console.warn('[Realtime] MQTT connection notice:', err);
      });
    } catch (e) {
      console.error('[Realtime] Failed to initialize MQTT:', e);
    }
  }

  // 2. PeerJS WebRTC for Live P2P Audio Calling
  private initPeer() {
    try {
      const peerId = `vox_${this.myUser.id}`;
      this.peer = new Peer(peerId, { debug: 1 });

      this.peer.on('open', (id) => {
        console.log('[Realtime] PeerJS audio node tayyor:', id);
      });

      this.peer.on('call', (call) => {
        if (this.localStream) {
          call.answer(this.localStream);
        } else {
          call.answer();
        }
        this.setupMediaCall(call);
      });

      this.peer.on('error', (err) => {
        console.warn('[Realtime] PeerJS event:', err);
      });
    } catch (e) {
      console.warn('[Realtime] Peer init exception:', e);
    }
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);

    // Broadcast presence every 4 seconds
    this.heartbeatInterval = window.setInterval(() => {
      this.sendPresence();
    }, 4000);

    // Prune users who haven't sent a heartbeat in 10 seconds
    this.cleanupInterval = window.setInterval(() => {
      const now = Date.now();
      let changed = false;

      for (const [id, info] of this.activePeers) {
        if (id !== this.myUser.id && now - info.lastSeen > 10000) {
          this.activePeers.delete(id);
          changed = true;
        }
      }

      if (changed) {
        this.notifyUsersChange();
      }
    }, 3000);
  }

  public sendPresence() {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const payload: PresencePayload = {
      user: this.myUser,
      timestamp: Date.now(),
    };

    this.mqttClient.publish('voxwave/v1/umumiy/presence', JSON.stringify(payload));
  }

  public updateUser(user: User) {
    this.myUser = user;
    this.sendPresence();
  }

  private handleIncomingPresence(payload: PresencePayload) {
    if (!payload || !payload.user || !payload.user.id) return;

    const existing = this.activePeers.get(payload.user.id);
    this.activePeers.set(payload.user.id, {
      user: { ...payload.user, isOnline: true },
      lastSeen: Date.now(),
    });

    if (!existing || existing.user.name !== payload.user.name || existing.user.avatarColor !== payload.user.avatarColor) {
      this.notifyUsersChange();
    }
  }

  private notifyUsersChange() {
    const users: User[] = [this.myUser];
    for (const [id, info] of this.activePeers) {
      if (id !== this.myUser.id) {
        users.push(info.user);
      }
    }
    if (this.onUsersChange) {
      this.onUsersChange(users);
    }
  }

  // 3. Voice Messages Broadcast across all devices
  public async sendVoiceMessage(msg: VoiceMessage, blob: Blob) {
    if (!this.mqttClient || !this.mqttClient.connected) {
      console.warn('[Realtime] MQTT ulanmagan, xabar faqat mahaliy saqlandi');
      return;
    }

    try {
      const base64Audio = await this.blobToBase64(blob);
      const payload: VoiceMessagePayload = {
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderColor: msg.senderColor,
        roomId: msg.roomId,
        audioBase64: base64Audio,
        mimeType: blob.type || 'audio/webm',
        duration: msg.duration,
        waveform: msg.waveform,
        timestamp: msg.timestamp,
        transcription: msg.transcription,
        filterApplied: msg.filterApplied,
        reactions: msg.reactions || {},
      };

      this.mqttClient.publish('voxwave/v1/umumiy/messages', JSON.stringify(payload));
    } catch (err) {
      console.error('[Realtime] Ovozli xabarni yuborishda xatolik:', err);
    }
  }

  private handleIncomingMessage(payload: VoiceMessagePayload) {
    if (!payload || !payload.id) return;
    if (payload.senderId === this.myUser.id) return; // Don't duplicate own message

    try {
      const blob = this.base64ToBlob(payload.audioBase64, payload.mimeType);
      const audioUrl = URL.createObjectURL(blob);

      const msg: VoiceMessage = {
        id: payload.id,
        senderId: payload.senderId,
        senderName: payload.senderName,
        senderColor: payload.senderColor,
        roomId: payload.roomId || 'umumiy',
        audioUrl,
        duration: payload.duration,
        waveform: payload.waveform,
        timestamp: payload.timestamp,
        transcription: payload.transcription,
        filterApplied: payload.filterApplied,
        reactions: payload.reactions || {},
      };

      if (this.onNewVoiceMessage) {
        this.onNewVoiceMessage(msg);
      }
    } catch (e) {
      console.error('[Realtime] Kiruvchi ovozni oqishda xatolik:', e);
    }
  }

  // 4. Reactions
  public sendReaction(messageId: string, emoji: string) {
    if (!this.mqttClient || !this.mqttClient.connected) return;

    const payload: ReactionPayload = { messageId, emoji };
    this.mqttClient.publish('voxwave/v1/umumiy/reactions', JSON.stringify(payload));
  }

  private handleIncomingReaction(payload: ReactionPayload) {
    if (!payload || !payload.messageId || !payload.emoji) return;
    if (this.onReactionUpdate) {
      this.onReactionUpdate(payload.messageId, payload.emoji);
    }
  }

  // 5. Live Audio Call (P2P Mesh WebRTC)
  public async startLiveCall(stream: MediaStream) {
    this.localStream = stream;

    // Publish call join event to room
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(
        'voxwave/v1/umumiy/call',
        JSON.stringify({ fromUserId: this.myUser.id, type: 'call-join' })
      );
    }

    // Call all active online peers
    for (const [userId] of this.activePeers) {
      if (userId !== this.myUser.id && this.peer && !this.peer.destroyed) {
        try {
          const targetPeerId = `vox_${userId}`;
          const call = this.peer.call(targetPeerId, stream);
          if (call) {
            this.setupMediaCall(call);
          }
        } catch (e) {
          console.warn('[Realtime] Peer call notice:', e);
        }
      }
    }
  }

  public stopLiveCall() {
    if (this.mqttClient && this.mqttClient.connected) {
      this.mqttClient.publish(
        'voxwave/v1/umumiy/call',
        JSON.stringify({ fromUserId: this.myUser.id, type: 'call-leave' })
      );
    }

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
      let audio = this.audioElements.get(call.peer);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        this.audioElements.set(call.peer, audio);
      }
      audio.srcObject = remoteStream;
      audio.play().catch(() => {});

      // Audio analysis for speaking glow
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioContextClass();
        const source = ctx.createMediaStreamSource(remoteStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (!this.activeCalls.has(call.peer)) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          const isSpeaking = avg > 18;
          const rawId = call.peer.replace('vox_', '');
          if (this.onSpeakingChange) {
            this.onSpeakingChange(rawId, isSpeaking);
          }
          requestAnimationFrame(checkVolume);
        };
        requestAnimationFrame(checkVolume);
      } catch (e) {
        console.warn('Speaking volume check error:', e);
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

  private handleIncomingCallSignal(payload: CallSignalPayload) {
    if (!payload || !payload.fromUserId || payload.fromUserId === this.myUser.id) return;

    if (payload.type === 'call-join' && this.localStream && this.peer && !this.peer.destroyed) {
      // Another user joined call, call them
      const targetPeerId = `vox_${payload.fromUserId}`;
      if (!this.activeCalls.has(targetPeerId)) {
        try {
          const call = this.peer.call(targetPeerId, this.localStream);
          if (call) {
            this.setupMediaCall(call);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  // Helper utilities
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64Data: string, mimeType: string): Blob {
    const parts = base64Data.split(';base64,');
    const raw = window.atob(parts[1] || parts[0]);
    const uInt8Array = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: mimeType });
  }

  public destroy() {
    this.stopLiveCall();
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
