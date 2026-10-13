// SIMULADOR DE PRESUPUESTO E INVENTARIO DINÁMICO
// ARCHIVO OPTIMIZADO PARA PRE-ENTREGA 8. 

// 1. CLASE MODELO (PASCALCASE)
class Producto {
    constructor(id, nombre, precio, stock) {
        this.id = id;
        this.nombre = nombre;
        this.precio = parseFloat(precio);
        this.stock = parseInt(stock);
    }

    // Método para calcular el precio con IVA (21%)
    sumarIva() {
        return this.precio * 1.21;
    }
}

// 2. PRODUCTOS POR DEFECTO (FALLBACK)
const productosPorDefecto = [
    new Producto(1, "Pan", 1500, 20),
    new Producto(2, "Leche", 1200, 15),
    new Producto(3, "Café", 4500, 10),
    new Producto(4, "Azúcar", 900, 8)
];

// Clave constante para LocalStorage
const STORAGE_KEY = "inventario_simulador";

// 3. SELECCIÓN DE ELEMENTOS DEL DOM
const contenedorProductos = document.getElementById("contenedor-productos");
const formularioProducto = document.getElementById("formulario-producto");
const inputNombre = document.getElementById("input-nombre");
const inputPrecio = document.getElementById("input-precio");
const inputStock = document.getElementById("input-stock");
const inputBusqueda = document.getElementById("input-busqueda");
const mensajeFeedback = document.getElementById("mensaje-feedback");
const resumenInventario = document.getElementById("resumen-inventario");
const btnVaciar = document.getElementById("btn-vaciar");

// 4. FUNCIONES DE PERSISTENCIA Y STORAGE

// Guardar array en LocalStorage usando JSON.stringify
function guardarEnStorage(lista) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

// Recuperar datos de LocalStorage de forma completamente segura
function cargarDeStorage() {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);
    
    if (datosGuardados) {
        const datosParseados = JSON.parse(datosGuardados);
        return datosParseados.map(p => new Producto(p.id, p.nombre, p.precio, p.stock));
    }
    
    return productosPorDefecto;
}

// Inicializamos el inventario desde el Storage
let inventario = cargarDeStorage();

// 5. FUNCIONES MODULARES Y DE RENDERIZADO

// Mostrar feedback visual con transiciones en el DOM
function mostrarFeedback(mensaje, tipo = "exito") {
    mensajeFeedback.textContent = mensaje;
    mensajeFeedback.className = `feedback ${tipo}`;

    setTimeout(() => {
        mensajeFeedback.className = "feedback oculto";
    }, 3000);
}

// Calcular y renderizar resumen con destructuring y reduce()
function actualizarResumen(lista) {
    const totalInversion = lista.reduce((acumulador, { precio, stock }) => acumulador + (precio * stock), 0);
    const totalUnidades = lista.reduce((acumulador, { stock }) => acumulador + stock, 0);

    resumenInventario.innerHTML = `
        📊 <strong>Total de productos listados:</strong> ${lista.length} | 
        📦 <strong>Unidades totales:</strong> ${totalUnidades} | 
        💰 <strong>Valor en stock (base):</strong> $${totalInversion.toFixed(2)}
    `;
}

// Sincronizacion en tiempo real
// Renderizado dinámico en el DOM
function renderizarProductos(lista) {
    contenedorProductos.innerHTML = "";

    lista.length === 0
        ? (contenedorProductos.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888;">No hay productos registrados en el inventario.</p>`)
        : null;

    for (const producto of lista) {
        const { id, nombre, precio, stock } = producto;
        const tarjeta = document.createElement("div");
        tarjeta.className = "producto-card";
        
        tarjeta.innerHTML = `
            <div>
                <h3>${nombre}</h3>
                <p><strong>Precio Base:</strong> $${precio.toFixed(2)}</p>
                <p><strong>Precio c/IVA:</strong> $${producto.sumarIva().toFixed(2)}</p>
                <p><strong>Stock:</strong> ${stock} unidades</p>
            </div>
            <div class="acciones">
                <button class="btn btn-danger btn-eliminar" data-id="${id}">🗑️ Eliminar</button>
            </div>
        `;
        contenedorProductos.appendChild(tarjeta);
    }

    actualizarResumen(lista);
}

// Agregar producto y sincronizar con LocalStorage
function agregarProducto(e) {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const precio = parseFloat(inputPrecio.value);
    const stock = parseInt(inputStock.value);

    const esValido = (nombre !== "" && !isNaN(precio) && !isNaN(stock));

    if (!esValido) {
        mostrarFeedback("⚠️ Por favor, ingresa valores válidos en todos los campos.", "error");
        return;
    }

    const nuevoId = inventario.length > 0 ? Math.max(...inventario.map(p => p.id)) + 1 : 1;
    const nuevoProducto = new Producto(nuevoId, nombre, precio, stock);

    inventario.push(nuevoProducto);
    
    guardarEnStorage(inventario);
    renderizarProductos(inventario);

    formularioProducto.reset();
    inputNombre.focus();
    mostrarFeedback(`✅ Producto "${nombre}" guardado y sincronizado en Storage.`);
}

// Eliminar producto y sincronizar con LocalStorage
function eliminarProducto(e) {
    if (e.target.classList.contains("btn-eliminar")) {
        const idAEliminar = parseInt(e.target.getAttribute("data-id"));
        const productoEncontrado = inventario.find(p => p.id === idAEliminar);

        if (productoEncontrado) {
            inventario = inventario.filter(p => p.id !== idAEliminar);
            guardarEnStorage(inventario);
            renderizarProductos(inventario);

            mostrarFeedback(`🗑️ Producto "${productoEncontrado.nombre}" eliminado del inventario y de Storage.`, "error");
        }
    }
}

// Vaciar inventario completo y limpiar LocalStorage
function vaciarInventario() {
    const tieneElementos = inventario.length > 0;

    tieneElementos
        ? (inventario = [], localStorage.removeItem(STORAGE_KEY), renderizarProductos(inventario), mostrarFeedback("🗑️ Se ha vaciado el inventario y se limpió el LocalStorage.", "error"))
        : mostrarFeedback("⚠️ El inventario ya está vacío.", "error");
}

// Filtrar por teclado en tiempo real
function filtrarProductos() {
    const terminoBusqueda = inputBusqueda.value.toLowerCase().trim();
    const productosFiltrados = inventario.filter(({ nombre }) => 
        nombre.toLowerCase().includes(terminoBusqueda)
    );
    renderizarProductos(productosFiltrados);
}

// 6. ASIGNACIÓN DE EVENTOS (LISTENERS)
formularioProducto.addEventListener("submit", agregarProducto);
contenedorProductos.addEventListener("click", eliminarProducto);
inputBusqueda.addEventListener("input", filtrarProductos);
btnVaciar.addEventListener("click", vaciarInventario);

// 7. INICIALIZACIÓN DE LA APLICACIÓN AL CARGAR LA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    if (!localStorage.getItem(STORAGE_KEY)) {
        guardarEnStorage(inventario);
    }
    renderizarProductos(inventario);
});