#!/usr/bin/env node

/**
 * Script de configuración inicial del sistema
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');

/**
 * Interfaz de línea de comandos
 */
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Hace una pregunta al usuario
 * @param {string} question - Pregunta
 * @returns {Promise<string>}
 */
function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

/**
 * Muestra el banner de bienvenida
 */
function showBanner() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        🏥 Sistema de Gestión de Reuniones                    ║
║           Secretaría de Salud del Tolima                     ║
║                                                               ║
║              Configuración Inicial v1.0.0                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

/**
 * Verifica los requisitos del sistema
 */
async function checkRequirements() {
    console.log('🔍 Verificando requisitos del sistema...\n');

    // Verificar Node.js
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

    if (majorVersion < 16) {
        console.log('❌ Node.js v16.0.0 o superior es requerido');
        console.log(`   Versión actual: ${nodeVersion}`);
        process.exit(1);
    }

    console.log(`✅ Node.js ${nodeVersion}`);

    // Verificar npm
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const { stdout } = await execAsync('npm --version');
        console.log(`✅ npm v${stdout.trim()}`);
    } catch (error) {
        console.log('❌ npm no encontrado');
        process.exit(1);
    }

    console.log('');
}

/**
 * Configura el entorno de desarrollo
 */
async function setupEnvironment() {
    console.log('🔧 Configurando entorno de desarrollo...\n');

    const envPath = join(ROOT_DIR, '.env');
    const envExamplePath = join(ROOT_DIR, '.env.example');

    try {
        await access(envPath);
        console.log('⚠️  El archivo .env ya existe');

        const overwrite = await ask('¿Desea sobrescribirlo? (s/N): ');
        if (overwrite.toLowerCase() !== 's') {
            console.log('⏭️  Configuración de entorno omitida');
            return;
        }
    } catch (error) {
        // El archivo no existe, continuar
    }

    // Configuración interactiva
    console.log('📝 Configuración del entorno:\n');

    const config = {
        NODE_ENV: 'development',
        API_BASE_URL: await ask('URL base de la API (http://localhost:3001/api): ') || 'http://localhost:3001/api',
        DEBUG: 'true'
    };

    console.log('\n🔐 Configuración de base de datos (opcional):');

    const dbHost = await ask('Host de BD (localhost): ') || 'localhost';
    const dbPort = await ask('Puerto de BD (5432): ') || '5432';
    const dbName = await ask('Nombre de BD (meeting_management): ') || 'meeting_management';
    const dbUser = await ask('Usuario de BD (admin): ') || 'admin';
    const dbPass = await ask('Contraseña de BD: ');

    Object.assign(config, {
        DB_HOST: dbHost,
        DB_PORT: dbPort,
        DB_NAME: dbName,
        DB_USER: dbUser,
        DB_PASSWORD: dbPass
    });

    console.log('\n📧 Configuración de Microsoft Graph (opcional):');

    const azureClientId = await ask('Azure Client ID: ');
    const azureClientSecret = await ask('Azure Client Secret: ');
    const azureTenantId = await ask('Azure Tenant ID: ');

    Object.assign(config, {
        AZURE_CLIENT_ID: azureClientId,
        AZURE_CLIENT_SECRET: azureClientSecret,
        AZURE_TENANT_ID: azureTenantId
    });

    console.log('\n📮 Configuración de email (opcional):');

    const smtpHost = await ask('SMTP Host: ');
    const smtpPort = await ask('SMTP Port (587): ') || '587';
    const smtpUser = await ask('SMTP User: ');
    const smtpPass = await ask('SMTP Password: ');

    Object.assign(config, {
        SMTP_HOST: smtpHost,
        SMTP_PORT: smtpPort,
        SMTP_USER: smtpUser,
        SMTP_PASSWORD: smtpPass
    });

    // Generar archivo .env
    const envContent = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    await writeFile(envPath, envContent);
    console.log('\n✅ Archivo .env creado exitosamente');
}

/**
 * Crea directorios necesarios
 */
async function createDirectories() {
    console.log('\n📁 Creando estructura de directorios...\n');

    const directories = [
        'public/assets/images',
        'public/assets/icons',
        'public/lib',
        'tests/unit',
        'tests/integration',
        'tests/e2e',
        'docs/api',
        'dist',
        'logs'
    ];

    for (const dir of directories) {
        const fullPath = join(ROOT_DIR, dir);
        try {
            await mkdir(fullPath, { recursive: true });
            console.log(`✅ ${dir}/`);
        } catch (error) {
            console.log(`⚠️  Error creando ${dir}/: ${error.message}`);
        }
    }
}

/**
 * Configura Git hooks (si existe repositorio Git)
 */
