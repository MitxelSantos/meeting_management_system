#!/usr/bin/env node

/**
 * Script de construcción para producción
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { readFile, writeFile, mkdir, copyFile, readdir, stat } from 'fs/promises';
import { join, resolve, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, '..');
const PUBLIC_DIR = join(ROOT_DIR, 'public');
const SRC_DIR = join(ROOT_DIR, 'src');
const DIST_DIR = join(ROOT_DIR, 'dist');

// Configuración de construcción
const config = {
    minify: process.env.NODE_ENV === 'production',
    sourceMaps: process.env.NODE_ENV !== 'production',
    hash: process.env.NODE_ENV === 'production',
    gzip: process.env.NODE_ENV === 'production'
};

/**
 * Limpia el directorio de distribución
 */
async function cleanDist() {
    try {
        const { rmdir } = await import('fs/promises');
        await rmdir(DIST_DIR, { recursive: true, force: true });
        console.log('🧹 Directorio dist limpiado');
    } catch (error) {
        // El directorio no existe, no hay problema
    }

    await mkdir(DIST_DIR, { recursive: true });
}

/**
 * Copia archivos estáticos
 */
async function copyStaticFiles() {
    console.log('📁 Copiando archivos estáticos...');

    const staticDirs = ['assets', 'lib'];
    const staticFiles = ['favicon.ico', 'robots.txt', 'manifest.json'];

    // Copiar directorios
    for (const dir of staticDirs) {
        const srcPath = join(PUBLIC_DIR, dir);
        const destPath = join(DIST_DIR, dir);

        try {
            await copyDirectory(srcPath, destPath);
            console.log(`  ✅ ${dir}/`);
        } catch (error) {
            console.log(`  ⚠️  ${dir}/ no encontrado`);
        }
    }

    // Copiar archivos individuales
    for (const file of staticFiles) {
        try {
            await copyFile(join(PUBLIC_DIR, file), join(DIST_DIR, file));
            console.log(`  ✅ ${file}`);
        } catch (error) {
            console.log(`  ⚠️  ${file} no encontrado`);
        }
    }
}

/**
 * Copia un directorio recursivamente
 */
async function copyDirectory(src, dest) {
    await mkdir(dest, { recursive: true });

    const entries = await readdir(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        } else {
            await copyFile(srcPath, destPath);
        }
    }
}

/**
 * Procesa archivos CSS
 */
async function processCSS() {
    console.log('🎨 Procesando archivos CSS...');

    const cssFiles = ['main.css', 'components.css', 'responsive.css', 'themes.css'];
    const processedFiles = [];

    for (const file of cssFiles) {
        const srcPath = join(PUBLIC_DIR, 'css', file);

        try {
            let content = await readFile(srcPath, 'utf8');

            if (config.minify) {
                content = minifyCSS(content);
            }

            const hash = config.hash ? '.' + generateHash(content).substring(0, 8) : '';
            const fileName = file.replace('.css', `${hash}.css`);
            const destPath = join(DIST_DIR, 'css', fileName);

            await mkdir(dirname(destPath), { recursive: true });
            await writeFile(destPath, content);

            processedFiles.push({
                original: file,
                processed: fileName,
                path: `css/${fileName}`
            });

            console.log(`  ✅ ${file} → ${fileName}`);
        } catch (error) {
            console.log(`  ❌ Error procesando ${file}:`, error.message);
        }
    }

    return processedFiles;
}

/**
 * Procesa archivos JavaScript
 */
async function processJS() {
    console.log('📜 Procesando archivos JavaScript...');

    const jsFiles = await findJSFiles(PUBLIC_DIR);
    const processedFiles = [];

    for (const file of jsFiles) {
        try {
            let content = await readFile(file.path, 'utf8');

            // Transpilación simple de ES6 (en una implementación real usaríamos Babel)
            if (config.minify) {
                content = minifyJS(content);
            }

            const hash = config.hash ? '.' + generateHash(content).substring(0, 8) : '';
            const fileName = file.name.replace('.js', `${hash}.js`);
            const relativePath = file.relative.replace(file.name, fileName);
            const destPath = join(DIST_DIR, relativePath);

            await mkdir(dirname(destPath), { recursive: true });
            await writeFile(destPath, content);

            processedFiles.push({
                original: file.relative,
                processed: relativePath,
                path: relativePath
            });

            console.log(`  ✅ ${file.relative} → ${relativePath}`);
        } catch (error) {
            console.log(`  ❌ Error procesando ${file.relative}:`, error.message);
        }
    }

    return processedFiles;
}

/**
 * Encuentra todos los archivos JS
 */
async function findJSFiles(dir, baseDir = dir) {
    const files = [];
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...await findJSFiles(fullPath, baseDir));
        } else if (entry.name.endsWith('.js')) {
            files.push({
                name: entry.name,
                path: fullPath,
                relative: fullPath.replace(baseDir + '/', '')
            });
        }
    }

    return files;
}

/**
 * Procesa el archivo HTML principal
 */
async function processHTML(cssFiles, jsFiles) {
    console.log('📄 Procesando HTML...');

    const srcPath = join(PUBLIC_DIR, 'index.html');
    let content = await readFile(srcPath, 'utf8');

    // Reemplazar referencias a archivos CSS
    cssFiles.forEach(file => {
        const oldPath = `css/${file.original}`;
        const newPath = file.path;
        content = content.replace(oldPath, newPath);
    });

    // Reemplazar referencias a archivos JS
    jsFiles.forEach(file => {
        content = content.replace(file.original, file.processed);
    });

    // Optimizaciones HTML
    if (config.minify) {
        content = minifyHTML(content);
    }

    // Inyectar configuración de producción
    const productionConfig = `
    <script>
      window.CONFIG = {
        NODE_ENV: '${process.env.NODE_ENV || 'production'}',
        VERSION: '${process.env.npm_package_version || '1.0.0'}',
        BUILD_TIME: '${new Date().toISOString()}'
      };
    </script>
  `;

    content = content.replace('</head>', productionConfig + '</head>');

    const destPath = join(DIST_DIR, 'index.html');
    await writeFile(destPath, content);

    console.log('  ✅ index.html procesado');
}

