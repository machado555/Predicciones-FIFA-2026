import { LIVE_DATA_URL, LIVE_FETCH_TIMEOUT_MS, SITE } from '../config.js';
import { GROUPS } from '../data/groups.js';
import { applyFormAdjustments } from '../models/formAdjustment.js';
import { flagOf, teamsMatch } from '../utils.js';
import { renderGroups } from '../render/groups.js';
import { renderProbability } from '../render/probability.js';

/** Mapeo emoji de bandera → nombre en openfootball/worldcup.json (inglés). */
export const FLAG_TO_OPENFOOTBALL = {
  '🇲🇽': 'Mexico',
  '🇿🇦': 'South Africa',
  '🇰🇷': 'South Korea',
  '🇨🇿': 'Czech Republic',
  '🇨🇦': 'Canada',
  '🇧🇦': 'Bosnia',
  '🇶🇦': 'Qatar',
  '🇨🇭': 'Switzerland',
  '🇧🇷': 'Brazil',
  '🇲🇦': 'Morocco',
  '🇭🇹': 'Haiti',
  '🏴󠁧󠁢󠁳󠁣󠁴󠁿': 'Scotland',
  '🇺🇸': 'USA',
  '🇵🇾': 'Paraguay',
  '🇦🇺': 'Australia',
  '🇹🇷': 'Turkey',
  '🇩🇪': 'Germany',
  '🇨🇼': 'Curacao',
  '🇨🇮': 'Ivory Coast',
  '🇪🇨': 'Ecuador',
  '🇳🇱': 'Netherlands',
  '🇯🇵': 'Japan',
  '🇸🇪': 'Sweden',
  '🇹🇳': 'Tunisia',
  '🇧🇪': 'Belgium',
  '🇪🇬': 'Egypt',
  '🇮🇷': 'Iran',
  '🇳🇿': 'New Zealand',
  '🇪🇸': 'Spain',
  '🇨🇻': 'Cape Verde',
  '🇸🇦': 'Saudi Arabia',
  '🇺🇾': 'Uruguay',
  '🇫🇷': 'France',
  '🇸🇳': 'Senegal',
  '🇮🇶': 'Iraq',
  '🇳🇴': 'Norway',
  '🇦🇷': 'Argentina',
  '🇩🇿': 'Algeria',
  '🇦🇹': 'Austria',
  '🇯🇴': 'Jordan',
  '🇵🇹': 'Portugal',
  '🇨🇩': 'DR Congo',
  '🇺🇿': 'Uzbekistan',
  '🇨🇴': 'Colombia',
  '🏴󠁧󠁢󠁥󠁮󠁧󠁿': 'England',
  '🇭🇷': 'Croatia',
  '🇬🇭': 'Ghana',
  '🇵🇦': 'Panama',
};

export let liveResultsLoaded = false;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isValidLivePayload(data) {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray(data.matches) &&
    data.matches.every(
      (m) =>
        typeof m === 'object' &&
        m !== null &&
        (m.team1 === undefined || typeof m.team1 === 'string') &&
        (m.team2 === undefined || typeof m.team2 === 'string')
    )
  );
}

function setLiveLoading(loading) {
  const tracker = document.getElementById('live-tracker');
  const spinner = document.getElementById('live-spinner');
  if (tracker) tracker.classList.toggle('is-loading', loading);
  if (spinner) spinner.hidden = !loading;
}

function setLiveStatus(html, color) {
  const statusEl = document.getElementById('live-status');
  if (!statusEl) return;
  statusEl.innerHTML = html;
  if (color) statusEl.style.color = color;
}

/** Carga resultados en vivo y re-renderiza con fallback al snapshot estático. */
export async function loadLiveResults() {
  setLiveLoading(true);
  setLiveStatus(
    '⏳ Cargando resultados en tiempo real desde <a href="https://github.com/openfootball/worldcup.json" target="_blank" rel="noopener">openfootball/worldcup.json</a>…',
    'var(--muted)'
  );

  try {
    const res = await fetchWithTimeout(LIVE_DATA_URL, LIVE_FETCH_TIMEOUT_MS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!isValidLivePayload(data)) {
      throw new Error('Formato JSON inválido (falta array matches)');
    }

    const liveMatches = data.matches;
    let updatedCount = 0;

    GROUPS.forEach((g) => {
      g.matches.forEach((m) => {
        const homeName = FLAG_TO_OPENFOOTBALL[flagOf(m.h)];
        const awayName = FLAG_TO_OPENFOOTBALL[flagOf(m.a)];
        if (!homeName || !awayName) return;

        const found = liveMatches.find(
          (lm) =>
            (teamsMatch(homeName, lm.team1) && teamsMatch(awayName, lm.team2)) ||
            (teamsMatch(awayName, lm.team1) && teamsMatch(homeName, lm.team2))
        );

        if (found?.score && Array.isArray(found.score.ft) && found.score.ft.length >= 2) {
          let [s1, s2] = found.score.ft;
          if (!teamsMatch(homeName, found.team1)) [s1, s2] = [s2, s1];
          const realScore = `${s1}-${s2}`;
          if (m.real !== realScore) {
            m.real = realScore;
            m.played = true;
            m.liveSource = true;
            updatedCount++;
          }
        }
      });
    });

    liveResultsLoaded = true;
    setLiveStatus(
      updatedCount > 0
        ? `🟢 Datos en vivo cargados — ${updatedCount} resultado(s) actualizados desde openfootball/worldcup.json`
        : '🟢 Datos en vivo cargados — sin cambios respecto al snapshot guardado',
      '#2ecc71'
    );

    applyFormAdjustments();
    renderGroups();
    renderProbability();
  } catch (err) {
    const message = err.name === 'AbortError' ? 'Tiempo de espera agotado' : err.message;
    setLiveStatus(
      `🟡 No se pudieron cargar datos en vivo (${message}). Mostrando snapshot guardado del ${SITE.snapshotDate}.`,
      'var(--muted)'
    );
    console.warn('Live data fetch failed:', err);
  } finally {
    setLiveLoading(false);
  }
}
