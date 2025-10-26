// ⚠️ COLOCA TU API KEY DE OPENROUTER AQUÍ ⚠️
// Obtén tu API key en: https://openrouter.ai/keys
const OPENROUTER_API_KEY = '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';
// Modelos disponibles de DeepSeek (puedes cambiar el modelo aquí)
const MODELS = {
    deepseek_r1_free: 'deepseek/deepseek-r1:free',           // GRATIS - Razonamiento (límite bajo)
    deepseek_chat: 'deepseek/deepseek-chat',                  // Muy barato - Chat general ($0.14/1M tokens)
    deepseek_v31: 'deepseek/deepseek-chat-v3.1',             // Bajo - Agentes y código
    deepseek_chimera_free: 'tngtech/deepseek-r1t-chimera:free', // GRATIS - Híbrido
    // Alternativas con mejor rate limit:
    gemma_free: 'google/gemma-2-9b-it:free',                 // GRATIS - Google, mejor rate limit
    mistral_free: 'mistralai/mistral-7b-instruct:free',      // GRATIS - Rápido
    llama_free: 'meta-llama/llama-3.2-3b-instruct:free'      // GRATIS - Meta, muy estable
};

// Selecciona el modelo que quieres usar
// 💡 Si tienes problemas con rate limit, prueba gemma_free o llama_free
const SELECTED_MODEL = MODELS.deepseek_chat; // Muy barato pero sin rate limit estricto

const textarea = document.getElementById('textbox');
const micButton = document.getElementById('micButton');
const responseContainer = document.getElementById('responseContainer');
const responseText = document.getElementById('responseText');

// SVG del micrófono
const micSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-mic-fill" viewBox="0 0 16 16">
        <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z"/>
        <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5"/>
    </svg>
`;

// SVG del botón enviar
const sendSVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-send-fill" viewBox="0 0 16 16">
        <path d="M15.964.686a.5.5 0 0 0-.65-.65L.767 5.855H.766l-.452.18a.5.5 0 0 0-.082.887l.41.26.001.002 4.995 3.178 3.178 4.995.002.002.26.41a.5.5 0 0 0 .886-.083zm-1.833 1.89L6.637 10.07l-.215-.338a.5.5 0 0 0-.154-.154l-.338-.215 7.494-7.494 1.178-.471z"/>
    </svg>
`;

function updateButton() {
    const text = textarea.value.trim();
    
    if (text.length > 0) {
        micButton.innerHTML = sendSVG;
        micButton.setAttribute('data-mode', 'send');
    } else {
        micButton.innerHTML = micSVG;
        micButton.setAttribute('data-mode', 'mic');
    }
}

