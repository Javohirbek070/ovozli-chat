# 🎙️ VoxWave — Real-Time Voice Messaging & WebRTC Audio Rooms

> Tezkor, to'liq onlayn ovozli habarlar almashish, nutqni matnga aylantirish (Speech-to-Text) va jonli WebRTC audio muloqot xonalari platformasi.

![VoxWave UI](https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=1200&auto=format&fit=crop)

---

## ✨ Asosiy Imkoniyatlar (Features)

1. **🎙️ Ovozli Habarlar (Voice Messages)**
   - Telegram va WhatsApp uslubidagi interaktiv audio to'lqinlar (Waveform).
   - Istalgan sekundga o'tish (Scrubbable playback).
   - 1.0x, 1.5x, 2.0x tezlik boshqaruvi.
   - Ovozli xabarni yuklab olish (.wav).

2. **🤖 Nutqni Matnga Aylantirish (Speech-to-Text)**
   - Ovoz yozish vaqtida avtomatik nutqni matnga aylantirish (`uz-UZ`, `ru-RU`, `en-US`).
   - Ovozli xabar ostida avtomatik transkript ko'rsatilishi.

3. **🔮 Ovoz Effektlari (Voice Filters)**
   - **Tabiiy ovoz** (Kristal toza Web Audio API).
   - **Robot effekt** (Ring modulator va bandpass sintezi).
   - **Chuqur Bass** (Past chastota kuchaytirgich).
   - **Chipmunk** (Tezkor va yuqori ton).

4. **📻 Jonli Ovozli Qo'ng'iroq (WebRTC Live Audio Walkie-Talkie)**
   - PeerJS WebRTC orqali to'g'ridan-to'g'ri (P2P) jonli suhbat xonalari.
   - Gapirayotganda avatarda pulsatsiyalanuvchi yorug'lik halqasi (Speaking glow indicator).
   - Mikrofonni o'chirish (Mute) va karnayni o'chirish (Deafen).

5. **💬 Kanallar va Maxsus Xonalar (Rooms & Channels)**
   - `#Umumiy-Suhbat`, `#IT-Dasturlash`, `#Ingliz-Tili`, `#Musiqa-Kayfiyat`.
   - Yangi maxsus xona ochish va 1-bosishda do'stlarga havola yuborish (`?room=xona_id`).

6. **🎵 Web Audio Protsessor (Nol Tashqi Fayllar)**
   - Barcha UI tovushlari (boshlash, to'xtatish, yuborish, reaksiya) brauzerning Web Audio API orqali sintez qilinadi.

---

## 🛠️ Texnologiyalar (Tech Stack)

- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v4, Cyber Dark Glassmorphism
- **Audio & RTC:** Web Audio API, MediaRecorder API, Web Speech API, PeerJS (WebRTC)
- **Icons & Effects:** Lucide React, Canvas Confetti

---

## 🚀 Mahalliylashtirish va Ishga Tushirish (Local Setup)

```bash
# 1. Repozitoriyani klonlash
git clone https://github.com/Javohirbek070/ovozli-chat.git
cd ovozli-chat

# 2. Bog'liqliklarni o'rnatish
npm install

# 3. Loyihani ishlab chiqish rejimida ishga tushirish
npm run dev
```

---

## 🌐 Onlayn Foydalanish (Deployment)

Loyiha to'liq **Vercel** bulutida deploy qilingan va onlayn ishlamoqda.
Havola orqali istalgan brauzerdan (kompyuter yoki mobil telefon) kirishingiz mumkin.
