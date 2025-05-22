#!/usr/bin/env node

/**
 * Servidor de desarrollo para el Sistema de Gestión de Reuniones
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { join, extname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const PUBLIC_DIR = resolve(__dirname, '../public');
const SRC_DIR = resolve(__dirname, '../src');

// Configuración del servidor
const config = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: true,
    livereload: true,
    openBrowser: true
};

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

/**
 * Obtiene el tipo MIME de un archivo
 * @param {string} filePath - Ruta del archivo
 * @returns {string}
 */
function getMimeType(filePath) {
    const ext = extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'text/plain';
}

/**
 * Maneja las solicitudes HTTP
 * @param {Object} req - Request
 * @param {Object} res - Response
 */
async function handleRequest(req, res) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

    // Agregar headers CORS si está habilitado
    if (config.cors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    // Manejar OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    try {
        let filePath = decodeURIComponent(req.url.split('?')[0]);

        // Rutas especiales para módulos ES6
        if (filePath.startsWith('/src/')) {
            filePath = join(SRC_DIR, filePath.substring(5));
        } else if (filePath === '/' || filePath === '/index.html') {
            filePath = join(PUBLIC_DIR, 'index.html');
        } else {
            filePath = join(PUBLIC_DIR, filePath);
        }

        // Verificar si el archivo existe
        try {
            const stats = await stat(filePath);

            if (stats.isDirectory()) {
                filePath = join(filePath, 'index.html');
            }
        } catch (error) {
            // Si no existe, intentar servir index.html para SPA routing
            if (!filePath.includes('.')) {
                filePath = join(PUBLIC_DIR, 'index.html');
            } else {
                throw error;
            }
        }

        // Leer y servir el archivo
        const content = await readFile(filePath);
        const mimeType = getMimeType(filePath);

        res.writeHead(200, {
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // Inyectar livereload script si es HTML
        if (mimeType === 'text/html' && config.livereload) {
            const htmlContent = content.toString();
            const livereloadScript = `
        <script>
          // Livereload simple
          (function() {
            const ws = new WebSocket('ws://localhost:${config.port + 1}');
            ws.onmessage = function(event) {
              if (event.data === 'reload') {
                location.reload();
              }
            };
            ws.onerror = function() {
              console.log('Livereload desconectado');
            };
          })();
        </script>
      `;

            const modifiedHtml = htmlContent.replace('</body>', livereloadScript + '</body>');
            res.end(modifiedHtml);
        } else {
            res.end(content);
        }

    } catch (error) {
        console.error(`Error serving ${req.url}:`, error.message);

        // Servir página de error personalizada
        const errorPage = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error - Sistema de Gestión de Reuniones</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .error-container {
            background: white;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            max-width: 500px;
          }
          .error-icon {
            font-size: 4rem;
            color: #e53e3e;
            margin-bottom: 20px;
          }
          h1 {
            color: #2d3748;
            margin-bottom: 10px;
          }
          p {
            color: #4a5568;
            margin-bottom: 20px;
          }
          .btn {
            display: inline-block;
            background: #2c5282;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
          }
          .btn:hover {
            background: #2a4d7a;
          }
          .error-details {
            background: #f7fafc;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            text-align: left;
            font-family: monospace;
            font-size: 0.9em;
            color: #4a5568;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-icon">⚠️</div>
          <h1>Archivo no encontrado</h1>
          <p>El recurso solicitado no existe en el servidor de desarrollo.</p>
          <a href="/" class="btn">Volver al inicio</a>
          <div class="error-details">
            <strong>URL:</strong> ${req.url}<br>
            <strong>Método:</strong> ${req.method}<br>
            <strong>Error:</strong> ${error.message}
          </div>
        </div>
      </body>
      </html>
    `;

        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(errorPage);
    }
}

/**
 * Crea servidor WebSocket para livereload
 */
function createLivereloadServer() {
    if (!config.livereload) return;

    try {
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ port: config.port + 1 });

        console.log(`📡 Livereload server started on ws://localhost:${config.port + 1}`);

        // Simular cambios cada 30 segundos para testing
        setInterval(() => {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    // En una implementación real, aquí se verificarían cambios en archivos
                    // client.send('reload');
                }
            });
        }, 30000);

    } catch (error) {
        console.warn('⚠️  Livereload no disponible (instalar ws: npm install ws)');
        config.livereload = false;
    }
}

/**
 * Abre el navegador
 */
function openBrowser() {
    if (!config.openBrowser) return;

    const url = `http://${config.host}:${config.port}`;

    setTimeout(() => {
        const { exec } = require('child_process');
        const command = process.platform === 'win32' ? 'start' :
            process.platform === 'darwin' ? 'open' : 'xdg-open';

        exec(`${command} ${url}`, (error) => {
            if (error) {
                console.log(`🌐 Abrir manualmente: ${url}`);
            }
        });
    }, 1000);
}

/**
 * Muestra información de ayuda
 */
function showHelp() {
    console.log(`
Sistema de Gestión de Reuniones - Servidor de Desarrollo

Uso: node scripts/dev-server.js [opciones]

Opciones:
  --port, -p <puerto>     Puerto del servidor (default: 3000)
  --host, -h <host>       Host del servidor (default: localhost)  
  --no-cors              Deshabilitar CORS
  --no-livereload        Deshabilitar livereload
  --no-open              No abrir navegador
  --help                 Mostrar esta ayuda

Ejemplos:
  node scripts/dev-server.js --port 8080
  node scripts/dev-server.js --host 0.0.0.0 --no-open
  `);
}

/**
 * Procesa argumentos de línea de comandos
 */
function parseArgs() {
    const args = process.argv.slice(2);

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        switch (arg) {
            case '--help':
                showHelp();
                process.exit(0);
                break;
            case '--port':
            case '-p':
                config.port = parseInt(args[++i]) || config.port;
                break;
            case '--host':
            case '-h':
                config.host = args[++i] || config.host;
                break;
            case '--no-cors':
                config.cors = false;
                break;
            case '--no-livereload':
                config.livereload = false;
                break;
            case '--no-open':
                config.openBrowser = false;
                break;
        }
    }
}

/**
 * Función principal
 */
function main() {
    parseArgs();

    console.log('🚀 Iniciando servidor de desarrollo...\n');

    // Crear servidor HTTP
    const server = createServer(handleRequest);

    server.listen(config.port, config.host, () => {
        console.log(`✅ Servidor iniciado exitosamente!`);
        console.log(`📍 URL: http://${config.host}:${config.port}`);
        console.log(`📁 Directorio público: ${PUBLIC_DIR}`);
        console.log(`📂 Directorio fuente: ${SRC_DIR}`);
        console.log(`🔄 CORS: ${config.cors ? 'habilitado' : 'deshabilitado'}`);
        console.log(`🔄 Livereload: ${config.livereload ? 'habilitado' : 'deshabilitado'}`);
        console.log('\n📝 Logs de solicitudes:\n');

        // Configurar livereload
        createLivereloadServer();

        // Abrir navegador
        openBrowser();
    });

    // Manejar errores del servidor
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Error: El puerto ${config.port} ya está en uso`);
            console.log(`💡 Intenta con otro puerto: --port ${config.port + 1}`);
        } else {
            console.error('❌ Error del servidor:', err.message);
        }
        process.exit(1);
    });

    // Manejar cierre del servidor
    process.on('SIGINT', () => {
        console.log('\n👋 Cerrando servidor de desarrollo...');
        server.close(() => {
            console.log('✅ Servidor cerrado exitosamente');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        server.close(() => {
            process.exit(0);
        });
    });
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { handleRequest, config };