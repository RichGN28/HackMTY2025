class WishesApp {
    constructor() {
        // Variables globales
        this.ahorro = 1250.00;
        this.wishes = [];
        this.chart = null;
        this.viewMode = 'mes'; // 'mes' o 'dia'
        
        // Datos para la gráfica (puedes modificarlos)
        this.datosIdeal = {
            mes: [100, 200, 300, 400, 500, 600],
            dia: [10, 20, 35, 45, 60, 70, 85, 95, 110, 125, 140, 155, 170, 185, 200]
        };
        
        this.datosReal = {
            mes: [80, 180, 250, 350, 420, 500],
            dia: [8, 18, 30, 40, 55, 65, 75, 88, 100, 115, 130, 142, 158, 175, 190]
        };
        
        // Referencias DOM
        this.ahorroTotalEl = document.getElementById('ahorroTotal');
        this.wishesListEl = document.getElementById('wishesList');
        this.totalWishesEl = document.getElementById('totalWishes');
        this.btnAgregarWish = document.getElementById('btnAgregarWish');
        this.objetosListEl = document.getElementById('objetosList');
        
        // Modal
        this.btnAbrirModal = document.getElementById('abrirModal');
        this.btnCerrarModal = document.getElementById('cerrarModal');
        this.modalOverlay = document.querySelector('.modal-overlay');
        this.modalSaldo = document.getElementById('modalSaldo');
        this.btnToggleView = document.getElementById('btnToggleView');
        this.viewLabel = document.getElementById('viewLabel');
        
        this.init();
    }
    
    init() {
        this.actualizarAhorro();
        
        // Event listeners
        this.btnAgregarWish.addEventListener('click', () => this.agregarWish());
        this.btnAbrirModal.addEventListener('click', (e) => this.abrirModal(e));
        this.btnCerrarModal.addEventListener('click', () => this.cerrarModal());
        this.modalOverlay.addEventListener('click', () => this.cerrarModal());
        this.btnToggleView.addEventListener('click', () => this.toggleView());
        
        // Agregar deseos de ejemplo
        this.agregarWishEjemplo('iPhone 15 Pro', 'Color negro 256GB', 999.99, 500);
        this.agregarWishEjemplo('MacBook Air', 'M2, 13 pulgadas', 1199.00, 850);
        this.agregarWishEjemplo('AirPods Pro', 'Segunda generación', 249.00, 200);
    }
    
    actualizarAhorro() {
        this.ahorroTotalEl.textContent = this.formatoMoneda(this.ahorro);
    }
    
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
        
        const ahorradoStr = prompt('¿Cuánto has ahorrado para este deseo?') || '0';
        const ahorrado = parseFloat(ahorradoStr);
        
        this.agregarWishEjemplo(nombre, descripcion, precio, ahorrado);
    }
    
    agregarWishEjemplo(nombre, descripcion, precio, ahorrado = 0) {
        const wish = {
            id: Date.now(),
            nombre: nombre,
            descripcion: descripcion,
            precio: precio,
            ahorrado: ahorrado
        };
        
        this.wishes.push(wish);
        this.renderizarWishes();
        this.actualizarTotal();
    }
    
    renderizarWishes() {
        this.wishesListEl.innerHTML = '';
        
        this.wishes.forEach(wish => {
            const wishElement = this.crearWishElement(wish);
            this.wishesListEl.appendChild(wishElement);
        });
    }
    
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
        
        const btnEliminar = wishDiv.querySelector('.btn-eliminar');
        btnEliminar.addEventListener('click', () => this.eliminarWish(wish.id));
        
        return wishDiv;
    }
    
    eliminarWish(id) {
        this.wishes = this.wishes.filter(wish => wish.id !== id);
        this.renderizarWishes();
        this.actualizarTotal();
    }
    
    actualizarTotal() {
        const total = this.wishes.reduce((sum, wish) => sum + wish.precio, 0);
        this.totalWishesEl.textContent = this.formatoMoneda(total);
    }
    
    // Renderizar barras de progreso en el modal
    renderizarBarrasObjetos() {
        this.objetosListEl.innerHTML = '';
        
        this.wishes.forEach(wish => {
            const porcentaje = Math.min((wish.ahorrado / wish.precio) * 100, 100);
            
            const barraDiv = document.createElement('div');
            barraDiv.className = 'objeto-barra';
            barraDiv.innerHTML = `
                <div class="objeto-nombre" title="${wish.nombre}">${wish.nombre}</div>
                <div class="barra-vertical-container">
                    <div class="barra-vertical-fill" style="height: ${porcentaje}%"></div>
                </div>
                <div class="objeto-porcentaje">${porcentaje.toFixed(0)}%</div>
            `;
            
            this.objetosListEl.appendChild(barraDiv);
        });
    }
    
    // Crear gráfica con Chart.js
    crearGrafica() {
        const ctx = document.getElementById('ahorroChart').getContext('2d');
        
        const labels = this.viewMode === 'mes' 
            ? ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
            : ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', 'D14', 'D15'];
        
        const dataIdeal = this.viewMode === 'mes' ? this.datosIdeal.mes : this.datosIdeal.dia;
        const dataReal = this.viewMode === 'mes' ? this.datosReal.mes : this.datosReal.dia;
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ideal',
                        data: dataIdeal,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#2ecc71'
                    },
                    {
                        label: 'Real',
                        data: dataReal,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        pointRadius: 4,
                        pointBackgroundColor: '#3498db'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            usePointStyle: true
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Ahorro ($)',
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: this.viewMode === 'mes' ? 'Meses' : 'Días',
                            font: {
                                size: 13,
                                weight: 'bold'
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Cambiar entre vista de meses y días
    toggleView() {
        this.viewMode = this.viewMode === 'mes' ? 'dia' : 'mes';
        this.viewLabel.textContent = this.viewMode === 'mes' ? 'Mes' : 'Día';
        this.crearGrafica();
    }
    
    formatoMoneda(cantidad) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'USD'
        }).format(cantidad);
    }
    
    abrirModal(e) {
        e.preventDefault();
        this.modalSaldo.className = 'modal-saldo-activo';
        this.renderizarBarrasObjetos();
        this.crearGrafica();
    }
    
    cerrarModal() {
        this.modalSaldo.className = 'modal-saldo-oculto';
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    new WishesApp();
});
