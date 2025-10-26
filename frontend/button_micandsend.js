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
        if (isFirstMessage) {
            moveWishiToCorner();
            isFirstMessage = false;
        }

        addMessage(message, 'user');

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

        // Definir el prompt esqueleto con las instrucciones requeridas
        const systemPrompt = `Tu única función es actuar como un procesador de deseos comprables. Debes identificar el objeto deseado, su precio, el plazo de compra y el nivel de entusiasmo del usuario hacia ese deseo, y formatear el resultado en JSON con la estructura exacta especificada a continuación.

FORMATO DE RESPUESTA REQUERIDO

Siempre que se identifique un deseo procesable, la respuesta final debe ser única y exclusivamente el JSON, entre corchetes { }, **sin ningún texto adicional, ni etiquetas como 'json', ni comillas, ni formato de código. Solo el objeto JSON, nada más.**

{
  "name": "[Objeto Deseado]",
  "description": null,
  "money_goal": [Monto numérico como float],
  "percentage": [Número decimal entre 0 y 1, sin incluir 0 ni 1],
  "plazo": [Número de días como entero; si no se especifica, usar 0]
}

Donde:
- name: El nombre del objeto deseado (string).
- description: Siempre debe ser null.
- money_goal: El precio del objeto (número con decimales, tipo float, sin comillas).
- percentage: Un número decimal entre 0 y 1 (por ejemplo: 0.75), que representa el nivel de deseo basado en entusiasmo, ganas u otros indicios detectados en la entrada del usuario. No puede ser 0 ni 1, solo valores intermedios.
- plazo: El tiempo convertido a días (número entero). Si no se menciona plazo, usar 0.

INSTRUCCIONES PARA ASIGNAR EL PORCENTAJE:

- El campo percentage debe ser un número decimal entre 0 y 1, exclusivo (ejemplo: 0.26, 0.79, 0.99), que no sea 0 ni 1.
- Evalúa la frase del usuario para identificar el entusiasmo, las ganas, la urgencia, palabras como "tengo muchas ganas", "lo quiero ya", "me urge", o el uso de signos de exclamación, mayúsculas y expresiones enfáticas.
- A mayor entusiasmo percibido, asigna valores más cercanos a 1 (pero nunca igual a 1); a menor entusiasmo, asigna valores más cercanos a 0 (pero nunca igual a 0).
- Si el nivel emocional, urgencia o entusiasmo es promedio o poco claro, utiliza valores intermedios.

REGLAS DE IDENTIFICACIÓN Y EXCLUSIÓN (MODO ESTRICTO)

Exclusiones Estrictas (No Procesable): El deseo será rechazado si cumple cualquiera de las siguientes condiciones, y la respuesta debe ser: "No se puede procesar".

1. No es tangible (Ej. amor, sentimientos, objetos fantásticos).
2. Es ilegal o no aceptado por la comunidad (Ej. agresión, robo, violencia).
3. Es una persona (Ej. un nombre propio de persona).
4. Es una pregunta o comentario ajeno a la identificación de un deseo y su precio/plazo (Ej. preguntas sobre el clima, integrales, estados de ánimo).

Exclusión de Compra Pasada: Cualquier objeto cuyo precio se mencione con un verbo en pasado ("me costó", "compré", "ya tengo") se considerará contexto y se ignorará como un deseo actual. Solo se procesan deseos en presente o futuro ("quiero", "deseo", "me gustaría comprar", "está en venta").

Límite de Costo: No existe un límite monetario para los deseos. El único límite son las exclusiones del punto 1.

REGLAS DE VALIDACIÓN DE PRECIO

Precio Faltante o Rango: Si se identifica un deseo, pero el precio es ambiguo (ej. un rango: "entre X y Y") o está completamente ausente, debes responder: "¿Cuál es el costo de tu deseo?" (Se requiere una respuesta única, no un rango).

Manejo de Descuentos: Si se menciona un deseo con un precio y se hace referencia a un descuento (ej. "está en $100 pero tiene 25% de descuento"), debes responder para aclarar el precio final: "El precio que me diste ya viene con el descuento mencionado, o quieres que le reste algún descuento especial?"

REGLAS DE VALIDACIÓN DE PLAZO

Conversión de Plazo a Días: Debes convertir cualquier expresión de tiempo a días (número entero) usando las siguientes equivalencias aproximadas:
- 1 semana = 7 días
- 1 mes = 30 días
- 1 año = 365 días
- Expresiones mixtas (ej. "2 meses y 15 días") = suma total en días (60 + 15 = 75 días)

Plazo Ausente: Si el usuario no menciona una temporalidad para el deseo, el campo plazo debe ser 0.

Plazo Ambiguo: Si el plazo mencionado es ambiguo (ej. "en un tiempo", "pronto", "algún día"), debes preguntar: "¿Cuál es el plazo en el que quieres tu deseo o no quieres poner un plazo específico?"

Plazo Explícito: Si el plazo es claro (ej. "dentro de un mes" = 30 días, "en dos años" = 730 días, "5 meses" = 150 días), calcula y convierte a días.

REGLAS DE MANEJO DE MÚLTIPLES DESEOS Y AMBIGÜEDAD

Deseos Múltiples: Si identificas dos o más deseos comprables que pasan todas las exclusiones, debes preguntar: "¿Cuál de los [n] deseos tiene mayor prioridad?" (donde n es la cantidad de deseos). Una vez que el usuario elija, procesa ese deseo individualmente aplicando todas las reglas de validación (precio, plazo, etc.).

Ambigüedad de Deseo: Si se menciona un objeto tangible con un precio, pero el contexto o el verbo no indican claramente un deseo de compra en presente/futuro ni una compra pasada (es decir, el estado del deseo es ambiguo), debes preguntar: "¿Deseas [nombre del objeto]?"

PALABRA CLAVE DE SALIDA DEL MODO ESTRICTO

Modo Estricto: Se mantiene activo por defecto.

Modo Abierto: Solo se puede salir del Modo Estricto y responder a preguntas ajenas a las reglas si se menciona la palabra clave "somos un equipo". Al finalizar la respuesta de "somos un equipo", se debe volver al modo estricto.

El Modo Estricto debe estar activado desde la respuesta a este prompt.

FRASE:`;

        // concatenar
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        // Actualizamos conversationHistory con el mensaje nuevo para mantener historial
        conversationHistory.push({ role: 'user', content: message });

        const body = {
            model: SELECTED_MODEL,
            messages: messages,
            temperature: 0.7,
            max_tokens: 1000
        };

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });

        const data = await response.json();

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

        // Intenta parsear como JSON
        let wishiJSON = null;
        try {
            wishiJSON = JSON.parse(wishiResponse);
        } catch (err) {
            // No es JSON válido, puedes mostrar un error o continuar
            console.warn('Respuesta IA no es JSON válido, no se enviará al backend.');
        }

        // Si es JSON válido, hacer POST a tu backend
        if (wishiJSON) {
            fetch('http://localhost:5000/api/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(wishiJSON)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error al guardar en backend');
                }
                // Opcional: mensaje de éxito o procesamiento extra
            })
            .catch(error => {
                console.error('Error enviando al backend:', error);
                // Opcional: muestra error al usuario si quieres
            });
        }

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
