/**
 * Constantes centralizadas del proyecto Mundial 2026 Predicciones.
 * @module config
 */

/** Correlación intra-grupo entre partidos del mismo grupo (ρ). */
export const RHO_INTRA_GROUP = 0.12;

/** Puntos de confianza por gol de diferencia extra en factor de forma. */
export const PESO_FORMA = 4;

/** Límite máximo de ajuste por forma (± puntos de confianza). */
export const FORMA_CLAMP = 15;

/** Confianza mínima y máxima tras ajustes. */
export const CONF_MIN = 5;
export const CONF_MAX = 97;

/** Umbrales para colorear barras de confianza. */
export const CONF_LEVEL_HIGH = 70;
export const CONF_LEVEL_MED = 52;

/** Curva en U para marcador exacto: probabilidad base y rango. */
export const SCORELINE_BASE = 0.06;
export const SCORELINE_RANGE = 0.08;

/** URL de datos en vivo (openfootball, CORS sin API key). */
export const LIVE_DATA_URL =
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';

/** Timeout del fetch de resultados en vivo (ms). */
export const LIVE_FETCH_TIMEOUT_MS = 12000;

/** Buckets del histograma de confianza. */
export const CONFIDENCE_BUCKETS = [
  { label: '<50%', min: 0, max: 50, color: '#c0392b' },
  { label: '50-59%', min: 50, max: 60, color: '#e67e22' },
  { label: '60-69%', min: 60, max: 70, color: 'var(--gold)' },
  { label: '70-79%', min: 70, max: 80, color: 'var(--silver)' },
  { label: '80-89%', min: 80, max: 90, color: '#27ae60' },
  { label: '90%+', min: 90, max: 101, color: '#1abc9c' },
];

/** Clases CSS para badges de clasificación. */
export const BADGE_CLASS = {
  '1': 'badge-1',
  '2': 'badge-2',
  '3t': 'badge-3',
  E: 'badge-out',
};

/** Metadatos del sitio. */
export const SITE = {
  brand: 'RAM — Predicciones Deportivas',
  title: 'Copa del Mundo FIFA 2026 — Predicciones Analíticas',
  description:
    'Predicciones del Mundial 2026 con modelo estadístico, factor de forma y resultados en vivo desde openfootball.',
  generatedDate: '10 Jun 2026',
  snapshotDate: '14 jun 2026',
  year: new Date().getFullYear(),
};
