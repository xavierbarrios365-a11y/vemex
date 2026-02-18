
/**
 * ═══════════════════════════════════════════════════════════════
 *  VEMEX Backend — Versión Industrial Segura v2.0
 * ═══════════════════════════════════════════════════════════════
 *  Seguridad: Token de acceso + Validación de datos + LockService
 * ═══════════════════════════════════════════════════════════════
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ─── TOKEN DE SEGURIDAD ──────────────────────────────────────
// Cambia este token y colócalo también en tu .env del frontend
const API_TOKEN = "vemex-sec-2026-xK9mP4qR7tL2";

function verificarToken(e) {
  // En modo GAS embebido (iframe), no hay token — siempre autorizado
  if (!e || !e.parameter) return true;
  
  const token = e.parameter.token || "";
  if (token === API_TOKEN) return true;
  
  // Para POST, también verificar en el body
  if (e.postData) {
    try {
      const body = JSON.parse(e.postData.contents);
      if (body.token === API_TOKEN) return true;
    } catch(err) {}
  }
  
  return false;
}

// ─── VALIDACIÓN HELPERS ──────────────────────────────────────
function validar(data, reglas) {
  if (!data || typeof data !== 'object') return 'Datos inválidos: se esperaba un objeto';
  
  for (var i = 0; i < reglas.length; i++) {
    var r = reglas[i];
    var campo = r.campo;
    var valor = data[campo];
    
    if (r.requerido && (valor === undefined || valor === null || valor === '')) {
      return 'Campo requerido: ' + campo;
    }
    
    if (r.tipo === 'numero' && valor !== undefined && valor !== '' && valor !== null) {
      var num = Number(valor);
      if (isNaN(num)) return campo + ' debe ser un número válido';
      if (r.min !== undefined && num < r.min) return campo + ' debe ser mayor o igual a ' + r.min;
      if (r.max !== undefined && num > r.max) return campo + ' debe ser menor o igual a ' + r.max;
    }
    
    if (r.tipo === 'texto' && valor !== undefined && valor !== '' && valor !== null) {
      if (typeof valor !== 'string' || valor.trim().length === 0) return campo + ' debe ser texto válido';
      if (r.maxLen && valor.length > r.maxLen) return campo + ' excede el máximo de ' + r.maxLen + ' caracteres';
    }
    
    if (r.tipo === 'array' && r.requerido) {
      if (!Array.isArray(valor) || valor.length === 0) return campo + ' debe contener al menos un elemento';
    }
  }
  
  return null; // sin errores
}

// ─── ID ÚNICO (anti-colisión) ────────────────────────────────
function uid(prefijo) {
  return prefijo + Date.now() + "-" + Math.random().toString(36).substr(2, 4);
}

// ─── LOCK PARA ESCRITURA ─────────────────────────────────────
function conLock(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // espera hasta 10s
    var resultado = fn();
    return resultado;
  } catch (e) {
    return { success: false, message: 'Servidor ocupado, intenta de nuevo: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}

// ─── RUTAS HTTP ──────────────────────────────────────────────
function doGet(e) {
  if (!verificarToken(e)) {
    return jsonResp({ error: 'No autorizado. Token inválido.' });
  }
  
  var action = e.parameter.action;
  try {
    switch (action) {
      case 'getKPIs': return jsonResp(getKPIs());
      case 'getMateriales': return jsonResp(getDataMateriales());
      case 'getProyectos': return jsonResp(getDataProyectos());
      case 'getClientes': return jsonResp(getClientes());
      case 'getMovimientos': return jsonResp(getMovimientos());
      case 'getCotizaciones': return jsonResp(getCotizaciones());
      default: return jsonResp({ error: 'Acción no válida' });
    }
  } catch (err) {
    return jsonResp({ error: err.toString() });
  }
}

function doPost(e) {
  if (!verificarToken(e)) {
    return jsonResp({ success: false, message: 'No autorizado. Token inválido.' });
  }
  
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var data = contents.data;
    var result;

    switch (action) {
      case 'agregarNuevoMaterial': result = agregarNuevoMaterial(data); break;
      case 'actualizarMaterial': result = actualizarMaterial(data); break;
      case 'eliminarMaterial': result = eliminarMaterial(data); break;
      case 'registrarMovimiento': result = registrarMovimiento(data); break;
      case 'actualizarEstatusProyecto': result = actualizarEstatusProyecto(data); break;
      case 'agregarNuevoProyecto': result = agregarNuevoProyecto(data); break;
      case 'eliminarProyecto': result = eliminarProyecto(data); break;
      case 'guardarCotizacion': result = guardarCotizacionCompleta(data); break;
      case 'actualizarEstatusCotizacion': result = actualizarEstatusCotizacion(data); break;
      case 'eliminarCotizacion': result = eliminarCotizacion(data); break;
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

// ═══════════════════════════════════════════════════════════════
//  LECTURA (sin lock, sin validación — solo consultas)
// ═══════════════════════════════════════════════════════════════

function getKPIs() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var now = new Date();
  var cVals = ss.getSheetByName("BD_CLIENTES").getDataRange().getValues();
  var porCobrar = cVals.slice(1).reduce(function(acc, r) { return acc + (Number(r[6]) || 0); }, 0);
  var pVals = ss.getSheetByName("BD_PROYECTOS").getDataRange().getValues();
  var activos = 0, retrasos = 0;
  pVals.slice(1).forEach(function(r) {
    if (r[5] !== "Terminado" && r[5] !== "") {
      activos++;
      var fE = r[4] instanceof Date ? r[4] : new Date(r[4]);
      if (fE < now && r[4] !== "") retrasos++;
    }
  });
  var fVals = ss.getSheetByName("BD_FINANZAS").getDataRange().getValues();
  var gastosMes = fVals.slice(1).reduce(function(acc, r) {
    var f = r[1] instanceof Date ? r[1] : new Date(r[1]);
    var t = (r[2] || "").toString().toLowerCase();
    if ((t === "egreso" || t === "gasto") && f.getMonth() === now.getMonth()) return acc + (Number(r[4]) || 0);
    return acc;
  }, 0);
  var mVals = ss.getSheetByName("BD_MATERIALES").getDataRange().getValues();
  var stockCritico = mVals.slice(1).filter(function(r) { return (Number(r[6]) || 0) <= (Number(r[5]) || 0); }).length;

  // Cotizaciones metrics
  var cotizacionesActivas = 0, valorCotizaciones = 0;
  try {
    var cotSheet = ss.getSheetByName("BD_COTIZACIONES");
    if (cotSheet) {
      var cotVals = cotSheet.getDataRange().getValues();
      cotVals.slice(1).forEach(function(r) {
        if (r[9] === 'Pendiente' || r[9] === 'Aprobada') {
          cotizacionesActivas++;
          valorCotizaciones += Number(r[8]) || 0;
        }
      });
    }
  } catch(e) {}

  return { porCobrar: porCobrar, proyectosActivos: activos, gastosMes: gastosMes, retrasosCriticos: retrasos, stockBajoCount: stockCritico, cotizacionesActivas: cotizacionesActivas, valorCotizaciones: valorCotizaciones };
}

function getDataMateriales() {
  var vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES").getDataRange().getValues();
  return vals.slice(1).map(function(r) {
    return {
      id: r[0].toString(), name: r[1], category: (r[2] || "otros").toLowerCase(), unit: r[3],
      price: Number(r[4]) || 0, stockVal: Number(r[6]) || 0, stockMin: Number(r[5]) || 0,
      stock: Number(r[6]) <= Number(r[5]) ? (Number(r[6]) <= 0 ? 'none' : 'low') : 'high',
      image: "https://picsum.photos/seed/" + r[0] + "/200/200"
    };
  });
}

function getDataProyectos() {
  var vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS").getDataRange().getValues();
  return vals.slice(1).map(function(r) {
    return {
      id: r[0].toString(), name: r[2], client: "Cliente " + r[1], dueDate: r[4], status: r[5] || "Por Cotizar",
      type: r[6] || "METAL"
    };
  });
}

function getClientes() {
  var vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_CLIENTES").getDataRange().getValues();
  return vals.slice(1).map(function(r) { return { id: r[0], name: r[1], phone: r[2] || "S/T", balance: Number(r[6]) || 0 }; });
}

function getMovimientos() {
  var vals = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_FINANZAS").getDataRange().getValues();
  return vals.slice(1).reverse().slice(0, 15).map(function(r) {
    return {
      id: r[0], date: r[1], description: r[3], amount: Number(r[4]) || 0,
      type: (r[2] || "").toString().toLowerCase() === "ingreso" ? "income" : "expense"
    };
  });
}

function getCotizaciones() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var shCot = ss.getSheetByName("BD_COTIZACIONES");
  if (!shCot) return [];
  var vals = shCot.getDataRange().getValues();
  var clientMap = {};
  try {
    var cVals = ss.getSheetByName("BD_CLIENTES").getDataRange().getValues();
    cVals.slice(1).forEach(function(r) { clientMap[r[0]] = r[1]; });
  } catch(e) {}
  return vals.slice(1).reverse().map(function(r) {
    return {
      id: r[0], clienteId: r[1],
      clienteNombre: clientMap[r[1]] || r[1] || 'Cliente Particular',
      tipoTrabajo: r[2] || 'No especificado',
      fecha: r[3] instanceof Date ? r[3].toISOString() : String(r[3]),
      vigencia: r[4],
      subtotalMateriales: Number(r[5]) || 0, manoObra: Number(r[6]) || 0,
      extras: Number(r[7]) || 0, total: Number(r[8]) || 0,
      estado: r[9] || 'Pendiente'
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  ESCRITURA (con validación + LockService)
// ═══════════════════════════════════════════════════════════════

function guardarCotizacionCompleta(data) {
  var err = validar(data, [
    { campo: 'tipoTrabajo', requerido: true, tipo: 'texto' },
    { campo: 'subtotalMateriales', requerido: true, tipo: 'numero', min: 0 },
    { campo: 'manoObra', requerido: true, tipo: 'numero', min: 0 },
    { campo: 'totalFinal', requerido: true, tipo: 'numero', min: 0 },
    { campo: 'partidas', requerido: true, tipo: 'array' }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var shCabecera = ss.getSheetByName("BD_COTIZACIONES");
    var shDetalle = ss.getSheetByName("DETALLE_COTIZACION");
    
    var idCot = uid("COT-");
    var fecha = new Date();
    
    shCabecera.appendRow([
      idCot,
      data.clienteId || "VAR-001",
      data.tipoTrabajo,
      fecha,
      15,
      Number(data.subtotalMateriales) || 0,
      Number(data.manoObra) || 0,
      Number(data.gastosExtra) || 0,
      Number(data.totalFinal) || 0,
      "Pendiente"
    ]);
    
    if (shDetalle && Array.isArray(data.partidas)) {
      data.partidas.forEach(function(p, idx) {
        shDetalle.appendRow([
          idCot + "-D" + (idx + 1),
          idCot,
          p.idMaterial || 'SIN_ASIGNAR',
          Number(p.cantidad) || 0,
          Number(p.precioUnitario) || 0,
          Number(p.totalLinea) || 0
        ]);
      });
    }
    
    return { success: true, id: idCot };
  });
}

function actualizarMaterial(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' },
    { campo: 'nombre', requerido: true, tipo: 'texto', maxLen: 100 },
    { campo: 'precio', requerido: true, tipo: 'numero', min: 0, max: 9999999 },
    { campo: 'stock', requerido: true, tipo: 'numero', min: 0 }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.getRange(i + 1, 2, 1, 6).setValues([[data.nombre, data.categoria || 'otros', data.unidad || 'Pza', Number(data.precio), Number(data.stockMin) || 5, Number(data.stock)]]);
        return { success: true };
      }
    }
    return { success: false, message: 'Material no encontrado: ' + data.id };
  });
}

function actualizarEstatusProyecto(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' },
    { campo: 'nuevoEstatus', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  var estatusValidos = ['Por Cotizar', 'En Producción', 'Terminado'];
  if (estatusValidos.indexOf(data.nuevoEstatus) === -1) {
    return { success: false, message: 'Estatus no válido. Opciones: ' + estatusValidos.join(', ') };
  }

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.getRange(i + 1, 6).setValue(data.nuevoEstatus);
        return { success: true };
      }
    }
    return { success: false, message: 'Proyecto no encontrado' };
  });
}

function registrarMovimiento(data) {
  var err = validar(data, [
    { campo: 'monto', requerido: true, tipo: 'numero', min: 0.01, max: 99999999 },
    { campo: 'concepto', requerido: true, tipo: 'texto', maxLen: 200 },
    { campo: 'tipo', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  var tiposValidos = ['Egreso', 'Ingreso'];
  if (tiposValidos.indexOf(data.tipo) === -1) {
    return { success: false, message: 'Tipo no válido. Opciones: Egreso, Ingreso' };
  }

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_FINANZAS");
    sheet.appendRow([uid("FIN-"), new Date(), data.tipo, data.concepto.trim(), Number(data.monto), "Efectivo", 0]);
    return { success: true };
  });
}

function agregarNuevoMaterial(data) {
  var err = validar(data, [
    { campo: 'nombre', requerido: true, tipo: 'texto', maxLen: 100 },
    { campo: 'precio', requerido: true, tipo: 'numero', min: 0, max: 9999999 },
    { campo: 'stock', requerido: true, tipo: 'numero', min: 0 }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
    var id = uid("MAT-");
    sheet.appendRow([id, data.nombre.trim(), data.categoria || 'otros', data.unidad || 'Pza', Number(data.precio), 5, Number(data.stock)]);
    return { success: true, id: id };
  });
}

function eliminarMaterial(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_MATERIALES");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Material no encontrado' };
  });
}

function agregarNuevoProyecto(data) {
  var err = validar(data, [
    { campo: 'nombre', requerido: true, tipo: 'texto', maxLen: 150 }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS");
    var id = uid("PRY-");
    sheet.appendRow([
      id,
      data.clienteId || "VAR-001",
      data.nombre.trim(),
      new Date(),
      data.fechaEntrega ? new Date(data.fechaEntrega) : "",
      data.estatus || "Por Cotizar",
      data.tipo || "METAL"
    ]);
    return { success: true, id: id };
  });
}

function eliminarProyecto(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_PROYECTOS");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Proyecto no encontrado' };
  });
}

function actualizarEstatusCotizacion(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' },
    { campo: 'nuevoEstado', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  var estadosValidos = ['Pendiente', 'Aprobada', 'Rechazada', 'Vencida'];
  if (estadosValidos.indexOf(data.nuevoEstado) === -1) {
    return { success: false, message: 'Estado no válido. Opciones: ' + estadosValidos.join(', ') };
  }

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_COTIZACIONES");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.getRange(i + 1, 10).setValue(data.nuevoEstado);
        return { success: true };
      }
    }
    return { success: false, message: 'Cotización no encontrada' };
  });
}

function eliminarCotizacion(data) {
  var err = validar(data, [
    { campo: 'id', requerido: true, tipo: 'texto' }
  ]);
  if (err) return { success: false, message: err };

  return conLock(function() {
    var sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("BD_COTIZACIONES");
    var vals = sheet.getDataRange().getValues();
    for (var i = 1; i < vals.length; i++) {
      if (vals[i][0].toString() === data.id.toString()) {
        sheet.deleteRow(i + 1);
        return { success: true };
      }
    }
    return { success: false, message: 'Cotización no encontrada' };
  });
}
