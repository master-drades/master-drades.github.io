const DB_MATERIALES = {
    "PLA": 0.022,
    "PETG": 0.022,
    "TPU": 0.1,
    "SEDA": 0.09,
};

const CONFIG = {
    comisionWeb: 0.10,
    comisionArte: 0.05,
    iva: 0.21,
    irpf: 0.20,
    margenBeneficio: 0.50, // 50% de margen (multiplicador 1.5)
    costeHora: 0.15,       // Luz + amortización
    // preciosSetup: {
    //     pequena: 0.00,     // < 50g
    //     mediana: 0.00,     // 50g - 250g
    //     grande: 0.00       // > 250g
    // },
    preciosSetup: {
        pequena: 1.00,     // < 50g
        mediana: 2.50,     // 50g - 250g
        grande: 5.00       // > 250g
    },
    penalizacionColor: 1.50 // Por cada color extra (a partir del segundo)
};

/**
 * Calculadora de Presupuesto Impresión 3D Refinada
 */
function calcularPrecio3D(gramos, horas, tipoMat = "PLA", esComplejo = false, costeDiseno = 0, colores = 1, redondear = true) {
    // 1. Cálculo de Coste de Producción Directo
    const precioGramo = DB_MATERIALES[tipoMat] || 0.022;
    const costeMaterial = gramos * precioGramo;
    const costeMaquina = horas * CONFIG.costeHora;
    
    // Setup dinámico según peso
    let setupReal = CONFIG.preciosSetup.pequena;
    let setupLabel = "Pequeña";

    if (gramos >= 50 && gramos <= 250) {
        setupReal = CONFIG.preciosSetup.mediana;
        setupLabel = "Mediana";
    }
    if (gramos > 250) {
        setupReal = CONFIG.preciosSetup.grande;
        setupLabel = "Grande";
    }
    
    // Penalización por purgas multicolor
    const penalizacionMulticolor = (colores > 1) ? (colores - 1) * CONFIG.penalizacionColor : 0;
    
    const subtotalProduccion = setupReal + penalizacionMulticolor + costeMaterial + costeMaquina;

    // 2. Aplicación de Factor de Riesgo
    const riesgoFactor = esComplejo ? 1.25 : 1.0;
    const costeConRiesgo = subtotalProduccion * riesgoFactor;
    const plusRiesgo = costeConRiesgo - subtotalProduccion;

    // 3. Aplicación de Margen de Beneficio y Servicio de Diseño
    const precioAntesDeComision = costeConRiesgo * (1 + CONFIG.margenBeneficio) + costeDiseno;

    // 4. Cálculo de la Base Imponible (cubriendo comisiones)
    const totalComision = CONFIG.comisionWeb + CONFIG.comisionArte;
    let baseImponible = precioAntesDeComision / (1 - totalComision);

    // 5. Cálculo de PVP provisional y Redondeo
    let pvp = baseImponible * (1 + CONFIG.iva);

    // 6. Redondeo de Marketing (si está activo)
    if (redondear) {
        pvp = Math.ceil(pvp * 2) / 2;
        // Recalcular Base Imponible para mantener consistencia (PVP = Base + IVA)
        baseImponible = pvp / (1 + CONFIG.iva);
    }

    // 7. Recálculo de desgloses finales
    const cantidadIva = baseImponible * CONFIG.iva;
    const cantidadIrpf = baseImponible * CONFIG.irpf;
    
    return {
        pvp: pvp.toFixed(2),
        baseImponible: baseImponible.toFixed(2),
        costeReal: subtotalProduccion.toFixed(2),
        plusRiesgo: plusRiesgo.toFixed(2),
        costeProduccion: costeConRiesgo.toFixed(2),
        material: costeMaterial.toFixed(2),
        maquina: costeMaquina.toFixed(2),
        setup: setupReal.toFixed(2),
        setupLabel: setupLabel,
        purga: penalizacionMulticolor.toFixed(2),
        comisionWeb: (baseImponible * CONFIG.comisionWeb).toFixed(2),
        comisionArte: (baseImponible * CONFIG.comisionArte).toFixed(2),
        iva: cantidadIva.toFixed(2),
        irpf: cantidadIrpf.toFixed(2),
        margenBruto: (baseImponible - subtotalProduccion - (baseImponible * totalComision)).toFixed(2)
    };
}

// UI Interactions
const inputs = ["gramos", "horas", "material", "colores", "esComplejo", "costeDiseno", "redondear"];
const outputs = {
    precioFinal: document.getElementById("precioFinal"),
    baseImponible: document.getElementById("baseImponible"),
    iva: document.getElementById("iva"),
    irpf: document.getElementById("irpf"),
    costeReal: document.getElementById("costeReal"),
    plusRiesgo: document.getElementById("plusRiesgo"),
    desgloseMaterial: document.getElementById("desgloseMaterial"),
    desgloseMaquina: document.getElementById("desgloseMaquina"),
    comisionWeb: document.getElementById("comisionWeb"),
    comisionArte: document.getElementById("comisionArte"),
    margenBruto: document.getElementById("margenBruto"),
    rowRiesgo: document.getElementById("row-riesgo"),
    precioBaseLabel: document.getElementById("precioBaseLabel"),
    precioBaseVal: document.getElementById("precioBaseVal"),
};

function updateCalculations() {
    const gramos = parseFloat(document.getElementById("gramos").value) || 0;
    const horas = parseFloat(document.getElementById("horas").value) || 0;
    const material = document.getElementById("material").value;
    const colores = parseInt(document.getElementById("colores").value) || 1;
    const esComplejo = document.getElementById("esComplejo").checked;
    const costeDiseno = parseFloat(document.getElementById("costeDiseno").value) || 0;
    const redondear = document.getElementById("redondear").checked;

    // Update complexity label
    document.getElementById("complejidad-label").textContent = esComplejo ? "Pieza Compleja" : "Pieza Estándar";
    
    // Toggle risk row visibility
    outputs.rowRiesgo.style.display = esComplejo ? "flex" : "none";

    const results = calcularPrecio3D(gramos, horas, material, esComplejo, costeDiseno, colores, redondear);

    // Update DOM
    outputs.precioFinal.textContent = `${results.pvp}€`; // Large main price is now PVP
    outputs.baseImponible.textContent = `${results.baseImponible}€`;
    outputs.iva.textContent = `${results.iva}€`;
    outputs.irpf.textContent = `${results.irpf}€`;
    outputs.costeReal.textContent = `${results.costeReal}€`;
    outputs.plusRiesgo.textContent = `${results.plusRiesgo}€`;
    outputs.desgloseMaterial.textContent = `${results.material}€`;
    outputs.desgloseMaquina.textContent = `${results.maquina}€`;
    outputs.comisionWeb.textContent = `${results.comisionWeb}€`;
    outputs.comisionArte.textContent = `${results.comisionArte}€`;
    outputs.margenBruto.textContent = `${results.margenBruto}€`;
    
    // New Setup Row
    outputs.precioBaseLabel.textContent = `Precio Base (${results.setupLabel})`;
    outputs.precioBaseVal.textContent = `${results.setup}€`;
}

// Add event listeners
inputs.forEach((id) => {
    document.getElementById(id).addEventListener("input", updateCalculations);
});

// Initial calculation
updateCalculations();
