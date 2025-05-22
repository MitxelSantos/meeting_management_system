/**
 * Validadores del sistema
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

import { VALIDATION_RULES, REGEX_PATTERNS } from './constants.js';
import { parseDate, isValidDate } from './dateUtils.js';

/**
 * Clase base para validadores
 */
export class Validator {
  constructor() {
    this.errors = [];
  }

  /**
   * Limpia errores
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Agrega un error
   * @param {string} field - Campo con error
   * @param {string} message - Mensaje de error
   */
  addError(field, message) {
    this.errors.push({ field, message });
  }

  /**
   * Verifica si hay errores
   * @returns {boolean}
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Obtiene errores
   * @returns {Array}
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Obtiene errores por campo
   * @param {string} field - Campo
   * @returns {Array}
   */
  getFieldErrors(field) {
    return this.errors.filter(error => error.field === field);
  }
}

/**
 * Validador de campos requeridos
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object}
 */
export function validateRequired(value, fieldName = 'Campo') {
  const isValid = value !== null && value !== undefined &&
    (typeof value === 'string' ? value.trim() !== '' : Boolean(value));

  return {
    isValid,
    error: isValid ? null : `${fieldName} es requerido`
  };
}

/**
 * Validador de longitud mínima
 * @param {string} value - Valor a validar
 * @param {number} minLength - Longitud mínima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object}
 */
export function validateMinLength(value, minLength, fieldName = 'Campo') {
  if (!value) return { isValid: true, error: null };

  const isValid = value.length >= minLength;

  return {
    isValid,
    error: isValid ? null : `${fieldName} debe tener al menos ${minLength} caracteres`
  };
}

/**
 * Validador de longitud máxima
 * @param {string} value - Valor a validar
 * @param {number} maxLength - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object}
 */
export function validateMaxLength(value, maxLength, fieldName = 'Campo') {
  if (!value) return { isValid: true, error: null };

  const isValid = value.length <= maxLength;

  return {
    isValid,
    error: isValid ? null : `${fieldName} no puede exceder ${maxLength} caracteres`
  };
}

/**
 * Validador de email
 * @param {string} email - Email a validar
 * @returns {Object}
 */
export function validateEmail(email) {
  if (!email) return { isValid: false, error: 'Email es requerido' };

  const isValid = VALIDATION_RULES.EMAIL_REGEX.test(email);

  return {
    isValid,
    error: isValid ? null : 'Formato de email inválido'
  };
}

/**
 * Validador de email institucional
 * @param {string} email - Email a validar
 * @returns {Object}
 */
export function validateInstitutionalEmail(email) {
  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) return emailValidation;

  const isValid = REGEX_PATTERNS.COLOMBIAN_EMAIL.test(email);

  return {
    isValid,
    error: isValid ? null : 'Debe usar un email institucional (@saludtolima.gov.co o @tolima.gov.co)'
  };
}

/**
 * Validador de teléfono colombiano
 * @param {string} phone - Teléfono a validar
 * @returns {Object}
 */
export function validatePhone(phone) {
  if (!phone) return { isValid: true, error: null }; // Opcional

  const cleanPhone = phone.replace(/\s/g, '');
  const isValid = REGEX_PATTERNS.PHONE_NUMBER.test(cleanPhone);

  return {
    isValid,
    error: isValid ? null : 'Formato de teléfono inválido (ej: 3001234567 or +573001234567)'
  };
}

/**
 * Validador de contraseña
 * @param {string} password - Contraseña a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validatePassword(password, options = {}) {
  const minLength = options.minLength || VALIDATION_RULES.PASSWORD_MIN_LENGTH;
  const requireStrong = options.requireStrong || false;

  if (!password) {
    return { isValid: false, error: 'Contraseña es requerida' };
  }

  if (password.length < minLength) {
    return {
      isValid: false,
      error: `La contraseña debe tener al menos ${minLength} caracteres`
    };
  }

  if (requireStrong) {
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (!hasLowercase || !hasUppercase || !hasNumbers || !hasSymbols) {
      return {
        isValid: false,
        error: 'La contraseña debe contener al menos: una minúscula, una mayúscula, un número y un símbolo'
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validador de confirmación de contraseña
 * @param {string} password - Contraseña original
 * @param {string} confirmPassword - Confirmación de contraseña
 * @returns {Object}
 */
export function validatePasswordConfirmation(password, confirmPassword) {
  if (!confirmPassword) {
    return { isValid: false, error: 'Confirmación de contraseña es requerida' };
  }

  const isValid = password === confirmPassword;

  return {
    isValid,
    error: isValid ? null : 'Las contraseñas no coinciden'
  };
}

