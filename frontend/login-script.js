// Configuración para base de datos (puedes modificar según tu backend)
const DB_CONFIG = {
    // Opción 1: API REST
    apiUrl: 'https://tu-servidor.com/api/login',
    
    // Opción 2: Firebase
    // firebaseConfig: { ... },
    
    // Opción 3: Fetch a PHP
    // phpUrl: 'backend/login.php'
};

class LoginSystem {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.usernameInput = document.getElementById('username');
        this.passwordInput = document.getElementById('password');
        this.btnLogin = document.getElementById('btnLogin');
        this.userInfo = document.getElementById('userInfo');
        
        this.init();
    }
    
    init() {
        // Event listener para el formulario
        this.form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Validación en tiempo real
        this.usernameInput.addEventListener('input', () => this.validateUsername());
        this.passwordInput.addEventListener('input', () => this.validatePassword());
    }
    
    // Generar ID de usuario de 6 dígitos
    generateUserId() {
        return Math.floor(100000 + Math.random() * 900000);
    }
    
    // Validar username
    validateUsername() {
        const username = this.usernameInput.value.trim();
        const errorElement = document.getElementById('usernameError');
        
        if (username.length === 0) {
            this.showError(this.usernameInput, errorElement, 'El nombre de usuario es requerido');
            return false;
        }
        
        if (username.length < 3) {
            this.showError(this.usernameInput, errorElement, 'Mínimo 3 caracteres');
            return false;
        }
        
        this.clearError(this.usernameInput, errorElement);
        return true;
    }
    
    // Validar password
    validatePassword() {
        const password = this.passwordInput.value;
        const errorElement = document.getElementById('passwordError');
        
        if (password.length === 0) {
            this.showError(this.passwordInput, errorElement, 'La contraseña es requerida');
            return false;
        }
        
        if (password.length < 6) {
            this.showError(this.passwordInput, errorElement, 'Mínimo 6 caracteres');
            return false;
        }
        
        this.clearError(this.passwordInput, errorElement);
        return true;
    }
    
    // Mostrar error
    showError(input, errorElement, message) {
        input.classList.add('error');
        errorElement.textContent = message;
    }
    
    // Limpiar error
    clearError(input, errorElement) {
        input.classList.remove('error');
        errorElement.textContent = '';
    }
    
    // Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        // Validar campos
        const isUsernameValid = this.validateUsername();
        const isPasswordValid = this.validatePassword();
        
        if (!isUsernameValid || !isPasswordValid) {
            return;
        }
        
        // Deshabilitar botón durante el proceso
        this.btnLogin.disabled = true;
        this.btnLogin.textContent = 'Iniciando...';
        
        // Obtener datos del formulario
        const username = this.usernameInput.value.trim();
        const password = this.passwordInput.value;
        const userId = this.generateUserId();
        
        // Simular llamada a base de datos (reemplazar con tu lógica)
        try {
            const result = await this.authenticateUser(username, password, userId);
            
            if (result.success) {
                this.showSuccess(result.data);
            } else {
                alert('Usuario o contraseña incorrectos');
                this.btnLogin.disabled = false;
                this.btnLogin.textContent = 'Iniciar Sesión';
            }
        } catch (error) {
            console.error('Error en login:', error);
            alert('Error al conectar con el servidor');
            this.btnLogin.disabled = false;
            this.btnLogin.textContent = 'Iniciar Sesión';
        }
    }
    
    // MÉTODO PARA CONECTAR A BASE DE DATOS
    async authenticateUser(username, password, userId) {
        // ====== OPCIÓN 1: Simulación local (para pruebas) ======
        return new Promise((resolve) => {
            setTimeout(() => {
                // Simular autenticación exitosa
                resolve({
                    success: true,
                    data: {
                        userId: userId,
                        username: username
                    }
                });
            }, 1000);
        });
        
        // ====== OPCIÓN 2: Conectar a API REST ======
        /*
        const response = await fetch(DB_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password,
                userId: userId
            })
        });
        
        return await response.json();
        */
        
        // ====== OPCIÓN 3: Conectar a PHP ======
        /*
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('userId', userId);
        
        const response = await fetch('backend/login.php', {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
        */
    }
    
    // Mostrar éxito
    showSuccess(data) {
        // Ocultar formulario
        this.form.style.display = 'none';
        
        // Mostrar información del usuario
        this.userInfo.style.display = 'block';
        document.getElementById('userId').textContent = data.userId;
        document.getElementById('displayUsername').textContent = data.username;
        
        // Guardar en sessionStorage
        sessionStorage.setItem('user', JSON.stringify(data));
        
        // Redirigir después de 2 segundos (opcional)
        setTimeout(() => {
            window.location.href = 'homepage.html';
        }, 2000);
    }
}

// Inicializar el sistema de login
document.addEventListener('DOMContentLoaded', () => {
    new LoginSystem();
});
