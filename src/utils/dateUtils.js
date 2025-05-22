/**
 * Utilidades para manejo de fechas
 * @author Secretaría de Salud del Tolima
 * @version 1.0.0
 */

// Configuración de localización para Colombia
const LOCALE = 'es-CO';
const TIMEZONE = 'America/Bogota';

// Nombres de días y meses en español
export const DAYS = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles',
  'Jueves', 'Viernes', 'Sábado'
];

export const DAYS_SHORT = [
  'Dom', 'Lun', 'Mar', 'Mié',
  'Jue', 'Vie', 'Sáb'
];

export const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MONTHS_SHORT = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Formatea una fecha según el patrón especificado
 * @param {Date|string} date - Fecha a formatear
 * @param {string} pattern - Patrón de formato
 * @returns {string}
 */
export function formatDate(date, pattern = 'dd/MM/yyyy') {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const tokens = {
    'yyyy': d.getFullYear(),
    'yy': d.getFullYear().toString().substr(-2),
    'MM': String(d.getMonth() + 1).padStart(2, '0'),
    'M': d.getMonth() + 1,
    'dd': String(d.getDate()).padStart(2, '0'),
    'd': d.getDate(),
    'HH': String(d.getHours()).padStart(2, '0'),
    'H': d.getHours(),
    'mm': String(d.getMinutes()).padStart(2, '0'),
    'm': d.getMinutes(),
    'ss': String(d.getSeconds()).padStart(2, '0'),
    's': d.getSeconds(),
    'EEEE': DAYS[d.getDay()],
    'EEE': DAYS_SHORT[d.getDay()],
    'MMMM': MONTHS[d.getMonth()],
    'MMM': MONTHS_SHORT[d.getMonth()]
  };

  return pattern.replace(/yyyy|yy|MM|M|dd|d|HH|H|mm|m|ss|s|EEEE|EEE|MMMM|MMM/g, match => tokens[match]);
}

/**
 * Formatea una hora
 * @param {string} time - Hora en formato HH:mm
 * @param {boolean} includeSeconds - Si incluir segundos
 * @returns {string}
 */
export function formatTime(time, includeSeconds = false) {
  if (!time) return '';

  const [hours, minutes, seconds = '00'] = time.split(':');

  if (includeSeconds) {
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }

  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

/**
 * Obtiene la fecha y hora actual como timestamp ISO
 * @returns {string}
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Verifica si una fecha es hoy
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export function isToday(date) {
  if (!date) return false;

  const d = new Date(date);
  const today = new Date();

  return d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
}

/**
 * Verifica si una fecha es mañana
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export function isTomorrow(date) {
  if (!date) return false;

  const d = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear();
}

/**
 * Verifica si una fecha es fin de semana
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export function isWeekend(date) {
  if (!date) return false;

  const d = new Date(date);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Domingo o Sábado
}

/**
 * Agrega días a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} days - Días a agregar (puede ser negativo)
 * @returns {Date}
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Agrega meses a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} months - Meses a agregar (puede ser negativo)
 * @returns {Date}
 */
export function addMonths(date, months) {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Agrega minutos a una fecha
 * @param {Date|string} date - Fecha base
 * @param {number} minutes - Minutos a agregar (puede ser negativo)
 * @returns {Date}
 */
export function addMinutes(date, minutes) {
  const result = new Date(date);
  result.setMinutes(result.getMinutes() + minutes);
  return result;
}

/**
 * Obtiene el primer día del mes
 * @param {Date|string} date - Fecha de referencia
 * @returns {Date}
 */
export function getFirstDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/**
 * Obtiene el último día del mes
 * @param {Date|string} date - Fecha de referencia
 * @returns {Date}
 */
export function getLastDayOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/**
 * Obtiene el primer día de la semana (lunes)
 * @param {Date|string} date - Fecha de referencia
 * @returns {Date}
 */
export function getFirstDayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

/**
 * Obtiene el último día de la semana (domingo)
 * @param {Date|string} date - Fecha de referencia
 * @returns {Date}
 */
export function getLastDayOfWeek(date) {
  const firstDay = getFirstDayOfWeek(date);
  return addDays(firstDay, 6);
}

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number}
 */
export function daysDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calcula la diferencia en minutos entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha
 * @returns {number}
 */
export function minutesDifference(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60));
}

/**
 * Formatea una fecha de forma relativa (hace X tiempo)
 * @param {Date|string} date - Fecha a formatear
 * @param {Date} baseDate - Fecha base (por defecto ahora)
 * @returns {string}
 */
export function formatRelative(date, baseDate = new Date()) {
  const d = new Date(date);
  const base = new Date(baseDate);
  const diffMs = base.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'Ahora mismo';
  } else if (diffMinutes < 60) {
    return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} semana${weeks !== 1 ? 's' : ''}`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `Hace ${months} mes${months !== 1 ? 'es' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `Hace ${years} año${years !== 1 ? 's' : ''}`;
  }
}

