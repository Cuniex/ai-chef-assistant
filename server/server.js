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
Eres un chef experto y creativo. Tu tarea es diseñar una receta detallada y atractiva.

Instrucciones:
- Número de personas: ${personas}.
- Tipo de cocina: ${tipoCocina}.
- Nivel de dificultad: ${dificultad}.
- Ingredientes principales: ${ingredientes}.
- Alergias o dietas especiales: ${alergias.length > 0 ? alergias.join(', ') : 'Ninguna'}.
- Otras especificaciones: ${otrasEspecificaciones || 'Ninguna'}.

⚠️ Importante:
- La receta debe estar redactada en castellano
- Usa un tono claro, profesional y atractivo.
- Aporta creatividad, sugerencias de técnicas culinarias y toques especiales que enriquezcan el plato.
- Asegúrate de que sea una receta viable en la práctica, no solo teórica.

Formato de salida de la receta:
1. **Título del plato**
2. **Descripción breve** (atractiva, que despierte apetito).
3. **Tiempo de preparación y cocción** (en minutos).
4. **Lista de ingredientes con cantidades exactas**  
   - Ingrediente: Cantidad  
   (incluye los principales y los adicionales necesarios).
5. **Instrucciones paso a paso**, claras y numeradas.
6. **Sugerencia de presentación** (platos, decoración, acompañamientos).
7. **Consejos adicionales del chef** (opcional: trucos, variaciones o maridajes).

Entrega la receta final bien estructurada y lista para ser usada.
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