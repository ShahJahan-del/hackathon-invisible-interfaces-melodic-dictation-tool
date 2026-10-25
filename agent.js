// Utilise la clé API Gemini définie dans ton environnement ou collée ici
const apiKey = import.meta.env.VITE_GEMINI_API_KEY

export async function analyzeMelody(rawNotes) {
  // Détection si la clé est absente
  if (!apiKey) {
    console.error("ERREUR : La variable VITE_GEMINI_API_KEY n'est pas définie dans .env");
    return {
      speechText: "Erreur : La clé API est manquante. Redémarre le serveur Vite.",
      notes: []
    };
  }

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

// Utilisation du modèle gemini-2.5-flash via la route REST standard
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorJson = await response.json();
      console.error("Détails erreur Google API :", errorJson);
      throw new Error(`API Google renvoie l'erreur ${response.status}`);
    }

    const data = await response.json();
    let jsonText = data.candidates[0].content.parts[0].text;

    // Nettoyage au cas où l'IA entoure le JSON de balises ```json
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Erreur Agent IA Gemini:", error);
    return {
      speechText: "Désolé, la connexion avec l'agent de dictée a échoué. Vérifie la clé API.",
      notes: []
    };
  }
}