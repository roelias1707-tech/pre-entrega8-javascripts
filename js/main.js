// ==========================================
// PRE-ENTREGA 8: SIMULADOR DE INVENTARIO Y PRESUPUESTO
// Sincronización de Estado entre DOM y LocalStorage
// ==========================================

// Clave única para el almacenamiento en LocalStorage
const STORAGE_KEY = "inventario_productos";

// Catálogo por defecto si no existen datos guardados previa o inicialmente
const productosIniciales = [
    { id: 1, nombre: "Pintura Látex Interior 10L", precio: 25000, stock: 15 },
    { id: 2, nombre: "Esmalte Sintético 1L", precio: 8500, stock: 30 },
    { id: 3, nombre: "Pincel N° 20", precio: 1200, stock: 50 },
    { id: 4, nombre: "Rodillo Antigota 22cm", precio: 4300, stock: 20 }
];

// Estado global de la aplicación (Array de Objetos)
let inventario = [];

// ==========================================
// REFERENCIAS AL DOM (Coincidentes con index.html)
// ==========================================
const formularioProducto = document.getElementById("formulario-producto");
const inputNombre = document.getElementById("input-nombre");
const inputPrecio = document.getElementById("input-precio");
const inputStock = document.getElementById("input-stock");
const inputBusqueda = document.getElementById("input-busqueda");
const btnVaciar = document.getElementById("btn-vaciar");
const contenedorProductos = document.getElementById("contenedor-productos");
const resumenInventario = document.getElementById("resumen-inventario");
const mensajeFeedback = document.getElementById("mensaje-feedback");

// ==========================================
// 1. PERSISTENCIA DE DATOS Y SERIALIZACIÓN JSON (CRUD)
// ==========================================

// READ: Leer datos del LocalStorage con JSON.parse y Operador ?? (Nullish Coalescing)
function cargarDeStorage() {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);
    // Uso del operador Nullish Coalescing (??) para asignación limpia si no existe la clave
    const parsedData = JSON.parse(datosGuardados) ?? productosIniciales;
    return parsedData;
}

// CREATE / UPDATE / DELETE: Sincronizar estado global en LocalStorage usando JSON.stringify
function sincronizarStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inventario));
}

// CLEAR: Vaciar todo el almacenamiento en LocalStorage
function vaciarTodoElStorage() {
    localStorage.removeItem(STORAGE_KEY);
    inventario = [];
    renderizarInventario(inventario);
    mostrarFeedback("Se ha vaciado el inventario y el LocalStorage.", "error");
}

// ==========================================
// 2. RENDERIZADO DINÁMICO Y SINTAXIS MODERNA (ES6+)
// ==========================================

function renderizarInventario(lista) {
    if (!contenedorProductos) return;
    contenedorProductos.innerHTML = "";

    // Uso de OPERADOR TERNARIO (?) para manejar la vista cuando el inventario está vacío
    lista.length === 0
        ? (contenedorProductos.innerHTML = `<p class="texto-vacio">No hay productos en el inventario.</p>`)
        : lista.forEach((producto) => {
              // Uso explícito de DESTRUCTURING de objetos para extraer propiedades
              const { id, nombre, precio, stock } = producto;

              // OPTIONAL CHAINING (?.) para acceso seguro a la propiedad nombre
              const nombreLimpio = producto?.nombre ?? "Producto sin nombre";

              const card = document.createElement("article");
              card.className = "card-producto";
              card.innerHTML = `
                  <div class="info-producto">
                      <h3>${nombreLimpio}</h3>
                      <p>Precio: <strong>$${precio.toLocaleString("es-AR")}</strong></p>
                      <p>Stock: <span class="badge">${stock} u.</span></p>
                  </div>
                  <button class="btn btn-eliminar" data-id="${id}">🗑️ Eliminar</button>
              `;
              contenedorProductos.appendChild(card);
          });

    actualizarResumenTotales(lista);
}

