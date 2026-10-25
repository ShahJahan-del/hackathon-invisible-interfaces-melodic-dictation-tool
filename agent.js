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

  const prompt = `Tu es un musicologue et professeur de solfège expert.
Analyse cette suite chronologique de notes chantées avec leur durée exacte en secondes :
${JSON.stringify(rawNotes)}

Directives strictes pour la dictée :
1. ANALYSE DU TEMPO :
   - Trouve le tempo le plus naturel (BPM entre 80 et 140).
   - Calcule la durée d'une pulsion (ex: à 120 BPM, 1 noire = 0.5s, 1 croche = 0.25s, 1 blanche = 1.0s).
2. QUANTIFICATION DU RYTHME :
   - Compare chaque durée du tableau à la valeur théorique la plus proche (Double-croche, Croche, Noire, Blanche).
   - Arrondis les imprécisions de chant pour coller à la mesure.
3. HARMONISATION DES NOTES :
   - Corrige les légères faussetés (ex: si l'ensemble suggère une gamme de Do majeur, ajuste un Do# isolé en Do).
4. RETOUR VOCAL (speechText) :
   - Rédige un retour ultra-clair à voix haute en français.
   - Énonce la signature rythmique, le tempo, puis énumère chaque note avec sa figure (ex: "Mélodie en 4/4 à 100 BPM. Tu as chanté : Noire Do4, Croche Mi4, Blanche Sol4.").

Réponds STRICTEMENT au format JSON :
{
  "bpm": 100,
  "timeSignature": "4/4",
  "speechText": "Mélodie en 4/4 à 100 BPM. Tu as chanté une noire Do 4, une croche Mi 4 et une blanche Sol 4.",
  "notes": [
    {"note": "Do4", "figure": "Noire"},
    {"note": "Mi4", "figure": "Croche"},
    {"note": "Sol4", "figure": "Blanche"}
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