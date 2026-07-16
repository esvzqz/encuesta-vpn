# 📋 Instrucciones de Configuración - Encuesta VPN

## Paso 1: Crear el Google Sheet e importar la lista de empleados

### 1.1 Crear el spreadsheet
1. Abre tu navegador y ve a **https://sheets.google.com**
2. Inicia sesión con tu cuenta de Google (la que quieras usar para almacenar los datos)
3. Haz clic en el botón **"+"** (Hoja de cálculo en blanco) para crear un nuevo spreadsheet
4. Arriba a la izquierda donde dice "Hoja de cálculo sin título", haz clic y renómbralo a: **Encuesta VPN - Mi Área**

### 1.2 Importar la lista de empleados
1. En el spreadsheet que acabas de crear, ve al menú: **Archivo > Importar**
2. Selecciona la pestaña **"Subir"**
3. Arrastra o busca el archivo `empleados_lista.csv` que está en la carpeta `vpn-formulario/`
   - Ruta completa: `/Users/elizevaz/vpn-formulario/empleados_lista.csv`
4. En las opciones de importación selecciona:
   - **Ubicación de importación**: "Reemplazar hoja de cálculo actual"
   - **Tipo de separador**: "Coma"
5. Haz clic en **"Importar datos"**
6. Verifica que se vea así:
   ```
   |    A       |          B                        |
   |------------|-----------------------------------|
   | Empleado   | Nombre                            |  ← fila 1 (encabezados)
   | 60095235   | MAURA PAOLA BAUTISTA PAREDES      |  ← fila 2
   | 60095206   | EMILIO CORTES DAVID               |  ← fila 3
   | 1214640    | LUIS FERNANDO FLORES RIVERA        |  ← fila 4
   | ...        | ...                               |
   ```
   Debes tener **131 empleados** (132 filas contando el encabezado)

### 1.3 Renombrar la hoja
1. En la parte inferior del spreadsheet verás una pestaña que dice "Hoja 1"
2. Haz **doble clic** sobre esa pestaña (o clic derecho > Cambiar nombre)
3. Cámbiala a: **Empleados** (exactamente así, con E mayúscula)

### 1.4 Copiar el ID del spreadsheet
1. Mira la barra de direcciones de tu navegador. La URL se ve así:
   ```
   https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789/edit#gid=0
                                           ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                           ^^^^^^^^^ ESTE ES TU ID ^^^^^^^^^^^^^^^^^
   ```
2. Copia todo lo que está entre `/d/` y `/edit` — eso es tu **SPREADSHEET_ID**
3. Guárdalo en algún lado, lo vas a necesitar en el Paso 2

## Paso 2: Crear el Google Apps Script

### 2.1 Crear el proyecto
1. Abre una nueva pestaña en tu navegador
2. Ve a **https://script.google.com**
3. Haz clic en **"Nuevo proyecto"** (botón azul arriba a la izquierda)
4. Se abrirá un editor con código de ejemplo. **Selecciona todo** (Ctrl+A / Cmd+A) y **bórralo**

### 2.2 Pegar el código
1. Abre el archivo `apps-script.js` que está en tu carpeta `vpn-formulario/`
   - Puedes abrirlo con TextEdit, VS Code, o cualquier editor de texto
2. Selecciona **TODO** el contenido del archivo (Ctrl+A / Cmd+A)
3. Cópialo (Ctrl+C / Cmd+C)
4. Regresa a la pestaña de Google Apps Script
5. Pégalo (Ctrl+V / Cmd+V) en el editor

### 2.3 Configurar el ID de tu spreadsheet
1. En el código que acabas de pegar, busca la línea (cerca del inicio):
   ```javascript
   const SPREADSHEET_ID = 'TU_SPREADSHEET_ID_AQUI';
   ```
2. Reemplaza `TU_SPREADSHEET_ID_AQUI` con el ID que copiaste en el Paso 1.4
   - Ejemplo: `const SPREADSHEET_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ123456789';`
   - ⚠️ No borres las comillas simples, solo lo de adentro