async function setupGitHooks() {
    console.log('\n🔗 Configurando Git hooks...\n');

    try {
        await access(join(ROOT_DIR, '.git'));

        const huskyInstall = await ask('¿Instalar Husky para Git hooks? (S/n): ');
        if (huskyInstall.toLowerCase() !== 'n') {
            try {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                await execAsync('npx husky install', { cwd: ROOT_DIR });
                console.log('✅ Husky configurado');

                // Crear hook pre-commit
                const preCommitHook = `#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint && npm run test
`;

                await writeFile(join(ROOT_DIR, '.husky/pre-commit'), preCommitHook);
                console.log('✅ Hook pre-commit creado');

            } catch (error) {
                console.log('⚠️  Error configurando Husky:', error.message);
            }
        }
    } catch (error) {
        console.log('ℹ️  No es un repositorio Git, omitiendo hooks');
    }
}

/**
 * Crea archivos de configuración adicionales
 */
async function createConfigFiles() {
    console.log('\n⚙️  Creando archivos de configuración...\n');

    // .gitignore
    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.production

# Build outputs
dist/
build/
*.tgz

# IDE
.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
desktop.ini

# Logs
logs/
*.log

# Coverage
coverage/
.nyc_output/

# Temporary files
.tmp/
temp/
*.tmp

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional stylelint cache
.stylelintcache

# Microbundle cache
.rpt2_cache/
.rts2_cache_cjs/
.rts2_cache_es/
.rts2_cache_umd/

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# dotenv environment variable files
.env*

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Diagnostic reports
report.[0-9]*.[0-9]*.[0-9]*.[0-9]*.json
`;

    try {
        await writeFile(join(ROOT_DIR, '.gitignore'), gitignoreContent);
        console.log('✅ .gitignore creado');
    } catch (error) {
        console.log('⚠️  Error creando .gitignore:', error.message);
    }

    // robots.txt
    const robotsContent = `User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /*.json$

Sitemap: https://reuniones.saludtolima.gov.co/sitemap.xml
`;

    try {
        await writeFile(join(ROOT_DIR, 'public/robots.txt'), robotsContent);
        console.log('✅ robots.txt creado');
    } catch (error) {
        console.log('⚠️  Error creando robots.txt:', error.message);
    }

    // manifest.json
    const manifestContent = {
        name: 'Sistema de Gestión de Reuniones',
        short_name: 'Reuniones Tolima',
        description: 'Sistema de Gestión de Reuniones - Secretaría de Salud del Tolima',
        start_url: '/',
        display: 'standalone',
        background_color: '#2c5282',
        theme_color: '#2c5282',
        icons: [
            {
                src: 'assets/icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: 'assets/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png'
            }
        ]
    };

    try {
        await writeFile(
            join(ROOT_DIR, 'public/manifest.json'),
            JSON.stringify(manifestContent, null, 2)
        );
        console.log('✅ manifest.json creado');
    } catch (error) {
        console.log('⚠️  Error creando manifest.json:', error.message);
    }
}

/**
 * Instala dependencias opcionales
 */
async function installOptionalDependencies() {
    console.log('\n📦 Dependencias opcionales:\n');

    const optionalDeps = [
        {
            name: 'ws',
            description: 'Para livereload en desarrollo',
            dev: true
        },
        {
            name: '@microsoft/microsoft-graph-client',
            description: 'Para integración con Microsoft Graph',
            dev: false
        },
        {
            name: 'playwright',
            description: 'Para pruebas end-to-end',
            dev: true
        }
    ];

    for (const dep of optionalDeps) {
        const install = await ask(`¿Instalar ${dep.name}? (${dep.description}) (s/N): `);

        if (install.toLowerCase() === 's') {
            try {
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                const flag = dep.dev ? '--save-dev' : '--save';
                await execAsync(`npm install ${flag} ${dep.name}`, { cwd: ROOT_DIR });
                console.log(`✅ ${dep.name} instalado`);
            } catch (error) {
                console.log(`⚠️  Error instalando ${dep.name}:`, error.message);
            }
        }
    }
}

/**
 * Muestra información final
 */
function showFinalInfo() {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                    🎉 ¡Configuración Completa!               ║
╚═══════════════════════════════════════════════════════════════╝

📋 Próximos pasos:

   1️⃣  Revisar configuración en .env
   2️⃣  Agregar imágenes al directorio public/assets/images/
   3️⃣  Personalizar variables CSS en public/css/themes.css
   4️⃣  Iniciar el servidor de desarrollo:

       npm run dev

📚 Documentación útil:

   • README.md - Guía completa
   • docs/SETUP.md - Configuración detallada
   • docs/API.md - Documentación de la API

🆘 Soporte:

   • Email: sistemas@saludtolima.gov.co
   • GitHub: https://github.com/saludtolima/meeting-management-system

¡Gracias por usar el Sistema de Gestión de Reuniones! 🏥
  `);
}

/**
 * Función principal
 */
async function main() {
    try {
        showBanner();

        await checkRequirements();
        await setupEnvironment();
        await createDirectories();
        await setupGitHooks();
        await createConfigFiles();
        await installOptionalDependencies();

        showFinalInfo();

    } catch (error) {
        console.error('\n❌ Error durante la configuración:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main };