/**
 * Parsea una fecha desde string
 * @param {string} dateString - String de fecha
 * @param {string} format - Formato esperado
 * @returns {Date|null}
 */
export function parseDate(dateString, format = 'dd/MM/yyyy') {
  if (!dateString) return null;

  try {
    // Para formatos ISO (yyyy-MM-dd)
    if (format === 'yyyy-MM-dd' || /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      return new Date(dateString);
    }

    // Para formato dd/MM/yyyy
    if (format === 'dd/MM/yyyy') {
      const parts = dateString.split('/');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Mes es 0-indexado
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
    }

    // Fallback: intentar parsing nativo
    const parsed = new Date(dateString);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch (error) {
    return null;
  }
}

/**
 * Valida si una fecha es válida
 * @param {Date|string} date - Fecha a validar
 * @returns {boolean}
 */
export function isValidDate(date) {
  if (!date) return false;

  const d = new Date(date);
  return !isNaN(d.getTime());
}

/**
 * Obtiene información sobre un rango de fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {Object}
 */
export function getDateRangeInfo(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!isValidDate(start) || !isValidDate(end)) {
    return { isValid: false };
  }

  const days = daysDifference(start, end);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);

  return {
    isValid: true,
    days,
    weeks,
    months,
    startDate: start,
    endDate: end,
    isStartBeforeEnd: start < end
  };
}

/**
 * Obtiene los días de trabajo en un rango de fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {Date[]}
 */
export function getWorkDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const workDays = [];

  let current = new Date(start);
  while (current <= end) {
    if (!isWeekend(current)) {
      workDays.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return workDays;
}

/**
 * Formatea duración en minutos a texto legible
 * @param {number} minutes - Minutos
 * @returns {string}
 */
export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min`;
  } else if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}min`;
  }
}

/**
 * Obtiene la zona horaria actual
 * @returns {string}
 */
export function getCurrentTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Convierte una fecha a la zona horaria de Colombia
 * @param {Date|string} date - Fecha a convertir
 * @returns {Date}
 */
export function toColombianTime(date) {
  const d = new Date(date);
  return new Date(d.toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Genera array de fechas entre dos fechas
 * @param {Date|string} startDate - Fecha de inicio
 * @param {Date|string} endDate - Fecha de fin
 * @returns {Date[]}
 */
export function getDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];

  let current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  return dates;
}

/**
 * Obtiene el nombre del mes en español
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {string}
 */
export function getMonthName(monthIndex) {
  return MONTHS[monthIndex] || '';
}

/**
 * Obtiene el nombre del día en español
 * @param {number} dayIndex - Índice del día (0-6)
 * @returns {string}
 */
export function getDayName(dayIndex) {
  return DAYS[dayIndex] || '';
}

/**
 * Verifica si es horario laboral
 * @param {Date|string} date - Fecha/hora a verificar
 * @returns {boolean}
 */
export function isWorkingHours(date) {
  const d = new Date(date);
  const hour = d.getHours();
  const day = d.getDay();

  // No es día laboral (sábado o domingo)
  if (day === 0 || day === 6) return false;

  // Fuera del horario laboral (7:00 - 18:00)
  if (hour < 7 || hour >= 18) return false;

  // Hora de almuerzo (12:00 - 14:00)
  if (hour >= 12 && hour < 14) return false;

  return true;
}

/**
 * Obtiene la próxima fecha laboral
 * @param {Date|string} date - Fecha base
 * @returns {Date}
 */
export function getNextWorkingDay(date) {
  let nextDay = addDays(date, 1);

  while (isWeekend(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }

  return nextDay;
}

/**
 * Formatea fecha para input HTML date
 * @param {Date|string} date - Fecha a formatear
 * @returns {string}
 */
export function formatForDateInput(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toISOString().split('T')[0];
}

/**
 * Formatea fecha para input HTML datetime-local
 * @param {Date|string} date - Fecha a formatear
 * @returns {string}
 */
export function formatForDateTimeInput(date) {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  // Ajustar a zona horaria local
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));

  return localDate.toISOString().slice(0, 16);
}

// Exportación por defecto con todas las funciones
export default {
  formatDate,
  formatTime,
  getCurrentTimestamp,
  isToday,
  isTomorrow,
  isWeekend,
  addDays,
  addMonths,
  addMinutes,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getFirstDayOfWeek,
  getLastDayOfWeek,
  daysDifference,
  minutesDifference,
  formatRelative,
  parseDate,
  isValidDate,
  getDateRangeInfo,
  getWorkDays,
  formatDuration,
  getCurrentTimezone,
  toColombianTime,
  getDateRange,
  getMonthName,
  getDayName,
  isWorkingHours,
  getNextWorkingDay,
  formatForDateInput,
  formatForDateTimeInput,
  DAYS,
  DAYS_SHORT,
  MONTHS,
  MONTHS_SHORT,
  LOCALE,
  TIMEZONE
};