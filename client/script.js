document.addEventListener('DOMContentLoaded', () => {
    const formSection = document.getElementById('form-section');
    const resultSection = document.getElementById('result-section');
    const welcomeSection = document.getElementById('welcome-section');
    const recipeForm = document.getElementById('recipe-form');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const recipeOutput = document.getElementById('recipe-output');

    // Función para mostrar una sección y ocultar las demás
    window.showSection = (sectionId) => {
        const sections = [welcomeSection, formSection, resultSection];
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.remove('hidden');
            } else {
                section.classList.add('hidden');
            }
        });
    };

    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        loadingSpinner.style.display = 'block';
        errorMessage.textContent = '';
        recipeOutput.textContent = '';
        
        const personas = document.getElementById('personas').value;
        const tipoCocina = document.getElementById('tipoCocina').value;
        const dificultad = document.getElementById('dificultad').value;
        const ingredientes = document.getElementById('ingredientes').value;
        const otrasEspecificaciones = document.getElementById('otrasEspecificaciones').value;
        
        const alergias = [];
        document.querySelectorAll('input[name="alergias"]:checked').forEach(checkbox => {
            alergias.push(checkbox.value);
        });

        try {
            const response = await fetch('/api/generate-recipe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ personas, tipoCocina, dificultad, alergias, ingredientes, otrasEspecificaciones })
            });

            if (!response.ok) {
                throw new Error('Error en el servidor al generar la receta.');
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            recipeOutput.innerHTML = marked.parse(data.recipe);
            showSection('result-section');
        } catch (error) {
            console.error('Error:', error);
            errorMessage.textContent = 'Lo siento, no pude generar la receta. Intenta de nuevo más tarde.';
        } finally {
            loadingSpinner.style.display = 'none';
        }
    });

    // Muestra la sección de bienvenida al cargar la página
    showSection('welcome-section');
});