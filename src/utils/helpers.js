/**
 * Funciones de utilidad general
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

/**
 * Genera un ID único
 * @param {string} prefix - Prefijo opcional
 * @returns {string}
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function validateEmail(email) {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida email institucional (gov.co)
 * @param {string} email - Email a validar
 * @returns {boolean}
 */
export function validateInstitutionalEmail(email) {
  if (!validateEmail(email)) return false;
  const institutionalRegex = /^[a-zA-Z0-9._%+-]+@(saludtolima\.gov\.co|tolima\.gov\.co|gov\.co)$/;
  return institutionalRegex.test(email);
}

/**
 * Valida número de teléfono colombiano
 * @param {string} phone - Teléfono a validar
 * @returns {boolean}
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const phoneRegex = /^(\+57)?[1-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string}
 */
export function capitalize(str) {
  if (!str) return '';
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Capitaliza solo la primera letra
 * @param {string} str - String a capitalizar
 * @returns {string}
 */
export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convierte string a formato slug (URL-friendly)
 * @param {string} str - String a convertir
 * @returns {string}
 */
export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[àáäâ]/g, 'a')
    .replace(/[èéëê]/g, 'e')
    .replace(/[ìíïî]/g, 'i')
    .replace(/[òóöô]/g, 'o')
    .replace(/[ùúüû]/g, 'u')
    .replace(/[ñ]/g, 'n')
    .replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Trunca un string y agrega puntos suspensivos
 * @param {string} str - String a truncar
 * @param {number} length - Longitud máxima
 * @param {string} ending - Terminación (por defecto '...')
 * @returns {string}
 */
export function truncate(str, length = 100, ending = '...') {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.slice(0, length - ending.length) + ending;
}

/**
 * Escapa caracteres HTML
 * @param {string} str - String a escapar
 * @returns {string}
 */
