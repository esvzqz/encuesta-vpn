/**
 * ============================================
 * GOOGLE APPS SCRIPT - Backend VPN Encuesta
 * ============================================
 * 
 * Este código va en Google Apps Script.
 * Gestiona las respuestas del formulario VPN y sirve datos al dashboard.
 * 
 * HOJAS REQUERIDAS EN TU GOOGLE SHEET:
 *   1. "Empleados"  → columna A con los números de empleado de tu área
 *   2. "Respuestas" → se llena automáticamente con las respuestas del formulario
 * 
 * La hoja "Respuestas" tendrá las columnas:
 *   A: Timestamp | B: # Empleado | C: Tipo VPN
 */

// =============================================
// CONFIGURACIÓN
// =============================================

/**
 * Cambia este ID por el de tu Google Sheet.
 * Lo encuentras en la URL del sheet:
 * https://docs.google.com/spreadsheets/d/AQUI_ESTA_EL_ID/edit
 */
const SPREADSHEET_ID = '1jsnBLEB1rOM1x68yAj9JDh-qAJnpj21qbn--kSk0uVM';
const HOJA_EMPLEADOS = 'Empleados';  // Columnas: A=Empleado, B=Nombre
const HOJA_RESPUESTAS = 'Respuestas';

// =============================================
// MANEJO DE PETICIONES
// =============================================

/**
 * Maneja peticiones GET (dashboard solicita datos o verificación de duplicado)
 */
