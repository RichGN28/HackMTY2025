class WishesApp {
    constructor() {
        // Variables globales
        this.ahorro = 1250.00; // Cantidad de ahorro inicial
        this.wishes = []; // Array para almacenar los deseos
        
        // Referencias DOM
        this.ahorroTotalEl = document.getElementById('ahorroTotal');
        this.wishesListEl = document.getElementById('wishesList');
        this.totalWishesEl = document.getElementById('totalWishes');
        this.btnAgregarWish = document.getElementById('btnAgregarWish');
        
        // Modal
        this.btnAbrirModal = document.getElementById('abrirModal');
        this.btnCerrarModal = document.getElementById('cerrarModal');
        this.modalOverlay = document.querySelector('.modal-overlay');
        this.modalSaldo = document.getElementById('modalSaldo');
        
        this.init();
    }
    
    init() {
        // Actualizar cantidad de ahorro
        this.actualizarAhorro();
        
        // Event listeners
        this.btnAgregarWish.addEventListener('click', () => this.agregarWish());
        this.btnAbrirModal.addEventListener('click', (e) => this.abrirModal(e));
        this.btnCerrarModal.addEventListener('click', () => this.cerrarModal());
        this.modalOverlay.addEventListener('click', () => this.cerrarModal());
        
        // Agregar algunos deseos de ejemplo
        this.agregarWishEjemplo('iPhone 15 Pro', 'Color negro 256GB', 999.99);
        this.agregarWishEjemplo('MacBook Air', 'M2, 13 pulgadas', 1199.00);
        this.agregarWishEjemplo('AirPods Pro', 'Segunda generación', 249.00);
    }
    
    // Actualizar cantidad de ahorro en la barra superior
    actualizarAhorro() {
        this.ahorroTotalEl.textContent = this.formatoMoneda(this.ahorro);
    }
    
    // Agregar un nuevo deseo (con prompt)
    agregarWish() {
        const nombre = prompt('Nombre del deseo:');
        if (!nombre) return;
        
        const descripcion = prompt('Descripción (opcional):') || 'Sin descripción';
        const precioStr = prompt('Precio:');
        const precio = parseFloat(precioStr);
        
        if (isNaN(precio) || precio <= 0) {
            alert('Por favor ingresa un precio válido');
            return;
        }
        
        this.agregarWishEjemplo(nombre, descripcion, precio);
    }
    
    // Agregar deseo con datos
    agregarWishEjemplo(nombre, descripcion, precio) {
        const wish = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            precio: precio
        };
        
        this.wishes.push(wish);
        this.renderizarWishes();
        this.actualizarTotal();
    }
    
    // Renderizar todos los deseos
    renderizarWishes() {
        this.wishesListEl.innerHTML = '';
        
        this.wishes.forEach(wish => {
            const wishElement = this.crearWishElement(wish);
            this.wishesListEl.appendChild(wishElement);
        });
    }
    
    // Crear elemento HTML para un deseo
    crearWishElement(wish) {
        const wishDiv = document.createElement('div');
        wishDiv.className = 'wish-item';
        wishDiv.innerHTML = `
            <div class="wish-info">
                <div class="wish-nombre">${wish.nombre}</div>
                <div class="wish-descripcion">${wish.descripcion}</div>
            </div>
            <span class="wish-precio">${this.formatoMoneda(wish.precio)}</span>
            <button class="btn-eliminar" data-id="${wish.id}">Eliminar</button>
        `;
        
        // Event listener para eliminar
        const btnEliminar = wishDiv.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => this.eliminarWish(wish.id));
        
        return wishDiv;
    }
    
    // Eliminar un deseo
    eliminarWish(id) {
        this.wishes = this.wishes.filter(wish => wish.id !== id);
        this.renderizarWishes();
        this.actualizarTotal();
    }
    
    // Actualizar el total de todos los deseos
    actualizarTotal() {
        const total = this.wishes.reduce((sum, wish) => sum + wish.precio, 0);
        this.totalWishesEl.textContent = this.formatoMoneda(total);
        
        // También actualizar en el modal si está abierto
        const totalWishesModal = document.getElementById('totalWishesModal');
        const faltaAhorrar = document.getElementById('faltaAhorrar');
        
        if (totalWishesModal) {
            totalWishesModal.textContent = this.formatoMoneda(total);
        }
        
        if (faltaAhorrar) {
            const falta = Math.max(0, total - this.ahorro);
            faltaAhorrar.textContent = this.formatoMoneda(falta);
        }
    }
    
    // Formatear números como moneda
    formatoMoneda(cantidad) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
        }).format(cantidad);
    }
    
    // Abrir modal
    abrirModal(e) {
        e.preventDefault();
        this.modalSaldo.className = 'modal-saldo-activo';
        
        // Actualizar valores en el modal
        document.getElementById('saldoActual').textContent = this.formatoMoneda(this.ahorro);
        this.actualizarTotal();
    }
    
    // Cerrar modal
    cerrarModal() {
        this.modalSaldo.className = 'modal-saldo-oculto';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new WishesApp();
});
