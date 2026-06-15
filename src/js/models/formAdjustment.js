import { PESO_FORMA, FORMA_CLAMP, CONF_MIN, CONF_MAX } from '../config.js';
import { GROUPS } from '../data/groups.js';
import { flagOf2 } from '../utils.js';

/**
 * Calcula el factor de forma por bandera de equipo a partir de partidos ya jugados.
 *
 * Para cada equipo compara goles reales vs predichos en partidos disputados.
 * factorForma = promedio de ((GF_real - GF_esp) - (GC_real - GC_esp)) / 2
 * por partido jugado → "goles de diferencia extra por partido".
 *
 * @returns {Record<string, number>} Mapa bandera → factor de forma.
 */
export function computeFormFactors() {
  const factors = {};

  GROUPS.forEach((g) => {
    g.matches.forEach((m) => {
      if (!m.played || !m.real) return;

      const [eh, ea] = m.score.split('-').map((s) => parseFloat(s));
      const realParts = m.real.split('-').map((s) => parseFloat(s));
      if (realParts.length !== 2 || isNaN(realParts[0]) || isNaN(realParts[1])) return;

      const [rh, ra] = realParts;
      const homeFlag = flagOf2(m.h);
      const awayFlag = flagOf2(m.a);
      const homeDelta = ((rh - eh) - (ra - ea)) / 2;
      const awayDelta = ((ra - ea) - (rh - eh)) / 2;

      factors[homeFlag] = factors[homeFlag] || { sum: 0, n: 0 };
      factors[homeFlag].sum += homeDelta;
      factors[homeFlag].n += 1;
      factors[awayFlag] = factors[awayFlag] || { sum: 0, n: 0 };
      factors[awayFlag].sum += awayDelta;
      factors[awayFlag].n += 1;
    });
  });

  const result = {};
  Object.keys(factors).forEach((flag) => {
    result[flag] = factors[flag].sum / factors[flag].n;
  });
  return result;
}

/**
 * Aplica ajuste de forma a partidos futuros y guarda `conf` y `formNote` en cada match.
 *
 * El favorito (baseConf ≥ 50) recibe +su forma y −forma del rival.
 * ajuste = clamp((favForm - dogForm) * PESO_FORMA, ±FORMA_CLAMP).
 *
 * @returns {void} Mutación in-place de GROUPS[*].matches.
 */
export function applyFormAdjustments() {
  const formFactors = computeFormFactors();

  GROUPS.forEach((g) => {
    g.matches.forEach((m) => {
      if (m.played) {
        m.conf = m.baseConf;
        m.formNote = null;
        return;
      }

      const homeFlag = flagOf2(m.h);
      const awayFlag = flagOf2(m.a);
      const homeForm = formFactors[homeFlag] || 0;
      const awayForm = formFactors[awayFlag] || 0;
      const isHomeFavorite = m.baseConf >= 50;
      const favForm = isHomeFavorite ? homeForm : awayForm;
      const dogForm = isHomeFavorite ? awayForm : homeForm;
      let delta = (favForm - dogForm) * PESO_FORMA;
      delta = Math.max(-FORMA_CLAMP, Math.min(FORMA_CLAMP, delta));

      let conf = Math.round(m.baseConf + delta);
      conf = Math.max(CONF_MIN, Math.min(CONF_MAX, conf));
      m.conf = conf;

      if (Math.abs(delta) >= 1) {
        const dir = delta > 0 ? '↑' : '↓';
        const sign = delta > 0 ? '+' : '';
        m.formNote = `📊 ${dir} ${sign}${delta.toFixed(1)}% (de ${m.baseConf}%) — ajuste automático por forma reciente de los equipos`;
      } else {
        m.formNote = null;
      }
    });
  });
}