/**
 * Validador de fecha
 * @param {string} dateValue - Fecha a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validateDate(dateValue, options = {}) {
  if (!dateValue) {
    return options.required ?
      { isValid: false, error: 'Fecha es requerida' } :
      { isValid: true, error: null };
  }

  const date = parseDate(dateValue);
  if (!isValidDate(date)) {
    return { isValid: false, error: 'Formato de fecha inválido' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Validar fecha mínima
  if (options.minDate) {
    const minDate = new Date(options.minDate);
    if (date < minDate) {
      return {
        isValid: false,
        error: `La fecha no puede ser anterior a ${minDate.toLocaleDateString('es-CO')}`
      };
    }
  }

  // Validar fecha máxima
  if (options.maxDate) {
    const maxDate = new Date(options.maxDate);
    if (date > maxDate) {
      return {
        isValid: false,
        error: `La fecha no puede ser posterior a ${maxDate.toLocaleDateString('es-CO')}`
      };
    }
  }

  // No permitir fechas pasadas por defecto
  if (options.noFuture === true && date > now) {
    return { isValid: false, error: 'No se permiten fechas futuras' };
  }

  // No permitir fechas pasadas por defecto
  if (options.noPast !== false && date < now) {
    return { isValid: false, error: 'No se permiten fechas pasadas' };
  }

  return { isValid: true, error: null };
}

/**
 * Validador de hora
 * @param {string} timeValue - Hora a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validateTime(timeValue, options = {}) {
  if (!timeValue) {
    return options.required ?
      { isValid: false, error: 'Hora es requerida' } :
      { isValid: true, error: null };
  }

  const isValid = REGEX_PATTERNS.TIME_24H.test(timeValue);
  if (!isValid) {
    return { isValid: false, error: 'Formato de hora inválido (HH:MM)' };
  }

  const [hours, minutes] = timeValue.split(':').map(Number);

  // Validar horario laboral
  if (options.workingHours) {
    if (hours < 7 || hours >= 18) {
      return {
        isValid: false,
        error: 'La hora debe estar dentro del horario laboral (07:00 - 18:00)'
      };
    }

    // Evitar hora de almuerzo
    if (hours >= 12 && hours < 14) {
      return {
        isValid: false,
        error: 'No se permiten reuniones durante la hora de almuerzo (12:00 - 14:00)'
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validador de rango de tiempo
 * @param {string} startTime - Hora de inicio
 * @param {string} endTime - Hora de fin
 * @returns {Object}
 */