async function sendToDeepSeek(message, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 segundos
    
    // Verificar que la API key esté configurada
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'TU_API_KEY_AQUI') {
        responseContainer.classList.add('visible');
        responseText.innerHTML = `
            <div class="error">
                ⚠️ Por favor configura tu API key de OpenRouter<br><br>
                <strong>Pasos:</strong><br>
                1. Ve a <a href="https://openrouter.ai/keys" target="_blank">OpenRouter Keys</a><br>
                2. Crea una cuenta si no tienes<br>
                3. Haz clic en "Create Key"<br>
                4. Copia la key y pégala en el código<br>
                <br>
                💡 <strong>Tip:</strong> Usa los modelos con ":free" para no gastar créditos
            </div>
        `;
        return;
    }

    try {
        // Mostrar loading
        responseContainer.classList.add('visible');
        if (retryCount > 0) {
            responseText.innerHTML = `<div class="loading">Reintentando (${retryCount}/${MAX_RETRIES})... Wishi está pensando</div>`;
        } else {
            responseText.innerHTML = '<div class="loading">Wishi está pensando con DeepSeek...</div>';
        }
        micButton.disabled = true;

        // Headers requeridos por OpenRouter
        const headers = {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'Wishi Chat'
        };

        // Body de la petición
        const body = {
            model: SELECTED_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'Eres Wishi, un asistente amigable y útil. Responde de manera concisa y amable.'
                },
                {
                    role: 'user',
                    content: message
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        };

        console.log('🚀 Enviando a OpenRouter con modelo:', SELECTED_MODEL);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            // Si es error 429 (rate limit) y aún tenemos reintentos
            if (response.status === 429 && retryCount < MAX_RETRIES) {
                console.log(`⏰ Rate limit alcanzado. Reintentando en ${RETRY_DELAY/1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return sendToDeepSeek(message, retryCount + 1);
            }
            
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            
            if (data.error) {
                errorMessage = data.error.message || errorMessage;
                
                // Mensajes de ayuda específicos
                if (response.status === 401) {
                    errorMessage += '<br><br>❌ API key inválida. Verifica que la copiaste correctamente.';
                } else if (response.status === 402) {
                    errorMessage += '<br><br>💳 Sin créditos suficientes. Usa un modelo gratuito (con :free) o agrega créditos.';
                } else if (response.status === 429) {
                    errorMessage += '<br><br>⏰ Límite de solicitudes excedido después de reintentar. Espera 1-2 minutos.';
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Extraer la respuesta
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const deepseekResponse = data.choices[0].message.content;
            
            // Formatear respuesta (convertir markdown básico)
            const formattedResponse = deepseekResponse
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            responseText.innerHTML = `<div>${formattedResponse}</div>`;
            
            // Mostrar info de uso (opcional)
            if (data.usage) {
                console.log('📊 Tokens usados:', data.usage.total_tokens);
                console.log('💰 Modelo:', data.model);
            }
        } else {
            throw new Error('Respuesta inesperada de OpenRouter. Estructura no válida.');
        }
        
    } catch (error) {
        console.error('❌ Error completo:', error);
        responseText.innerHTML = `
            <div class="error">
                <strong>Error:</strong> ${error.message}
                <br><br>
                <strong>Verifica:</strong><br>
                1. Tu API key de OpenRouter sea correcta<br>
                2. Tengas créditos (o usa un modelo :free)<br>
                3. Tu conexión a internet<br>
                4. La consola del navegador (F12) para más detalles<br>
                <br>
                <strong>Modelo actual:</strong> ${SELECTED_MODEL}<br>
                <strong>Ayuda:</strong> <a href="https://openrouter.ai/docs" target="_blank">Documentación OpenRouter</a>
            </div>
        `;
    } finally {
        micButton.disabled = false;
    }
}

// Escuchar cambios en el textarea
textarea.addEventListener('input', updateButton);
textarea.addEventListener('change', updateButton);

// Manejar el clic del botón
micButton.addEventListener('click', function() {
    const mode = this.getAttribute('data-mode');
    
    if (mode === 'send') {
        const message = textarea.value.trim();
        console.log('📤 Enviando mensaje:', message);
        
        // Enviar a DeepSeek via OpenRouter
        sendToDeepSeek(message);
        
        // Limpiar el textarea después de enviar
        textarea.value = '';
        updateButton();
    } else {
        // Lógica para activar el micrófono
        console.log('🎤 Activando micrófono...');
        this.classList.toggle('recording');
        
        // Aquí puedes agregar tu lógica de grabación de voz
        alert('Funcionalidad de micrófono pendiente de implementar');
    }
});

// Permitir enviar con Enter (Shift+Enter para nueva línea)
textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim().length > 0) {
            micButton.click();
        }
    }
});

// Función para mostrar el saludo inicial
function showWelcomeMessage() {
    const welcomeMessages = [
        "¡Hola! Soy Wishi ✨<br>¿En qué puedo ayudarte hoy?",
        "¡Bienvenido! 🌟<br>Cuéntame, ¿qué necesitas?",
        "¡Hola! 👋<br>Estoy aquí para ayudarte",
        "¡Hey! Soy Wishi 💫<br>¿Qué deseas hacer hoy?",
        "¡Hola amigo! 🎉<br>¿En qué puedo asistirte?"
    ];
    
    // Elegir un saludo aleatorio
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    // Mostrar el saludo
    responseContainer.classList.add('visible');
    responseText.innerHTML = `<div class="welcome-message">${randomMessage}</div>`;
}

// Inicializar el botón al cargar la página
updateButton();

// Mostrar saludo de bienvenida
showWelcomeMessage();

// Mostrar modelo seleccionado en consola
console.log('🤖 Wishi iniciado con modelo:', SELECTED_MODEL);
console.log('💡 Modelos disponibles:', MODELS);