export function escapeHtml(str) {
  if (!str) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Desescapa caracteres HTML
 * @param {string} str - String a desescapar
 * @returns {string}
 */
export function unescapeHtml(str) {
  if (!str) return '';
  const map = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'"
  };
  return str.replace(/&(amp|lt|gt|quot|#39);/g, (m, p) => map[m]);
}

/**
 * Formatea número con separadores de miles
 * @param {number} num - Número a formatear
 * @param {string} locale - Locale (por defecto 'es-CO')
 * @returns {string}
 */
export function formatNumber(num, locale = 'es-CO') {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formatea moneda colombiana
 * @param {number} amount - Cantidad a formatear
 * @returns {string}
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Calcula porcentaje
 * @param {number} part - Parte
 * @param {number} total - Total
 * @param {number} decimals - Decimales (por defecto 1)
 * @returns {number}
 */
export function calculatePercentage(part, total, decimals = 1) {
  if (!total || total === 0) return 0;
  const percentage = (part / total) * 100;
  return Math.round(percentage * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Ordena array por propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} property - Propiedad por la cual ordenar
 * @param {boolean} ascending - Orden ascendente (por defecto true)
 * @returns {Array}
 */
export function sortByProperty(array, property, ascending = true) {
  if (!Array.isArray(array)) return [];

  return [...array].sort((a, b) => {
    let aVal = getNestedProperty(a, property);
    let bVal = getNestedProperty(b, property);

    // Manejar valores null/undefined
    if (aVal === null || aVal === undefined) aVal = '';
    if (bVal === null || bVal === undefined) bVal = '';

    // Comparación
    if (aVal < bVal) return ascending ? -1 : 1;
    if (aVal > bVal) return ascending ? 1 : -1;
    return 0;
  });
}

/**
 * Agrupa array por propiedad
 * @param {Array} array - Array a agrupar
 * @param {string|Function} keyOrFunction - Propiedad o función para agrupar
 * @returns {Object}
 */
export function groupBy(array, keyOrFunction) {
  if (!Array.isArray(array)) return {};

  return array.reduce((groups, item) => {
    const key = typeof keyOrFunction === 'function'
      ? keyOrFunction(item)
      : getNestedProperty(item, keyOrFunction);

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
}

/**
 * Obtiene propiedad anidada de un objeto
 * @param {Object} obj - Objeto
 * @param {string} path - Ruta de la propiedad (ej: 'user.profile.name')
 * @returns {any}
 */
export function getNestedProperty(obj, path) {
  if (!obj || !path) return undefined;

  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

/**
 * Establece propiedad anidada en un objeto
 * @param {Object} obj - Objeto
 * @param {string} path - Ruta de la propiedad
 * @param {any} value - Valor a establecer
 */
export function setNestedProperty(obj, path, value) {
  if (!obj || !path) return;

  const keys = path.split('.');
  const lastKey = keys.pop();

  const target = keys.reduce((current, key) => {
    if (current[key] === undefined) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

/**
 * Clona objeto profundamente
 * @param {any} obj - Objeto a clonar
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (typeof obj === 'object') {
    const cloned = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone(obj[key]);
    });
    return cloned;
  }
  return obj;
}

/**
 * Combina objetos profundamente
 * @param {Object} target - Objeto objetivo
 * @param {...Object} sources - Objetos fuente
 * @returns {Object}
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Verifica si un valor es un objeto
 * @param {any} item - Valor a verificar
 * @returns {boolean}
 */
export function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Debounce para funciones
 * @param {Function} func - Función a aplicar debounce
 * @param {number} wait - Tiempo de espera en ms
 * @param {boolean} immediate - Ejecutar inmediatamente
 * @returns {Function}
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle para funciones
 * @param {Function} func - Función a aplicar throttle
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Convierte FormData a objeto
 * @param {FormData} formData - FormData a convertir
 * @returns {Object}
 */
export function formDataToObject(formData) {
  const obj = {};
  for (let [key, value] of formData.entries()) {
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

/**
 * Convierte objeto a parámetros de URL
 * @param {Object} params - Parámetros
 * @returns {string}
 */
export function objectToURLParams(params) {
  if (!params || typeof params !== 'object') return '';

  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(key => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else {
        searchParams.append(key, value);
      }
    }
  });

  return searchParams.toString();
}

/**
 * Convierte parámetros de URL a objeto
 * @param {string} search - String de búsqueda
 * @returns {Object}
 */
export function urlParamsToObject(search) {
  const params = new URLSearchParams(search);
  const obj = {};

  for (let [key, value] of params.entries()) {
    if (obj[key]) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value);
      } else {
        obj[key] = [obj[key], value];
      }
    } else {
      obj[key] = value;
    }
  }

  return obj;
}

/**
 * Hash simple de string (para desarrollo)
 * @param {string} str - String a hashear
 * @returns {string}
 */
export function simpleHash(str) {
  if (!str) return '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Hash de contraseña simple (SOLO PARA DESARROLLO)
 * @param {string} password - Contraseña
 * @returns {string}
 */
export function hashPassword(password) {
  // ADVERTENCIA: Solo para desarrollo. En producción usar bcrypt
  if (!password) return '';
  return btoa(password + 'salt_secretaria_salud_tolima');
}

/**
 * Verifica contraseña hasheada simple (SOLO PARA DESARROLLO)
 * @param {string} password - Contraseña plana
 * @param {string} hash - Hash a verificar
 * @returns {boolean}
 */
export function verifyPassword(password, hash) {
  // ADVERTENCIA: Solo para desarrollo. En producción usar bcrypt
  if (!password || !hash) return false;
  return hashPassword(password) === hash;
}

/**
 * Genera contraseña aleatoria
 * @param {number} length - Longitud de la contraseña
 * @param {boolean} includeSymbols - Incluir símbolos
 * @returns {string}
 */
export function generatePassword(length = 12, includeSymbols = true) {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let chars = lowercase + uppercase + numbers;
  if (includeSymbols) chars += symbols;

  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return password;
}

/**
 * Verifica fortaleza de contraseña
 * @param {string} password - Contraseña a verificar
 * @returns {Object}
 */
export function checkPasswordStrength(password) {
  if (!password) return { score: 0, message: 'Contraseña requerida' };

  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
  };

  score += checks.length ? 1 : 0;
  score += checks.lowercase ? 1 : 0;
  score += checks.uppercase ? 1 : 0;
  score += checks.numbers ? 1 : 0;
  score += checks.symbols ? 1 : 0;

  let message = '';
  switch (score) {
    case 0:
    case 1:
      message = 'Muy débil';
      break;
    case 2:
      message = 'Débil';
      break;
    case 3:
      message = 'Regular';
      break;
    case 4:
      message = 'Fuerte';
      break;
    case 5:
      message = 'Muy fuerte';
      break;
  }

  return { score, message, checks };
}

/**
 * Filtra array removiendo duplicados
 * @param {Array} array - Array original
 * @param {string} key - Clave para comparar (opcional)
 * @returns {Array}
 */
export function removeDuplicates(array, key = null) {
  if (!Array.isArray(array)) return [];

  if (key) {
    const seen = new Set();
    return array.filter(item => {
      const value = getNestedProperty(item, key);
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  return [...new Set(array)];
}

/**
 * Mezcla array aleatoriamente
 * @param {Array} array - Array a mezclar
 * @returns {Array}
 */
export function shuffleArray(array) {
  if (!Array.isArray(array)) return [];

  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Obtiene elementos aleatorios de un array
 * @param {Array} array - Array original
 * @param {number} count - Cantidad de elementos
 * @returns {Array}
 */
export function getRandomElements(array, count) {
  if (!Array.isArray(array)) return [];
  if (count >= array.length) return [...array];

  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

/**
 * Convierte bytes a formato legible
 * @param {number} bytes - Bytes
 * @param {number} decimals - Decimales
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Descarga archivo desde blob
 * @param {Blob} blob - Blob a descargar
 * @param {string} filename - Nombre del archivo
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  } catch (err) {
    console.error('Error al copiar al portapapeles:', err);
    return false;
  }
}

/**
 * Detecta si es dispositivo móvil
 * @returns {boolean}
 */
export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Detecta si es dispositivo táctil
 * @returns {boolean}
 */
export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Obtiene información del navegador
 * @returns {Object}
 */
export function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let version = 'Unknown';

  if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    version = ua.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    version = ua.match(/Firefox\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
    version = ua.match(/Version\/(\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browser = 'Edge';
    version = ua.match(/Edge\/(\d+)/)?.[1] || 'Unknown';
  }

  return { browser, version, userAgent: ua };
}

// Exportación por defecto
export default {
  generateId,
  validateEmail,
  validateInstitutionalEmail,
  validatePhone,
  capitalize,
  capitalizeFirst,
  slugify,
  truncate,
  escapeHtml,
  unescapeHtml,
  formatNumber,
  formatCurrency,
  calculatePercentage,
  sortByProperty,
  groupBy,
  getNestedProperty,
  setNestedProperty,
  deepClone,
  deepMerge,
  isObject,
  debounce,
  throttle,
  formDataToObject,
  objectToURLParams,
  urlParamsToObject,
  simpleHash,
  hashPassword,
  verifyPassword,
  generatePassword,
  checkPasswordStrength,
  removeDuplicates,
  shuffleArray,
  getRandomElements,
  formatBytes,
  downloadBlob,
  copyToClipboard,
  isMobile,
  isTouchDevice,
  getBrowserInfo
};