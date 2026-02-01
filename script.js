const DB_MATERIALES = {
  PLA: 0.06,
  PETG: 0.07,
  TPU: 0.1,
  SEDA: 0.09,
};

const CONFIG = {
  setup: 3.5,
  comisionWeb: 0.1,
  margenBeneficio: 0.5, // 50% de margen (multiplicador 1.5)
  costeHora: 0.15, // Luz + amortización (basado en el segundo ejemplo)
};

/**
 * Calculadora de Presupuesto Impresión 3D
 */
function calcularPrecio3D(
  gramos,
  horas,
  tipoMat = "PLA",
  esComplejo = false,
  costeDiseno = 0,
) {
  // 1. Cálculo de Coste de Producción Directo
  const precioGramo = DB_MATERIALES[tipoMat] || 0.06;
  const costeMaterial = gramos * precioGramo;
  const costeMaquina = horas * CONFIG.costeHora;
  const subtotalProduccion = CONFIG.setup + costeMaterial + costeMaquina;

  // 2. Aplicación de Factor de Riesgo
  const riesgoFactor = esComplejo ? 1.25 : 1.15;
  const costeConRiesgo = subtotalProduccion * riesgoFactor;

  // 3. Aplicación de Margen de Beneficio y Servicio de Diseño
  const precioAntesDeComision =
    costeConRiesgo * (1 + CONFIG.margenBeneficio) + costeDiseno;

  // 4. Cálculo del Precio Final para cubrir la Comisión del 10%
  const precioFinal = precioAntesDeComision / (1 - CONFIG.comisionWeb);

  return {
    precioSugerido: precioFinal.toFixed(2),
    costeProduccion: subtotalProduccion.toFixed(2),
    material: costeMaterial.toFixed(2),
    maquina: costeMaquina.toFixed(2),
    comision: (precioFinal * CONFIG.comisionWeb).toFixed(2),
    margenBruto: (
      precioFinal -
      subtotalProduccion -
      precioFinal * CONFIG.comisionWeb
    ).toFixed(2),
  };
}

// UI Interactions
const inputs = ["gramos", "horas", "material", "esComplejo", "costeDiseno"];
const outputs = {
  precioFinal: document.getElementById("precioFinal"),
  costeProduccion: document.getElementById("costeProduccion"),
  desgloseMaterial: document.getElementById("desgloseMaterial"),
  desgloseMaquina: document.getElementById("desgloseMaquina"),
  comisionWeb: document.getElementById("comisionWeb"),
  margenBruto: document.getElementById("margenBruto"),
};

function updateCalculations() {
  const gramos = parseFloat(document.getElementById("gramos").value) || 0;
  const horas = parseFloat(document.getElementById("horas").value) || 0;
  const material = document.getElementById("material").value;
  const esComplejo = document.getElementById("esComplejo").checked;
  const costeDiseno =
    parseFloat(document.getElementById("costeDiseno").value) || 0;

  // Update complexity label
  document.getElementById("complejidad-label").textContent = esComplejo
    ? "Pieza Compleja"
    : "Pieza Estándar";

  const results = calcularPrecio3D(
    gramos,
    horas,
    material,
    esComplejo,
    costeDiseno,
  );

  // Update DOM
  outputs.precioFinal.textContent = `${results.precioSugerido}€`;
  outputs.costeProduccion.textContent = `${results.costeProduccion}€`;
  outputs.desgloseMaterial.textContent = `${results.material}€`;
  outputs.desgloseMaquina.textContent = `${results.maquina}€`;
  outputs.comisionWeb.textContent = `${results.comision}€`;
  outputs.margenBruto.textContent = `${results.margenBruto}€`;
}

// Add event listeners
inputs.forEach((id) => {
  document.getElementById(id).addEventListener("input", updateCalculations);
});

// Initial calculation
updateCalculations();
