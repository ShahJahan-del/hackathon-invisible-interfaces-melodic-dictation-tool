import { GoogleGenAI } from '@google/genai';

// Utilise la clé API Gemini définie dans ton environnement ou collée ici
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function analyzeMelody(rawNotes) {
  const prompt = `Tu es un agent expert en dictée musicale et musicologie.
Analyse ce tableau de notes brutes chantées et leurs durées exactes en secondes :
${JSON.stringify(rawNotes)}

Tâches :
1. Détermine le tempo le plus probable (BPM) et la signature rythmique (ex: 4/4).
2. Convertis les durées relatives en figures rythmiques officielles (Croche, Noire, Blanche, Double-croche...).
3. Rédige une réponse synthétique à voix haute destinée à être lue par un synthétiseur vocal (max 2 phrases).

Réponds STRICTEMENT sous forme d'un objet JSON valide avec la structure exacte suivante :
{
  "bpm": 120,
  "timeSignature": "4/4",
  "speechText": "Mélodie détectée en 4/4 à 120 BPM. Croche La 4, Noire Do 5, Blanche Sol 4.",
  "notes": [
    {"note": "La4", "figure": "Croche"},
    {"note": "Do5", "figure": "Noire"}
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json', // Force le retour au format JSON propre
      },
    });

    const responseText = response.text;
    console.log("Réponse brute Gemini :", responseText);

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Erreur Agent IA Gemini:", error);
    return {
      speechText: "Erreur lors de l'analyse par l'agent IA.",
      notes: []
    };
  }
}