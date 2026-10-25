# hackathon-invisible-interfaces-melodic-dictation-tool

# Invisible Interfaces — Melodic Dictation

> An intelligent, voice-first melodic dictation tool. Sing a melody, and the AI agent analyzes it and dictates it back to you out loud!

Project built for the **"Invisible Interfaces"** Hackathon by Luma at UCSD.

---

## Value proposition & vision

For professional composers, the "inner ear", the ability to hear a melody in one's head and immediately transcribe it onto paper as notes, keys, and rhythms, requires years of rigorous ear training (solfege).

For modern music producers, beatmakers, and songwriters, translating an intuitive hummed idea into a DAW or sheet music creates a frustrating bottleneck:
* **The Solfège Barrier:** Without formal ear training, turning an "idea in your head" into exact musical notes (quarter note, dotted eighth, time signature) is nearly impossible.
* **Friction & Idea Loss:** By the time you open a DAW, create a MIDI track, plug in a keyboard, or hunt for the right key on a grid, the initial creative spark has often evaporated.

**Invisible Interfaces - Melodic Dictation** acts as an **instant musical translator and pocket notebook**:

* **Democratizing the Inner Ear:** Gives *anyone* the superpower of professional dictation, sing a melody, and the AI instantly decodes the exact notes, time signature, and rhythmic figures.
* **Zero-Friction Musical Scratchpad:** Capture spontaneous ideas on the fly, just like a writer jotting down a thought in a pocket notebook.
* **Voice-First Experience:** Focus 100% on pure musical intent without staring at screens, tweaking grids, or fighting complex software.

---

## How It Works (Architecture)

Text-to-Speech (TTS) ◄─ AI Agent (Gemini 2.5 Flash) ◄─ Cleaning & RMS Filter ➔ User Singing ➔ Microphone (AudioContext) ➔ YIN Algorithm (Pitchfinder)

1. **Audio Capture & Filtering:** The mic stream is captured via the Web Audio API. An RMS energy filter (`volume > 0.005`) and strict vocal frequency boundaries (`70 Hz - 1000 Hz`) filter out background noise and ambient hum.
2. **Frequency Extraction:** The **YIN** algorithm (via *Pitchfinder*) extracts pitch (Hz) and note durations in seconds, mapping frequencies directly to solfège notes (Do, Ré, Mi...).
3. **Melody Consolidation:** Consecutive pitch wobbles or micro-variations from natural singing are merged automatically (`cleanMelody`).
4. **Musicological Analysis by AI Agent:** **Google Gemini 2.5 Flash** receives the cleaned sequence, quantizes the rhythm, determines the most likely tempo (BPM) and time signature (e.g., 4/4), and harmonizes minor pitch inaccuracies.
5. **Voice-First Output:** The structured response is spoken back instantly via the Web Speech API, with a dedicated repeat button for re-listening.

---

## Tech Stack

* **Frontend / Local Server:** Vite (ES6 JavaScript)
* **Audio Signal Processing:** Web Audio API, `Pitchfinder` (YIN Algorithm)
* **AI Agent:** Google Gemini API (`gemini-2.5-flash`)
* **Voice Synthesis:** Web Speech API (`SpeechSynthesis`)
* **Mobile HTTPS Tunneling:** Ngrok (required for microphone permissions on mobile browsers)

---

## Setup & Installation Guide

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* A free Google Gemini API key (from [Google AI Studio](https://aistudio.google.com/))

### 1. Clone & Install Dependencies
```bash
git clone [https://github.com/ShahJahan-del/hackathon-invisible-interfaces-melodic-dictation-tool.git)
cd invisible-interfaces-melodic-dictation
npm install
```

### 2. Configure Environment Variables
Create a .env file at the root of your project and paste your Gemini API key:

VITE_GEMINI_API_KEY=AIzaSy...

### 3. Start Local Server (Desktop)
```bash
npx vite --host
```

Open http://localhost:5173 in your browser.

### 4. Smartphone Setup (HTTPS Required)
Mobile browsers strictly enforce HTTPS for microphone access.

Launch Ngrok in a separate terminal:
```bash
npx ngrok http 5173
```

Scan or open the resulting https://xxxx.ngrok-free.app link on your smartphone!

## How to Demo / Use
Click "Activer le Micro" (and grant microphone permissions when prompted).

Sing a clear melody (e.g., "Do... Mi... Sol..."), holding each note for at least 0.2 to 0.5 seconds.

Pause for 2.5 seconds when you finish your phrase.

The application automatically stops recording and dispatches the data to the AI Agent.

Listen to the Dictation: The voice agent announces the key, tempo, time signature, and reads out every quantized note.

Click "🔊 Répéter la dictée" to replay the audio output at any time!