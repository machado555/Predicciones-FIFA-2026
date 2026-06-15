import { CONF_LEVEL_HIGH, CONF_LEVEL_MED } from './config.js';

/**
 * Extrae el emoji de bandera del string de equipo ("🇲🇽 México" → "🇲🇽").
 * @param {string} teamStr
 * @returns {string}
 */
export function flagOf(teamStr) {
  return teamStr.split(' ')[0];
}

/** Alias histórico usado en formAdjustment. */
export const flagOf2 = flagOf;

/**
 * Clase CSS de barra según nivel de confianza.
 * @param {number} conf - Porcentaje de confianza (0–100).
 * @returns {'fill-high'|'fill-med'|'fill-low'}
 */
export function getConfidenceLevel(conf) {
  if (conf >= CONF_LEVEL_HIGH) return 'fill-high';
  if (conf >= CONF_LEVEL_MED) return 'fill-med';
  return 'fill-low';
}

/**
 * Etiqueta legible para badge de clasificación.
 * @param {string} badge
 * @returns {string}
 */
export function formatQualifyBadge(badge) {
  if (badge === 'E') return 'OUT';
  if (badge === '3t') return '3°?';
  return `${badge}°`;
}

/**
 * Color inline para diferencia de goles.
 * @param {number} gd
 * @returns {string}
 */
export function goalDiffColor(gd) {
  return gd >= 0 ? '#7dcea0' : '#e74c3c';
}

/**
 * Formatea diferencia de goles con signo.
 * @param {number} gd
 * @returns {string}
 */
export function formatGoalDiff(gd) {
  return `${gd >= 0 ? '+' : ''}${gd}`;
}

/**
 * Crea un elemento DOM desde HTML string.
 * @param {string} html
 * @returns {HTMLElement}
 */
export function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

/**
 * Compara nombres de equipo con openfootball (flexible).
 * @param {string} name
 * @param {string} openfootballName
 * @returns {boolean}
 */
export function teamsMatch(name, openfootballName) {
  if (!name || !openfootballName) return false;
  const a = name.toLowerCase();
  const b = openfootballName.toLowerCase();
  return a === b || b.includes(a) || a.includes(b);
}