export function validateTimeRange(startTime, endTime) {
  const startValidation = validateTime(startTime, { required: true });
  if (!startValidation.isValid) return startValidation;

  const endValidation = validateTime(endTime, { required: true });
  if (!endValidation.isValid) return endValidation;

  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);

  if (start >= end) {
    return {
      isValid: false,
      error: 'La hora de fin debe ser posterior a la hora de inicio'
    };
  }

  const diffMinutes = (end - start) / (1000 * 60);

  if (diffMinutes < 15) {
    return {
      isValid: false,
      error: 'La duración mínima de una reunión es 15 minutos'
    };
  }

  if (diffMinutes > 480) {
    return {
      isValid: false,
      error: 'La duración máxima de una reunión es 8 horas'
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validador de URL
 * @param {string} url - URL a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validateURL(url, options = {}) {
  if (!url) {
    return options.required ?
      { isValid: false, error: 'URL es requerida' } :
      { isValid: true, error: null };
  }

  try {
    const urlObj = new URL(url);

    // Validar protocolos permitidos
    const allowedProtocols = options.protocols || ['http:', 'https:'];
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: `Protocolo no permitido. Use: ${allowedProtocols.join(', ')}`
      };
    }

    return { isValid: true, error: null };
  } catch (error) {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
}

/**
 * Validador de número
 * @param {any} value - Valor a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validateNumber(value, options = {}) {
  if (!value && value !== 0) {
    return options.required ?
      { isValid: false, error: 'Número es requerido' } :
      { isValid: true, error: null };
  }

  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Debe ser un número válido' };
  }

  if (options.min !== undefined && num < options.min) {
    return {
      isValid: false,
      error: `El valor mínimo es ${options.min}`
    };
  }

  if (options.max !== undefined && num > options.max) {
    return {
      isValid: false,
      error: `El valor máximo es ${options.max}`
    };
  }

  if (options.integer && !Number.isInteger(num)) {
    return { isValid: false, error: 'Debe ser un número entero' };
  }

  return { isValid: true, error: null };
}

/**
 * Validador de selección (select/dropdown)
 * @param {any} value - Valor seleccionado
 * @param {Array} validOptions - Opciones válidas
 * @param {string} fieldName - Nombre del campo
 * @returns {Object}
 */
export function validateSelection(value, validOptions, fieldName = 'Campo') {
  if (!value) {
    return { isValid: false, error: `${fieldName} es requerido` };
  }

  const isValid = validOptions.includes(value);

  return {
    isValid,
    error: isValid ? null : `${fieldName} contiene una opción inválida`
  };
}

/**
 * Validador de lista de emails
 * @param {string} emailsString - String con emails separados por comas
 * @returns {Object}
 */
export function validateEmailList(emailsString) {
  if (!emailsString || !emailsString.trim()) {
    return { isValid: true, error: null }; // Lista vacía es válida
  }

  const emails = emailsString.split(',').map(email => email.trim()).filter(email => email);
  const invalidEmails = [];

  for (const email of emails) {
    const validation = validateEmail(email);
    if (!validation.isValid) {
      invalidEmails.push(email);
    }
  }

  if (invalidEmails.length > 0) {
    return {
      isValid: false,
      error: `Emails inválidos: ${invalidEmails.join(', ')}`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validador de archivo
 * @param {File} file - Archivo a validar
 * @param {Object} options - Opciones de validación
 * @returns {Object}
 */
export function validateFile(file, options = {}) {
  if (!file) {
    return options.required ?
      { isValid: false, error: 'Archivo es requerido' } :
      { isValid: true, error: null };
  }

  // Validar tamaño
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
    return {
      isValid: false,
      error: `El archivo no puede exceder ${maxSizeMB}MB`
    };
  }

  // Validar tipo
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Tipo de archivo no permitido. Tipos válidos: ${options.allowedTypes.join(', ')}`
    };
  }

  // Validar extensión
  if (options.allowedExtensions) {
    const extension = file.name.split('.').pop().toLowerCase();
    if (!options.allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Extensión no permitida. Extensiones válidas: ${options.allowedExtensions.join(', ')}`
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Validador personalizado usando función
 * @param {any} value - Valor a validar
 * @param {Function} validatorFn - Función validadora
 * @param {string} errorMessage - Mensaje de error
 * @returns {Object}
 */
export function validateCustom(value, validatorFn, errorMessage = 'Valor inválido') {
  try {
    const isValid = validatorFn(value);

    return {
      isValid: Boolean(isValid),
      error: isValid ? null : errorMessage
    };
  } catch (error) {
    return { isValid: false, error: errorMessage };
  }
}

/**
 * Validador de formulario completo
 * @param {Object} data - Datos del formulario
 * @param {Object} rules - Reglas de validación
 * @returns {Object}
 */
export function validateForm(data, rules) {
  const validator = new Validator();

  Object.keys(rules).forEach(field => {
    const fieldRules = rules[field];
    const value = data[field];

    // Ejecutar cada regla para el campo
    fieldRules.forEach(rule => {
      const result = rule.validator(value, rule.options);

      if (!result.isValid) {
        validator.addError(field, result.error);
      }
    });
  });

  return {
    isValid: !validator.hasErrors(),
    errors: validator.getErrors(),
    errorsByField: Object.keys(rules).reduce((acc, field) => {
      acc[field] = validator.getFieldErrors(field);
      return acc;
    }, {})
  };
}

/**
 * Conjunto de validadores predefinidos para reuniones
 */
export const MeetingValidators = {
  title: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateMaxLength(value, 100, 'Título'), options: {} }
  ],

  description: [
    { validator: (value) => validateMaxLength(value, 500, 'Descripción'), options: {} }
  ],

  date: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateDate(value, { required: true, noPast: true }), options: {} }
  ],

  startTime: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateTime(value, { required: true, workingHours: true }), options: {} }
  ],

  endTime: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateTime(value, { required: true, workingHours: true }), options: {} }
  ],

  attendees: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateMaxLength(value, 1000, 'Asistentes'), options: {} }
  ],

  externalEmails: [
    { validator: validateEmailList, options: {} }
  ],

  agenda: [
    { validator: (value) => validateMaxLength(value, 2000, 'Agenda'), options: {} }
  ],

  notes: [
    { validator: (value) => validateMaxLength(value, 2000, 'Notas'), options: {} }
  ]
};

/**
 * Conjunto de validadores predefinidos para usuarios
 */
export const UserValidators = {
  name: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validateMinLength(value, 2, 'Nombre'), options: {} },
    { validator: (value) => validateMaxLength(value, 100, 'Nombre'), options: {} }
  ],

  email: [
    { validator: validateRequired, options: {} },
    { validator: validateInstitutionalEmail, options: {} }
  ],

  phone: [
    { validator: validatePhone, options: {} }
  ],

  password: [
    { validator: validateRequired, options: {} },
    { validator: (value) => validatePassword(value, { minLength: 6 }), options: {} }
  ]
};

// Exportación por defecto
export default {
  Validator,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateEmail,
  validateInstitutionalEmail,
  validatePhone,
  validatePassword,
  validatePasswordConfirmation,
  validateDate,
  validateTime,
  validateTimeRange,
  validateURL,
  validateNumber,
  validateSelection,
  validateEmailList,
  validateFile,
  validateCustom,
  validateForm,
  MeetingValidators,
  UserValidators
};