/**
 * Genera hash de contenido
 */
function generateHash(content) {
    return createHash('md5').update(content).digest('hex');
}

/**
 * Minifica CSS (implementación simple)
 */
function minifyCSS(css) {
    return css
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios
        .replace(/\s+/g, ' ') // Reducir espacios múltiples
        .replace(/;\s*}/g, '}') // Remover último punto y coma
        .replace(/\s*{\s*/g, '{') // Limpiar llaves
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*,\s*/g, ',') // Limpiar comas
        .replace(/\s*:\s*/g, ':') // Limpiar dos puntos
        .replace(/\s*;\s*/g, ';') // Limpiar punto y coma
        .trim();
}

/**
 * Minifica JavaScript (implementación simple)
 */
function minifyJS(js) {
    return js
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remover comentarios multilínea
        .replace(/\/\/.*$/gm, '') // Remover comentarios de línea
        .replace(/\s+/g, ' ') // Reducir espacios múltiples
        .replace(/\s*{\s*/g, '{') // Limpiar llaves
        .replace(/\s*}\s*/g, '}')
        .replace(/\s*,\s*/g, ',') // Limpiar comas
        .replace(/\s*;\s*/g, ';') // Limpiar punto y coma
        .replace(/\s*=\s*/g, '=') // Limpiar asignaciones
        .trim();
}

/**
 * Minifica HTML (implementación simple)
 */
function minifyHTML(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '') // Remover comentarios
        .replace(/\s+/g, ' ') // Reducir espacios múltiples
        .replace(/>\s+</g, '><') // Remover espacios entre tags
        .trim();
}

/**
 * Genera archivo de manifiesto
 */
async function generateManifest(cssFiles, jsFiles) {
    console.log('📋 Generando manifiesto...');

    const manifest = {
        version: process.env.npm_package_version || '1.0.0',
        buildTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        files: {
            css: cssFiles.map(f => f.path),
            js: jsFiles.map(f => f.path)
        },
        hash: generateHash(JSON.stringify({ cssFiles, jsFiles }))
    };

    await writeFile(
        join(DIST_DIR, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );

    console.log('  ✅ Manifiesto generado');
}

/**
 * Valida la construcción
 */
async function validateBuild() {
    console.log('✅ Validando construcción...');

    const requiredFiles = ['index.html', 'manifest.json'];

    for (const file of requiredFiles) {
        try {
            await stat(join(DIST_DIR, file));
            console.log(`  ✅ ${file} existe`);
        } catch (error) {
            console.log(`  ❌ ${file} falta`);
            throw new Error(`Archivo requerido falta: ${file}`);
        }
    }

    console.log('  ✅ Construcción válida');
}

/**
 * Muestra estadísticas de construcción
 */
async function showStats() {
    console.log('\n📊 Estadísticas de construcción:');

    const getDirectorySize = async (dir) => {
        let size = 0;
        try {
            const entries = await readdir(dir, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = join(dir, entry.name);

                if (entry.isDirectory()) {
                    size += await getDirectorySize(fullPath);
                } else {
                    const stats = await stat(fullPath);
                    size += stats.size;
                }
            }
        } catch (error) {
            // Directorio no existe
        }

        return size;
    };

    const distSize = await getDirectorySize(DIST_DIR);
    const publicSize = await getDirectorySize(PUBLIC_DIR);

    console.log(`  📁 Tamaño original: ${formatBytes(publicSize)}`);
    console.log(`  📦 Tamaño optimizado: ${formatBytes(distSize)}`);
    console.log(`  💾 Ahorro: ${formatBytes(publicSize - distSize)} (${Math.round((1 - distSize / publicSize) * 100)}%)`);
}

/**
 * Formatea bytes en formato legible
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Función principal
 */
async function main() {
    const startTime = Date.now();

    console.log('🔨 Iniciando construcción para producción...\n');
    console.log(`📊 Configuración:`);
    console.log(`  - Minificar: ${config.minify}`);
    console.log(`  - Source maps: ${config.sourceMaps}`);
    console.log(`  - Hash archivos: ${config.hash}`);
    console.log(`  - Compresión: ${config.gzip}\n`);

    try {
        // 1. Limpiar directorio de distribución
        await cleanDist();

        // 2. Copiar archivos estáticos
        await copyStaticFiles();

        // 3. Procesar CSS
        const cssFiles = await processCSS();

        // 4. Procesar JavaScript
        const jsFiles = await processJS();

        // 5. Procesar HTML
        await processHTML(cssFiles, jsFiles);

        // 6. Generar manifiesto
        await generateManifest(cssFiles, jsFiles);

        // 7. Validar construcción
        await validateBuild();

        // 8. Mostrar estadísticas
        await showStats();

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;

        console.log(`\n🎉 ¡Construcción completada exitosamente!`);
        console.log(`⏱️  Tiempo transcurrido: ${duration.toFixed(2)}s`);
        console.log(`📂 Archivos generados en: ${DIST_DIR}`);

    } catch (error) {
        console.error('\n❌ Error durante la construcción:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { main, config };