### 2.4 Guardar
1. Haz clic en el ícono de **💾 disco** (o Ctrl+S / Cmd+S)
2. Te pedirá un nombre para el proyecto. Ponle: **VPN Encuesta Backend**
3. Haz clic en **"Aceptar"**

## Paso 3: Probar la conexión

1. En el editor de Apps Script, busca el **dropdown** arriba que dice "doGet" o "myFunction"
2. Haz clic en ese dropdown y selecciona la función **`test`**
3. Haz clic en el botón **▶ Ejecutar** (a la izquierda del dropdown)
4. **Primera vez**: te saldrá una ventana pidiendo permisos:
   - Haz clic en **"Revisar permisos"**
   - Selecciona tu cuenta de Google
   - Si sale "Google no verificó esta app", haz clic en **"Avanzado"** → **"Ir a VPN Encuesta Backend (no seguro)"**
   - Haz clic en **"Permitir"**
5. Espera unos segundos a que se ejecute
6. Abajo del editor aparecerá el **Registro de ejecución**. Deberías ver:
   ```
   ✅ Hoja encontrada. Empleados registrados: 131
   Primeros 5: 60095235 - MAURA PAOLA BAUTISTA PAREDES, ...
   ```
7. Si ves un error, revisa que:
   - El ID del spreadsheet sea correcto
   - La hoja se llame exactamente "Empleados" (con E mayúscula)
   - Los datos empiecen en la fila 2 (fila 1 son encabezados)

## Paso 4: Desplegar como Web App

Esto hace que tu formulario pueda enviar datos al Sheet por internet.

### 4.1 Iniciar el despliegue
1. En el editor de Apps Script, haz clic en el botón azul **"Implementar"** (arriba a la derecha)
2. Selecciona **"Nueva implementación"**

### 4.2 Configurar
1. Haz clic en el ícono de ⚙️ (engrane) junto a "Seleccionar tipo"
2. Selecciona **"Aplicación web"**
3. Llena los campos:
   - **Descripción**: `VPN Encuesta API`
   - **Ejecutar como**: **Yo mismo** (tu correo aparecerá ahí)
   - **Quién tiene acceso**: **Cualquier persona**
     - ⚠️ Esto es necesario para que el formulario funcione sin pedir login a los empleados
4. Haz clic en **"Implementar"**

### 4.3 Copiar la URL
1. Aparecerá un mensaje de éxito con una **URL** que se ve así:
   ```
   https://script.google.com/macros/s/AKfycbx_MUCHOS_CARACTERES_AQUI/exec
   ```
2. Haz clic en **"Copiar"** (o selecciónala manualmente y copia)
3. **Guarda esta URL** — la necesitas para el siguiente paso

### ⚠️ IMPORTANTE: Si actualizas el código después
Si más adelante modificas el código de Apps Script:
1. Ve a **Implementar > Administrar implementaciones**
2. Haz clic en el ícono de ✏️ (lápiz/editar)
3. En "Versión" selecciona **"Nueva versión"**
4. Haz clic en **"Implementar"**
(Si no haces esto, los cambios no se reflejan)

## Paso 5: Conectar el formulario y el dashboard

### 5.1 Editar el formulario
1. Abre el archivo `formulario.html` con un editor de texto:
   - Clic derecho sobre el archivo → Abrir con → TextEdit (o VS Code, Sublime, etc.)
2. Busca esta línea (está casi al final del archivo, en la sección `<script>`):
   ```javascript
   const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';
   ```
3. Reemplaza `TU_URL_DE_APPS_SCRIPT_AQUI` con la URL que copiaste en el Paso 4.3
   - Ejemplo:
   ```javascript
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
   ```
4. Guarda el archivo (Ctrl+S / Cmd+S)

### 5.2 Editar el dashboard
1. Abre el archivo `dashboard.html` con un editor de texto
2. Busca la misma línea:
   ```javascript
   const APPS_SCRIPT_URL = 'TU_URL_DE_APPS_SCRIPT_AQUI';
   ```
