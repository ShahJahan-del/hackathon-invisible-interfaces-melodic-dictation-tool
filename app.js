import { YIN } from 'pitchfinder';
import { analyzeMelody } from './agent.js';

const recordBtn = document.getElementById('recordBtn');
const statusText = document.getElementById('status');
const repeatBtn = document.getElementById('repeatBtn');

let lastSpeechText = ""; // Stocke le dernier texte parlé
let audioContext = null;
let analyser = null;
let isRecording = false;
let detector = null;

let rawMelody = [];
let currentNote = null;
let noteStartTime = 0;
let silenceStartTime = null;

// Convertit les Hz en notes françaises
function hzToNote(frequency) {
  const notes = ["Do", "Do#", "Ré", "Ré#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
  const midiNumber = Math.round(12 * (Math.log2(frequency / 440)) + 69);
  const noteIndex = (midiNumber - 12) % 12;
  const octave = Math.floor(midiNumber / 12) - 1;
  return `${notes[noteIndex]}${octave}`;
}

// Calcule l'énergie (volume sonore) pour ignorer les silences
function getVolume(buffer) {
  let sum = 0;
  for (let i = 0; i < buffer.length; i++) {
    sum += buffer[i] * buffer[i];
  }
  return Math.sqrt(sum / buffer.length);
}

async function startAudio() {
  // 1. Déverrouillage audio obligatoire sur Téléphone (iOS/Android)
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    detector = YIN({ sampleRate: audioContext.sampleRate });
    processAudio();
  } catch (err) {
    console.error("Erreur d'accès au micro :", err);
    statusText.textContent = "Erreur : Impossible d'accéder au micro.";
    isRecording = false;
    recordBtn.classList.remove('recording');
    recordBtn.textContent = 'Activer le Micro';
  }
}

function processAudio() {
  if (!isRecording) return;

  const buffer = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buffer);

  const volume = getVolume(buffer); // Volume RMS
  const pitch = detector(buffer);
  const now = performance.now();

  // FILTRE STRICT : Volume suffisant + Fréquence exclusivement vocale (80 Hz à 800 Hz)
  const isHumanVoice = volume > 0.005 && pitch && pitch >= 80 && pitch <= 800;

  if (isHumanVoice) {
    const note = hzToNote(pitch);
    silenceStartTime = null;

    if (currentNote !== note) {
      if (currentNote !== null) {
        const duration = (now - noteStartTime) / 1000;
        // Filtre : La note doit durer au moins 0.25 seconde pour être comptée
        if (duration >= 0.15) {
          rawMelody.push({ note: currentNote, duration: parseFloat(duration.toFixed(2)) });
        }
      }
      currentNote = note;
      noteStartTime = now;
      statusText.textContent = `Chant détecté : ${note}`;
    }
  } else {
    // Si volume trop faible ou fréquence parasite (>800Hz / 19000Hz)
    if (currentNote !== null) {
      const duration = (now - noteStartTime) / 1000;
      if (duration >= 0.15) {
        rawMelody.push({ note: currentNote, duration: parseFloat(duration.toFixed(2)) });
      }
      currentNote = null;
    }

    if (!silenceStartTime) silenceStartTime = now;

    // Arrêt automatique après 2.5s de silence post-chant
    if (now - silenceStartTime > 2500 && rawMelody.length > 0) {
      stopAndAnalyze();
      return;
    }
  }

  requestAnimationFrame(processAudio);
}

async function stopAndAnalyze() {
  isRecording = false;
  recordBtn.classList.remove('recording');
  recordBtn.textContent = 'Activer le Micro';

  if (rawMelody.length === 0) {
    statusText.textContent = "Aucune mélodie captée. Chante plus fort !";
    speak("Je n'ai entendu aucune note claire. Essaie de chanter un peu plus fort.");
    return;
  }

  statusText.textContent = "L'Agent IA effectue la dictée...";

  const result = await analyzeMelody(rawMelody);
  statusText.textContent = "Dictée terminée !";

  // Sauvegarde du texte et affichage du bouton de répétition
  lastSpeechText = result.speechText; // <--- AJOUTÉ
  repeatBtn.style.display = 'block';   // <--- AJOUTÉ

  speak(lastSpeechText);
  rawMelody = [];
}

function speak(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stoppe la parole précédente
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }
}

recordBtn.addEventListener('click', () => {
  if (!isRecording) {
    isRecording = true;
    rawMelody = [];
    currentNote = null;
    silenceStartTime = null;
    recordBtn.classList.add('recording');
    recordBtn.textContent = 'Enregistrement en cours...';
    statusText.textContent = 'Chante ta mélodie...';
    startAudio();
  } else {
    stopAndAnalyze();
  }
});

// Événement clic pour répéter la voix
repeatBtn.addEventListener('click', () => {
  if (lastSpeechText) {
    speak(lastSpeechText);
  }
});