const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error('Error: La variable de entorno OPENROUTER_API_KEY no está definida.');
    process.exit(1);
}

// Ruta para generar la receta
app.post('/api/generate-recipe', async (req, res) => {
    const { personas, tipoCocina, dificultad, alergias, ingredientes, otrasEspecificaciones } = req.body;

    const prompt = `
        Crea una receta detallada para ${personas} personas.
        Tipo de cocina: ${tipoCocina}.
        Nivel de dificultad: ${dificultad}.
        Ingredientes principales: ${ingredientes}.
        Alergias o dietas especiales: ${alergias.join(', ')}.
        Otras especificaciones: ${otrasEspecificaciones || 'Ninguna'}.
        
        El resultado debe ser una receta completa y bien estructurada.
        Formato de la receta:
        1. Título de la receta
        2. Descripción breve y atractiva del plato.
        3. Tiempo de preparación y cocción.
        4. Lista de ingredientes con cantidades (formato: - Ingrediente: Cantidad).
        5. Instrucciones paso a paso.
        6. Sugerencia de presentación.
    `;

    try {
        const openrouterRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": "mistralai/mistral-7b-instruct:free",
                "messages": [
                    { "role": "system", "content": "Eres un asistente de cocina experto. Tu tarea es crear recetas basadas en los ingredientes y preferencias del usuario. Sé creativo y conciso. El formato de la respuesta debe ser solo la receta." },
                    { "role": "user", "content": prompt }
                ]
            }),
        });

        if (!openrouterRes.ok) {
            throw new Error(`OpenRouter API response error: ${openrouterRes.statusText}`);
        }

        const data = await openrouterRes.json();
        const recipeContent = data.choices[0].message.content;
        res.json({ recipe: recipeContent });

    } catch (error) {
        console.error('Error al generar la receta:', error);
        res.status(500).json({ error: 'Hubo un error al generar la receta. Por favor, inténtalo de nuevo.' });
    }
});

// Sirve los archivos estáticos desde la carpeta 'client'
app.use(express.static(path.join(__dirname, '..', 'client')));

// Para la ruta principal, servir el index.html de la carpeta 'client'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});