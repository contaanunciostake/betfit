// Utility functions for safe formatting

/**
 * Safely formats a number as currency
 * @param {number|string|null|undefined} value - The value to format
 * @param {string} currency - Currency code (default: 'BRL')
 * @param {string} locale - Locale (default: 'pt-BR')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, currency = 'BRL', locale = 'pt-BR') => {
  // Convert to number and handle null/undefined/NaN
  const numValue = parseFloat(value) || 0;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  } catch (error) {
    // Fallback formatting
    return `R$ ${numValue.toFixed(2).replace('.', ',')}`;
  }
};

/**
 * Safely formats a number with decimal places
 * @param {number|string|null|undefined} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, decimals = 2) => {
  const numValue = parseFloat(value) || 0;
  return numValue.toFixed(decimals);
};

/**
 * Safely formats a percentage
 * @param {number|string|null|undefined} value - The value to format (0-100)
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 1) => {
  const numValue = parseFloat(value) || 0;
  return `${numValue.toFixed(decimals)}%`;
};

/**
 * Safely formats a large number with K/M suffixes
 * @param {number|string|null|undefined} value - The value to format
 * @returns {string} Formatted number with suffix
 */
export const formatCompactNumber = (value) => {
  const numValue = parseFloat(value) || 0;
  
  if (numValue >= 1000000) {
    return `${(numValue / 1000000).toFixed(1)}M`;
  } else if (numValue >= 1000) {
    return `${(numValue / 1000).toFixed(1)}K`;
  }
  
  return numValue.toString();
};

/**
 * Safely parses a string to number
 * @param {string|number|null|undefined} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed number or default
 */
export const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Safely parses a string to integer
 * @param {string|number|null|undefined} value - The value to parse
 * @param {number} defaultValue - Default value if parsing fails
 * @returns {number} Parsed integer or default
 */
export const safeParseInt = (value, defaultValue = 0) => {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Checks if a value is a valid number
 * @param {any} value - The value to check
 * @returns {boolean} True if valid number
 */
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * Formats time duration in minutes to human readable format
 * @param {number|string|null|undefined} minutes - Duration in minutes
 * @returns {string} Formatted duration
 */
export const formatDuration = (minutes) => {
  const numMinutes = safeParseInt(minutes);
  
  if (numMinutes < 60) {
    return `${numMinutes}min`;
  }
  
  const hours = Math.floor(numMinutes / 60);
  const remainingMinutes = numMinutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Formats distance in meters to human readable format
 * @param {number|string|null|undefined} meters - Distance in meters
 * @returns {string} Formatted distance
 */
export const formatDistance = (meters) => {
  const numMeters = safeParseFloat(meters);
  
  if (numMeters >= 1000) {
    return `${(numMeters / 1000).toFixed(1)} km`;
  }
  
  return `${numMeters.toFixed(0)} m`;
};

export default {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatCompactNumber,
  safeParseFloat,
  safeParseInt,
  isValidNumber,
  formatDuration,
  formatDistance
};

