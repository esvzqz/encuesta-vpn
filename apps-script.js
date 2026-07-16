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
  const respondidos = empleadosData.filter(e => e.status === 'respondido' && e.estatus === 'Activo').length;
  const pendientes = empleadosData.filter(e => e.status === 'pendiente' && e.estatus === 'Activo').length;
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

  const empleados = hojaEmp.getRange('A2:C' + hojaEmp.getLastRow()).getValues().filter(e => String(e[0]).trim() !== '');
  Logger.log('✅ Hoja encontrada. Empleados registrados: ' + empleados.length);
  Logger.log('Primeros 5: ' + empleados.slice(0, 5).map(e => e[0] + ' - ' + e[1] + ' - ' + e[2]).join(', '));

  const hojaResp = ss.getSheetByName(HOJA_RESPUESTAS);
  if (hojaResp) {
    const respuestas = hojaResp.getLastRow() - 1;
    Logger.log('✅ Hoja de respuestas encontrada. Respuestas: ' + respuestas);
  } else {
    Logger.log('ℹ️ Hoja de respuestas aún no existe (se creará con la primera respuesta)');
  }
}

// =============================================
// FUNCIÓN PARA POBLAR COLUMNA C (ESTATUS)
// Ejecutar UNA SOLA VEZ desde el editor
// =============================================

/**
 * Pobla la columna C de la hoja "Empleados" con el estatus (Activo/Baja).
 * Ejecuta esta función UNA VEZ desde el editor de Apps Script.
 * Después puedes borrarla o dejarla comentada.
 */
function poblarEstatus() {
  // Mapa: número de empleado → estatus
  const estatusMap = {
    '60095235': 'Activo',
    '60095206': 'Activo',
    '1214640': 'Activo',
    '1210310': 'Activo',
    '1204670': 'Activo',
    '60094580': 'Baja',
    '1199518': 'Activo',
    '1195777': 'Activo',
    '60093674': 'Activo',
    '60093669': 'Activo',
    '60093417': 'Activo',
    '60093409': 'Activo',
    '60093407': 'Activo',
    '1182215': 'Activo',
    '60093328': 'Activo',
    '60093320': 'Activo',
    '60093334': 'Activo',
    '60093321': 'Activo',
    '60058195': 'Activo',
    '60093228': 'Activo',
    '60093221': 'Activo',
    '60093223': 'Activo',
    '60093165': 'Activo',
    '1178725': 'Activo',
    '60093146': 'Activo',
    '60093145': 'Baja',
    '60093144': 'Activo',
    '60093122': 'Activo',
    '60093095': 'Activo',
    '60093020': 'Activo',
    '60093016': 'Activo',
    '60092970': 'Activo',
    '60092964': 'Activo',
    '60092924': 'Activo',
    '60092883': 'Activo',
    '1168223': 'Activo',
    '1166280': 'Activo',
    '1163755': 'Activo',
    '60092361': 'Activo',
    '1162630': 'Activo',
    '60092284': 'Activo',
    '1159832': 'Activo',
    '1158395': 'Activo',
    '60091999': 'Activo',
    '60091797': 'Baja',
    '1153271': 'Activo',
    '1153279': 'Activo',
    '60091657': 'Activo',
    '60091478': 'Activo',
    '60090930': 'Activo',
    '60090858': 'Activo',
    '60090818': 'Activo',
    '1140779': 'Activo',
    '1140788': 'Activo',
    '60018023': 'Activo',
    '1139203': 'Activo',
    '60090440': 'Activo',
    '1137767': 'Activo',
    '1134747': 'Activo',
    '60089975': 'Activo',
    '1131677': 'Activo',
    '60063597': 'Activo',
    '60089701': 'Baja',
    '60089511': 'Activo',
    '60089197': 'Baja',
    '1119882': 'Activo',
    '60088989': 'Activo',
    '1116629': 'Activo',
    '60088873': 'Baja',
    '60088833': 'Activo',
    '1112949': 'Activo',
    '1112968': 'Activo',
    '60088597': 'Baja',
    '60088410': 'Baja',
    '1109460': 'Activo',
    '60087457': 'Activo',
    '1096576': 'Activo',
    '60022340': 'Baja',
    '60084830': 'Baja',
    '60030858': 'Baja',
    '60300440': 'Activo',
    '60085799': 'Activo',
    '60004496': 'Activo',
    '60086987': 'Activo',
    '60087274': 'Activo',
    '60016468': 'Activo',
    '60300521': 'Baja',
    '60085382': 'Activo',
    '60068303': 'Activo',
    '60086847': 'Activo',
    '60008720': 'Activo',
    '60047884': 'Activo',
    '1095539': 'Activo',
    '60087254': 'Activo',
    '60026809': 'Baja',
    '1092995': 'Activo',
    '1093095': 'Activo',
    '60086826': 'Activo',
    '60086764': 'Baja',
    '60086632': 'Baja',
    '60086877': 'Activo',
    '60086787': 'Baja',
    '60086777': 'Baja',
    '60017899': 'Activo',
    '1082632': 'Activo',
    '60085903': 'Baja',
    '60068633': 'Activo',
    '109904': 'Baja',
    '60085191': 'Baja',
    '1069386': 'Baja',
    '60081281': 'Baja',
    '108632': 'Baja',
    '60083218': 'Activo',
    '60084553': 'Baja',
    '60070771': 'Baja',
    '60084815': 'Baja',
    '60083330': 'Activo',
    '60002360': 'Activo',
    '60083887': 'Baja',
    '60065999': 'Baja',
    '60068908': 'Baja',
    '60083784': 'Baja',
    '60082968': 'Baja',
    '60022814': 'Activo',
    '60082887': 'Activo',
    '1051744': 'Baja',
    '1056234': 'Activo',
    '1024634': 'Activo',
    '1051604': 'Activo',
    '1051916': 'Activo',
    '1039561': 'Activo'
  };

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const hojaEmp = ss.getSheetByName(HOJA_EMPLEADOS);

  if (!hojaEmp) {
    Logger.log('❌ No se encontró la hoja "Empleados"');
    return;
  }

  // Agregar encabezado en C1
  hojaEmp.getRange('C1').setValue('Estatus');

  // Leer columna A para obtener números de empleado
  const lastRow = hojaEmp.getLastRow();
  const empleados = hojaEmp.getRange('A2:A' + lastRow).getValues();

  // Crear array de estatus
  const estatusValues = empleados.map(row => {
    const num = String(row[0]).trim();
    return [estatusMap[num] || 'Activo'];
  });

  // Escribir columna C de una vez
  hojaEmp.getRange('C2:C' + lastRow).setValues(estatusValues);

  Logger.log('✅ Columna C (Estatus) poblada exitosamente.');
  Logger.log('Total empleados: ' + empleados.length);
  Logger.log('Activos: ' + estatusValues.filter(e => e[0] === 'Activo').length);
  Logger.log('Bajas: ' + estatusValues.filter(e => e[0] === 'Baja').length);
}