3. Pega la **misma URL** del Paso 4.3
4. Guarda el archivo

### 5.3 Verificar que funciona
1. Haz doble clic en `formulario.html` para abrirlo en tu navegador
2. Deberías ver el formulario con las imágenes de Cisco AnyConnect y GlobalProtect
3. Prueba poner un número de empleado de la lista y seleccionar una opción
4. Si dice "✅ Respuesta enviada exitosamente" → ¡ya está funcionando!
5. Ve a tu Google Sheet y verifica que se creó una hoja "Respuestas" con tu dato de prueba

## Paso 6: Compartir el formulario con tu equipo

Las imágenes ya están configuradas (Cisco.png y Global.png). Solo necesitas compartir los archivos.

### Opción A: Compartir la carpeta completa (más fácil)
1. Comprime la carpeta: clic derecho en `vpn-formulario` → "Comprimir"
2. Sube el .zip a una carpeta compartida (OneDrive, Google Drive, etc.)
3. Dile a tu equipo que descarguen, descompriman y abran `formulario.html`

### Opción B: GitHub Pages (URL que mandas por correo/Teams)
1. Crea una cuenta en https://github.com (si no tienes)
2. Crea un nuevo repositorio (ej: "encuesta-vpn")
3. Sube los archivos: `formulario.html`, `dashboard.html` y la carpeta `img/`
4. Ve a **Settings > Pages > Source**: selecciona "main" branch
5. En 1-2 minutos tendrás tu URL:
   - Formulario: `https://tuusuario.github.io/encuesta-vpn/formulario.html`
   - Dashboard: `https://tuusuario.github.io/encuesta-vpn/dashboard.html`
6. Comparte solo el link del formulario con tu equipo

### Opción C: Simplemente abrir desde la computadora
Si todos están en la misma red o pueden acceder a una carpeta compartida:
1. Copia la carpeta `vpn-formulario/` a un lugar compartido
2. Cada quien abre `formulario.html` desde ahí

## Paso 7: Usar el dashboard para dar seguimiento

1. Abre `dashboard.html` en tu navegador (doble clic)
2. Verás:
   - **Tarjetas** con el conteo: total, respondidos, pendientes, cuántos usan cada VPN
   - **Barra de progreso** que muestra el % de avance
   - **Tabla** con todos los 131 empleados y su estado
3. Usa los **filtros** (botones arriba de la tabla) para ver solo:
   - Los que ya respondieron
   - Los pendientes
   - Los que usan Cisco, GlobalProtect, o no tienen VPN
4. Usa la **barra de búsqueda** para buscar por número o nombre
5. Haz clic en el botón **🔄** (esquina inferior derecha) para actualizar los datos

---

## 🎯 Uso diario

- **Tus compañeros** abren `formulario.html`, ponen su número y seleccionan su VPN
- **Tú** abres `dashboard.html` para ver el progreso en tiempo real
- Los datos se guardan automáticamente en tu Google Sheet
- Si alguien responde 2 veces, se actualiza en vez de duplicar

---

## 🔧 Solución de problemas

| Problema | Solución |
|----------|----------|
| "Error al enviar" | Verifica que la URL de Apps Script sea correcta |
| Dashboard vacío | Verifica que la hoja "Empleados" tenga datos desde A2 |
| No se guardan respuestas | Ejecuta la función `test()` en Apps Script para verificar |
| CORS error en consola | Normal con `no-cors`, las respuestas sí se guardan |

---

## 📁 Estructura de archivos

```
vpn-formulario/
├── formulario.html        ← Lo que ven tus compañeros
├── dashboard.html         ← Tu panel de seguimiento
├── apps-script.js         ← Código para Google Apps Script
├── empleados_lista.csv    ← Lista de 131 empleados (para importar al Sheet)
├── img/
│   ├── vpn1.png           ← Cisco AnyConnect
│   └── vpn2.png           ← GlobalProtect
└── INSTRUCCIONES.md       ← Este archivo
```
