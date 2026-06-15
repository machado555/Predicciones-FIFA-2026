import { RHO_INTRA_GROUP, SCORELINE_BASE, SCORELINE_RANGE } from '../config.js';
import { GROUPS } from '../data/groups.js';

/**
 * Confianzas por grupo (12 × 6 partidos).
 * @returns {number[][]}
 */
export function getProbGroupsConfs() {
  return GROUPS.map((g) => g.matches.map((m) => m.conf));
}

/**
 * Probabilidad de acertar marcador exacto según confianza (curva en U).
 * Partidos parejos (~50%) → ~6%; goleadas claras → hasta ~14%.
 *
 * @param {number} conf - Confianza del partido (0–100).
 * @returns {number} Probabilidad en escala 0–1.
 */
export function scorelineAccuracy(conf) {
  const dist = Math.abs(conf - 50) / 50;
  return SCORELINE_BASE + SCORELINE_RANGE * dist;
}

/**
 * Convierte confianzas a modo marcador exacto (porcentaje redondeado).
 * @param {number[]} arr
 * @returns {number[]}
 */
export function applyScoreMode(arr) {
  return arr.map((p) => Math.max(1, Math.round(p * scorelineAccuracy(p))));
}

/** @param {number} x */
function erf(x) {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/**
 * Función de distribución acumulada normal estándar.
 * @param {number} x
 * @returns {number}
 */
export function normalCDF(x) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

/**
 * P(X ≥ k) bajo aproximación normal con media y desviación dadas.
 * @param {number} mean
 * @param {number} sd
 * @param {number} k
 * @returns {number}
 */
export function pAboveK(mean, sd, k) {
  return 1 - normalCDF((k - mean) / sd);
}

/**
 * Estadísticas básicas de un array de confianzas (%).
 * @param {number[]} arr
 */
export function statsOf(arr) {
  const n = arr.length;
  const mean = arr.reduce((s, p) => s + p / 100, 0);
  const vari = arr.reduce((s, p) => s + (p / 100) * (1 - p / 100), 0);
  const lnP = arr.reduce((s, p) => s + Math.log(Math.max(p / 100, 1e-10)), 0);
  const avgC = arr.reduce((s, p) => s + p, 0) / n;
  return { n, mean, vari, lnP, avgC };
}

/**
 * Estadísticas agregadas con correlación intra-grupo (ρ).
 *
 * Supuesto: errores de calibración dentro de un grupo están correlacionados;
 * Var(Total) = Σ Var(Xi) + 2·Σ_{i<j, mismo grupo} ρ·√(Var(Xi)·Var(Xj)).
 *
 * @param {number[][]} groupsArr - Confianzas agrupadas por grupo.
 * @returns {{ n: number, mean: number, vari: number, lnP: number, avgC: number, sd: number }}
 */
export function correlatedStats(groupsArr) {
  const flat = groupsArr.flat();
  const base = statsOf(flat);
  let extraCov = 0;

  groupsArr.forEach((g) => {
    const vars = g.map((p) => (p / 100) * (1 - p / 100));
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        extraCov += RHO_INTRA_GROUP * Math.sqrt(vars[i] * vars[j]);
      }
    }
  });

  const variAdj = base.vari + 2 * extraCov;
  return { ...base, sd: Math.sqrt(variAdj) };
}

/**
 * Formatea probabilidad para UI.
 * @param {number} p - Porcentaje.
 * @returns {string}
 */
export function fmtProb(p) {
  if (p < 0.0001) return '<0.0001%';
  if (p < 0.01) return `${p.toFixed(4)}%`;
  if (p < 1) return `${p.toFixed(2)}%`;
  return `${p.toFixed(1)}%`;
}

/**
 * Etiquetas de grupo para tablas de probabilidad.
 * @returns {string[]}
 */
export function getProbGroupLabels() {
  return GROUPS.map((g) => {
    const parts = g.label.split('—');
    return `${g.letter} — ${parts[1].trim()}`;
  });
}
