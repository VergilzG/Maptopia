const https = require('https');

exports.handler = async function(event, context) {
    // Vérification de sécurité
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        // 1. Préparation des données
        const body = JSON.parse(event.body);
        const userMessage = body.message || "Bonjour";
        const API_KEY = process.env.OPENAI_API_KEY;

        const postData = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: "Tu es REX, l'assistant du serveur Minecraft Heartopia. Tu es utile, un peu geek et bref (max 60 mots). Tu connais bien le serveur." 
                },
                { role: "user", content: userMessage }
            ],
            temperature: 0.7
        });

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Length': Buffer.byteLength(postData) // Important pour la stabilité
            }
        };

        // 2. Envoi vers OpenAI (promesse)
        const responseBody = await new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => resolve(Buffer.concat(chunks).toString()));
            });

            req.on('error', (e) => reject(e));
            req.write(postData);
            req.end();
        });

        // 3. Traitement de la réponse
        const jsonResponse = JSON.parse(responseBody);

        // Si OpenAI renvoie une erreur explicite (ex: quota dépassé)
        if (jsonResponse.error) {
            console.log("Erreur OpenAI detectée:", jsonResponse.error);
            return {
                statusCode: 500,
                body: JSON.stringify({ reply: "Oups ! OpenAI me dit : " + jsonResponse.error.message })
            };
        }

        // Succès !
        const replyText = jsonResponse.choices[0].message.content;
        return {
            statusCode: 200,
            body: JSON.stringify({ reply: replyText })
        };

    } catch (error) {
        // Si le code plante complètement
        console.error("Crash du code:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ reply: "Erreur interne : " + error.message })
        };
    }
};
