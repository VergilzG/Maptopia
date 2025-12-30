// Fichier : netlify/functions/parlerToRex.js

exports.handler = async function(event, context) {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    let body;
    try { 
        body = JSON.parse(event.body); 
    } catch(e) { 
        return { statusCode: 400, body: "Erreur de données" }; 
    }
    
    const userMessage = body.message;
    const API_KEY = process.env.GROQ_API_KEY; 

    if (!API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Erreur config : Clé Groq manquante sur Netlify." }) };
    }

    const SYSTEM_PROMPT = `
    Tu es REX, l'IA de Maptopia pour Heartopia. 
    Réponds en français, anglais ou espagnol selon la question.
    Sois court (max 3 phrases).
    Infos : Myrtilles (Forêt du Nord), Poissons rares (Mer Calme/Océan Profond).
    `;

    try {
        // Utilisation de l'API Groq avec le modèle Llama 3.3
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile", 
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: userMessage }
                ],
                max_tokens: 150 
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: data.choices[0].message.content })
            };
        } else {
             return { statusCode: 500, body: JSON.stringify({ reply: "Erreur de réponse de l'IA." }) };
        }

    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ reply: "Erreur de connexion au serveur Groq." }) };
    }
};