const textarea = document.querySelector('.textbox');
const micButton = document.getElementById('micButton');

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

// Escuchar cambios en el textarea
textarea.addEventListener('input', updateButton);
textarea.addEventListener('change', updateButton);
// Manejar el clic del botón
micButton.addEventListener('click', function() {
    const mode = this.getAttribute('data-mode');
    
    if (mode === 'send') {
        // Lógica para enviar el mensaje
        const message = textarea.value.trim();
        console.log('Enviando mensaje:', message);
        
        // Aquí puedes agregar tu lógica de envío
        // Por ejemplo, enviar a un servidor, agregar a un chat, etc.
        
        // Limpiar el textarea después de enviar
        textarea.value = '';
        updateButton(); // Actualizar el botón
    } else {
        // Lógica para activar el micrófono
        console.log('Activando micrófono...');
        this.classList.toggle('recording');
        
        // Aquí puedes agregar tu lógica de grabación de voz
    }
});

// Inicializar el botón al cargar la página
updateButton();