function doGet(e) {
  const action = e.parameter.action;

  if (action === 'dashboard') {
    return serveDashboardData();
  }

  if (action === 'check') {
    return checkEmpleado(e.parameter.empleado);
  }

  if (action === 'guardar') {
    return guardarRespuesta(e.parameter.empleado, e.parameter.vpn, e.parameter.timestamp);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ error: 'Acción no válida' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Guarda la respuesta de un empleado (llamado vía GET para evitar CORS)
 */
function guardarRespuesta(empleado, vpn, timestamp) {
  try {
    if (!empleado || !vpn) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Datos incompletos' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);

    if (!hojaResp) {
      hojaResp = ss.insertSheet(HOJA_RESPUESTAS);
      hojaResp.appendRow(['Timestamp', 'Empleado', 'VPN']);
    }

    // Verificar duplicado
    const datosExistentes = hojaResp.getDataRange().getValues();
    const yaRespondio = datosExistentes.some(row => String(row[1]) === String(empleado));

    if (!yaRespondio) {
      hojaResp.appendRow([timestamp || new Date().toISOString(), empleado, vpn]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Verifica si un empleado ya respondió
 */
function checkEmpleado(empleado) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);

  if (!hojaResp || hojaResp.getLastRow() <= 1) {
    return ContentService
      .createTextOutput(JSON.stringify({ yaRespondio: false }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const datos = hojaResp.getDataRange().getValues();
  for (let i = 1; i < datos.length; i++) {
    if (String(datos[i][1]) === String(empleado)) {
      return ContentService
        .createTextOutput(JSON.stringify({ yaRespondio: true, vpn: datos[i][2] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ yaRespondio: false }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Maneja peticiones POST (formulario envía respuesta)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const empleado = data.empleado;
    const vpn = data.vpn;
    const timestamp = data.timestamp || new Date().toISOString();

    if (!empleado || !vpn) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Datos incompletos' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Guardar respuesta
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);

    // Crear hoja de respuestas si no existe
    if (!hojaResp) {
      hojaResp = ss.insertSheet(HOJA_RESPUESTAS);
      hojaResp.appendRow(['Timestamp', 'Empleado', 'VPN']);
    }

    // Verificar si el empleado ya respondió (evitar duplicados)
    const datosExistentes = hojaResp.getDataRange().getValues();
    const yaRespondio = datosExistentes.some(row => String(row[1]) === String(empleado));

    if (yaRespondio) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, duplicado: true, message: 'Ya habías respondido anteriormente' }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      // Nueva respuesta
      hojaResp.appendRow([timestamp, empleado, vpn]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, duplicado: false, message: 'Respuesta guardada' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================
// FUNCIONES DE DATOS
// =============================================

/**
 * Sirve los datos combinados para el dashboard
 */
function serveDashboardData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Obtener lista de empleados (columnas A, B y C: número, nombre y estatus)
  const hojaEmp = ss.getSheetByName(HOJA_EMPLEADOS);
  const datosEmp = hojaEmp.getRange('A2:C' + hojaEmp.getLastRow()).getValues();
  const empleados = datosEmp
    .filter(row => String(row[0]).trim() !== '')
    .map(row => ({
      numero: String(row[0]).trim(),
      nombre: String(row[1] || '').trim(),
      estatus: String(row[2] || 'Activo').trim()
    }));

  // Obtener respuestas
  const hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);
  let respuestas = {};

  if (hojaResp && hojaResp.getLastRow() > 1) {
    const datosResp = hojaResp.getRange(2, 1, hojaResp.getLastRow() - 1, 3).getValues();
    datosResp.forEach(row => {
      const emp = String(row[1]).trim();
      if (emp) {
        respuestas[emp] = {
          fecha: formatDate(row[0]),
          vpn: row[2]
        };
      }
    });
  }

  // Combinar datos
  const empleadosData = empleados.map(emp => {
    const resp = respuestas[emp.numero];
    return {
      empleado: emp.numero,
      nombre: emp.nombre,
      estatus: emp.estatus,
      status: resp ? 'respondido' : 'pendiente',
      vpn: resp ? resp.vpn : '-',
      fecha: resp ? resp.fecha : '-'
    };
  });

  // Estadísticas
  const total = empleados.length;
  const activos = empleadosData.filter(e => e.estatus === 'Activo').length;
  const bajas = empleadosData.filter(e => e.estatus === 'Baja').length;
  const respondidos = empleadosData.filter(e => e.status === 'respondido').length;
  const pendientes = total - respondidos;
  const vpn1 = empleadosData.filter(e => e.vpn === 'CISCO_ANYCONNECT').length;
  const vpn2 = empleadosData.filter(e => e.vpn === 'GLOBALPROTECT').length;
  const ambas = empleadosData.filter(e => e.vpn === 'AMBAS').length;
  const sinVpn = empleadosData.filter(e => e.vpn === 'SIN_VPN').length;

  const result = {
    total: total,
    activos: activos,
    bajas: bajas,
    respondidos: respondidos,
    pendientes: pendientes,
    vpn1: vpn1,
    vpn2: vpn2,
    ambas: ambas,
    sinVpn: sinVpn,
    empleados: empleadosData
  };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Formatea una fecha para mostrar
 */
function formatDate(date) {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return String(date);
  }
}

// =============================================
// FUNCIÓN DE PRUEBA (ejecutar desde el editor)
// =============================================

/**
 * Función para probar que todo funciona.
 * Ejecútala desde el editor de Apps Script para verificar la conexión.
 */
function test() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hojaEmp = ss.getSheetByName(HOJA_EMPLEADOS);

  if (!hojaEmp) {
    Logger.log('❌ ERROR: No se encontró la hoja "Empleados". Créala y agrega los números en la columna A.');
    return;
  }

  const empleados = hojaEmp.getRange('A2:B' + hojaEmp.getLastRow()).getValues().filter(e => String(e[0]).trim() !== '');
  Logger.log('✅ Hoja encontrada. Empleados registrados: ' + empleados.length);
  Logger.log('Primeros 5: ' + empleados.slice(0, 5).map(e => e[0] + ' - ' + e[1]).join(', '));

  const hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);
  if (hojaResp) {
    const respuestas = hojaResp.getLastRow() - 1;
    Logger.log('✅ Hoja de respuestas encontrada. Respuestas: ' + respuestas);
  } else {
    Logger.log('ℹ️ Hoja de respuestas aún no existe (se creará con la primera respuesta)');
  }
}
