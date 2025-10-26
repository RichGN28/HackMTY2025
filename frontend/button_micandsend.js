// API Key
const OPENROUTER_API_KEY = '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';

const MODELS = {
    deepseek_chat: 'deepseek/deepseek-chat',
    gemma_free: 'google/gemma-2-9b-it:free',
    mistral_free: 'mistralai/mistral-7b-instruct:free',
    llama_free: 'meta-llama/llama-3.2-3b-instruct:free'
};

const SELECTED_MODEL = MODELS.deepseek_chat;

const textarea = document.getElementById('textbox');
const micButton = document.getElementById('micButton');
const chatContainer = document.getElementById('chatContainer');
const wishiContainer = document.getElementById('wishiContainer');

let conversationHistory = [];
let isFirstMessage = true;

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

// Agregar mensaje al chat
function addMessage(text, sender = 'wishi') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll al final
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Mover Wishi a la esquina superior derecha
function moveWishiToCorner() {
    wishiContainer.classList.add('small');
}

async function sendToDeepSeek(message, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000;
    
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'TU_API_KEY_AQUI') {
        addMessage('⚠️ Por favor configura tu API key de OpenRouter', 'wishi');
        return;
    }

    try {
        // Si es el primer mensaje, mover Wishi arriba
        if (isFirstMessage) {
            moveWishiToCorner();
            isFirstMessage = false;
        }
        
        // Agregar mensaje del usuario
        addMessage(message, 'user');
        
        // Mostrar indicador de escritura
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message wishi';
        loadingDiv.id = 'loading-indicator';
        loadingDiv.innerHTML = '<div class="message-bubble">Wishi está escribiendo...</div>';
        chatContainer.appendChild(loadingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        micButton.disabled = true;

        const headers = {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.href,
            'X-Title': 'Wishi Chat'
        };

        conversationHistory.push({
            role: 'user',
            content: message
        });

        const body = {
            model: SELECTED_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'Eres Wishi, un asistente amigable y útil. Responde de manera concisa y amable.'
                },
                ...conversationHistory
            ],
            temperature: 0.7,
            max_tokens: 1000
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();
        
        // Quitar indicador de carga
        document.getElementById('loading-indicator')?.remove();
        
        if (!response.ok) {
            if (response.status === 429 && retryCount < MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return sendToDeepSeek(message, retryCount + 1);
            }
            
            let errorMessage = `Error ${response.status}`;
            if (data.error) errorMessage = data.error.message || errorMessage;
            
            throw new Error(errorMessage);
        }
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const wishiResponse = data.choices[0].message.content;
            
            conversationHistory.push({
                role: 'assistant',
                content: wishiResponse
            });
            
            const formattedResponse = wishiResponse
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');
            
            addMessage(formattedResponse, 'wishi');
        } else {
            throw new Error('Respuesta inesperada de OpenRouter');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
        document.getElementById('loading-indicator')?.remove();
        addMessage(`Error: ${error.message}`, 'wishi');
    } finally {
        micButton.disabled = false;
    }
}

// Mostrar mensaje de bienvenida
function showWelcomeMessage() {
    const welcomeMessages = [
        "¡Hola! Soy Wishi ✨<br>¿En qué puedo ayudarte hoy?",
        "¡Bienvenido! 🌟<br>Cuéntame, ¿qué necesitas?",
        "¡Hola! 👋<br>Estoy aquí para ayudarte"
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = randomMessage;
    chatContainer.appendChild(welcomeDiv);
}

// Event listeners
textarea.addEventListener('input', updateButton);
textarea.addEventListener('change', updateButton);

micButton.addEventListener('click', function() {
    const mode = this.getAttribute('data-mode');
    
    if (mode === 'send') {
        const message = textarea.value.trim();
        sendToDeepSeek(message);
        textarea.value = '';
        updateButton();
    } else {
        alert('Funcionalidad de micrófono pendiente de implementar');
    }
});

textarea.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim().length > 0) {
            micButton.click();
        }
    }
});

// Inicializar
updateButton();
showWelcomeMessage();
console.log('🤖 Wishi iniciado con modelo:', SELECTED_MODEL);