// Actualización dinámica del totalizador del presupuesto usando reduce
function actualizarResumenTotales(lista) {
    if (!resumenInventario) return;

    // Cálculo acumulado de unidades y valor monetario total
    const totalUnidades = lista.reduce((acc, prod) => acc + Number(prod?.stock ?? 0), 0);
    const valorTotal = lista.reduce((acc, prod) => acc + Number(prod?.precio ?? 0) * Number(prod?.stock ?? 0), 0);

    resumenInventario.innerHTML = `
        <p>Total de productos registrados: <strong>${lista.length}</strong></p>
        <p>Unidades en stock acumuladas: <strong>${totalUnidades}</strong></p>
        <p>Valor total estimado del inventario: <strong>$${valorTotal.toLocaleString("es-AR")}</strong></p>
    `;
}

// Feedback visual y temporal para acciones del usuario
function mostrarFeedback(mensaje, tipo = "exito") {
    if (!mensajeFeedback) return;

    mensajeFeedback.textContent = mensaje;
    // Operador Ternario para asignar la clase de estilo adecuada
    mensajeFeedback.className = tipo === "exito" ? "feedback exito" : "feedback error";
    mensajeFeedback.classList.remove("oculto");

    setTimeout(() => {
        mensajeFeedback.classList.add("oculto");
    }, 2500);
}

// ==========================================
// 3. GESTIÓN DE EVENTOS DEL USUARIO
// ==========================================

// EVENTO SUBMIT: Agregar nuevo producto al inventario
formularioProducto?.addEventListener("submit", (e) => {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const precio = parseFloat(inputPrecio.value);
    const stock = parseInt(inputStock.value);

    // Validación mediante operador ternario para flujo rápido
    if (!nombre || isNaN(precio) || isNaN(stock)) {
        mostrarFeedback("Por favor completa todos los campos correctamente.", "error");
        return;
    }

    const nuevoProducto = {
        id: Date.now(), // ID único generado dinámicamente
        nombre,
        precio,
        stock
    };

    // Actualización del array de datos
    inventario.push(nuevoProducto);

    // Persistencia y actualización de interfaz
    sincronizarStorage();
    renderizarInventario(inventario);

    // Limpieza de formulario y notificación
    formularioProducto.reset();
    mostrarFeedback(`¡Producto "${nombre}" agregado con éxito!`, "exito");
});

// EVENTO CLICK: Eliminar producto individual (Delegación de eventos)
contenedorProductos?.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-eliminar") || e.target.closest(".btn-eliminar")) {
        const boton = e.target.classList.contains("btn-eliminar") ? e.target : e.target.closest(".btn-eliminar");
        const idAEliminar = Number(boton.dataset.id);

        // Destructuring / Nullish coalescing para recuperar el nombre del objeto eliminado
        const productoEncontrado = inventario.find((p) => p.id === idAEliminar);
        const { nombre } = productoEncontrado ?? { nombre: "Producto" };

        // Filtrado del array para remover el objeto seleccionado
        inventario = inventario.filter((p) => p.id !== idAEliminar);

        // Actualización de LocalStorage y re-renderizado de la vista
        sincronizarStorage();
        renderizarInventario(inventario);

        mostrarFeedback(`Se eliminó "${nombre}" del inventario.`, "error");
    }
});

// EVENTO INPUT: Filtrado en tiempo real por búsqueda de texto
inputBusqueda?.addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase().trim();
    const productosFiltrados = inventario.filter((p) =>
        p.nombre.toLowerCase().includes(termino)
    );
    renderizarInventario(productosFiltrados);
});

// EVENTO CLICK: Vaciar completamente el inventario y LocalStorage
btnVaciar?.addEventListener("click", () => {
    // Operador ternario para confirmar acción o avisar si ya está vacío
    inventario.length === 0
        ? mostrarFeedback("El inventario ya se encuentra vacío.", "error")
        : vaciarTodoElStorage();
});

// ==========================================
// 4. INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    inventario = cargarDeStorage();
    sincronizarStorage(); // Mantiene la persistencia inicial garantizada
    renderizarInventario(inventario);
});