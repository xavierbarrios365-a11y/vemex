
/**
 * MetalApp Backend - Versión Industrial Avanzada
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

function doGet(e) {
  const action = e.parameter.action;
  try {
    switch (action) {
      case 'getKPIs': return jsonResp(getKPIs());
      case 'getMateriales': return jsonResp(getDataMateriales());
      case 'getProyectos': return jsonResp(getDataProyectos());
      case 'getClientes': return jsonResp(getClientes());
      case 'getMovimientos': return jsonResp(getMovimientos());
      default: return jsonResp({ error: 'Acción no válida' });
    }
  } catch (err) {
    return jsonResp({ error: err.toString() });
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;
    const data = contents.data;
    let result;

    switch (action) {
      case 'agregarNuevoMaterial': result = agregarNuevoMaterial(data); break;
      case 'actualizarMaterial': result = actualizarMaterial(data); break;
      case 'eliminarMaterial': result = eliminarMaterial(data); break;
      case 'registrarMovimiento': result = registrarMovimiento(data); break;
      case 'actualizarEstatusProyecto': result = actualizarEstatusProyecto(data); break;
      case 'agregarNuevoProyecto': result = agregarNuevoProyecto(data); break;
      case 'guardarCotizacion': result = guardarCotizacionCompleta(data); break;
      default: result = { success: false, message: 'Acción desconocida: ' + action };
    }
    return jsonResp(result);
  } catch (err) {
    return jsonResp({ success: false, message: err.toString() });
  }
}

function jsonResp(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// --- LECTURA ---
function getKPIs() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();
  const cVals = ss.getSheetByName("BD_CLIENTES").getDataRange().getValues();
  const porCobrar = cVals.slice(1).reduce((acc, r) => acc + (Number(r[6]) || 0), 0);
  const pVals = ss.getSheetByName("BD_PROYECTOS").getDataRange().getValues();
  let activos = 0, retrasos = 0;
  pVals.slice(1).forEach(r => {
    if (r[5] !== "Terminado" && r[5] !== "") {
      activos++;
      const fE = r[4] instanceof Date ? r[4] : new Date(r[4]);
      if (fE < now && r[4] !== "") retrasos++;
    }
  });
  const fVals = ss.getSheetByName("BD_FINANZAS").getDataRange().getValues();
  const gastosMes = fVals.slice(1).reduce((acc, r) => {
    const f = r[1] instanceof Date ? r[1] : new Date(r[1]);
    const t = (r[2] || "").toString().toLowerCase();
    if ((t === "egreso" || t === "gasto") && f.getMonth() === now.getMonth()) return acc + (Number(r[4]) || 0);
    return acc;
  }, 0);
  const mVals = ss.getSheetByName("BD_MATERIALES").getDataRange().getValues();
  const stockCritico = mVals.slice(1).filter(r => (Number(r[6]) || 0) <= (Number(r[5]) || 0)).length;

  return { porCobrar, proyectosActivos: activos, gastosMes, retrasosCriticos: retrasos, stockBajoCount: stockCritico };
}

function getDataMateriales() {
  const vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES").getDataRange().getValues();
  return vals.slice(1).map(r => ({
    id: r[0].toString(), name: r[1], category: (r[2] || "otros").toLowerCase(), unit: r[3],
    price: Number(r[4]) || 0, stockVal: Number(r[6]) || 0, stockMin: Number(r[5]) || 0,
    stock: Number(r[6]) <= Number(r[5]) ? (Number(r[6]) <= 0 ? 'none' : 'low') : 'high',
    image: `https://picsum.photos/seed/${r[0]}/200/200`
  }));
}

function getDataProyectos() {
  const vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS").getDataRange().getValues();
  return vals.slice(1).map(r => ({
    id: r[0].toString(), name: r[2], client: "Cliente " + r[1], dueDate: r[4], status: r[5] || "Por Cotizar",
    type: r[6] || "METAL"
  }));
}

function getClientes() {
  const vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_CLIENTES").getDataRange().getValues();
  return vals.slice(1).map(r => ({ id: r[0], name: r[1], phone: r[2] || "S/T", balance: Number(r[6]) || 0 }));
}

function getMovimientos() {
  const vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_FINANZAS").getDataRange().getValues();
  return vals.slice(1).reverse().slice(0, 15).map(r => ({
    id: r[0], date: r[1], description: r[3], amount: Number(r[4]) || 0, type: (r[2] || "").toString().toLowerCase() === "ingreso" ? "income" : "expense"
  }));
}

// --- ESCRITURA ---
function guardarCotizacionCompleta(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const shCabecera = ss.getSheetByName("BD_COTIZACIONES");
  const shDetalle = ss.getSheetByName("DETALLE_COTIZACION");
  
  const idCot = "COT-" + Date.now();
  const fecha = new Date();
  
  // 1. Guardar Cabecera: ID_COT, ID_CLIENTE, TIPO_TRABAJO, FECHA, VIGENCIA, SUB_MAT, MO, EXTRAS, TOTAL, ESTADO
  shCabecera.appendRow([
    idCot, 
    data.clienteId || "VAR-001", 
    data.tipoTrabajo || "No Especificado",
    fecha, 
    15, // días vigencia
    data.subtotalMateriales, 
    data.manoObra, 
    data.gastosExtra, 
    data.totalFinal, 
    "Pendiente"
  ]);
  
  // 2. Guardar Detalles: ID_DETALLE, ID_COTIZACION, ID_MATERIAL, CANTIDAD, PRECIO_VIGENTE, TOTAL_LINEA
  data.partidas.forEach((p, idx) => {
    shDetalle.appendRow([
      `${idCot}-D${idx+1}`,
      idCot,
      p.idMaterial,
      p.cantidad,
      p.precioUnitario,
      p.totalLinea
    ]);
  });
  
  return { success: true, id: idCot };
}

function actualizarMaterial(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
  const vals = sheet.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString() === data.id.toString()) {
      sheet.getRange(i + 1, 2, 1, 6).setValues([[data.nombre, data.categoria, data.unidad, data.precio, data.stockMin || 5, data.stock]]);
      return { success: true };
    }
  }
  return { success: false };
}

function actualizarEstatusProyecto(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS");
  const vals = sheet.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString() === data.id.toString()) {
      sheet.getRange(i + 1, 6).setValue(data.nuevoEstatus);
      return { success: true };
    }
  }
  return { success: false };
}

function registrarMovimiento(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_FINANZAS");
  sheet.appendRow(["FIN-" + Date.now(), new Date(), data.tipo, data.concepto, data.monto, "Efectivo", 0]);
  return { success: true };
}

function agregarNuevoMaterial(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
  sheet.appendRow(["MAT-" + Date.now(), data.nombre, data.categoria, data.unidad, data.precio, 5, data.stock]);
  return { success: true };
}

function eliminarMaterial(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
  const vals = sheet.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0].toString() === data.id.toString()) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'Material no encontrado' };
}

function agregarNuevoProyecto(data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS");
  const id = "PRY-" + Date.now();
  sheet.appendRow([
    id,
    data.clienteId || "VAR-001",
    data.nombre,
    new Date(),
    data.fechaEntrega ? new Date(data.fechaEntrega) : "",
    data.estatus || "Por Cotizar",
    data.tipo || "METAL"
  ]);
  return { success: true, id: id };
}
