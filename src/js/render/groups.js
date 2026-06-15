import { BADGE_CLASS } from '../config.js';
import { GROUPS } from '../data/groups.js';
import {
  formatGoalDiff,
  formatQualifyBadge,
  getConfidenceLevel,
  goalDiffColor,
} from '../utils.js';

function teamRowClass(badge) {
  if (badge === '1' || badge === '2') return 'qualified';
  if (badge === '3t') return 'qualified-3rd';
  return '';
}

function buildResultBadge(match) {
  if (!match.played) return null;

  const [ph, pa] = match.score.split('-').map(Number);
  const [rh, ra] = match.real.split('-').map(Number);
  const predWinner = ph > pa ? 'h' : ph < pa ? 'a' : 'd';
  const realWinner = rh > ra ? 'h' : rh < ra ? 'a' : 'd';
  const exactMatch = match.score === match.real;
  const winnerMatch = predWinner === realWinner;
  const icon = exactMatch ? '✅✅' : winnerMatch ? '✅' : '❌';
  const tip = exactMatch
    ? 'Marcador exacto'
    : winnerMatch
      ? 'Resultado correcto, marcador distinto'
      : 'Falló la predicción';
  const liveTag = match.liveSource ? ' 🔴LIVE' : '';
  const cls = exactMatch ? 'real-exact' : winnerMatch ? 'real-ok' : 'real-miss';

  const span = document.createElement('span');
  span.className = `real-badge ${cls}`;
  span.title = tip;
  span.textContent = `${icon} Real: ${match.real}${liveTag}`;
  return span;
}

function buildMatchRow(match) {
  const wrapper = document.createDocumentFragment();
  const row = document.createElement('div');
  row.className = 'match';

  const home = document.createElement('span');
  home.className = 'match-team home';
  home.textContent = match.h;

  const score = document.createElement('span');
  score.className = 'match-score';
  score.textContent = match.score;

  const away = document.createElement('span');
  away.className = 'match-team away';
  away.textContent = match.a;

  const confWrap = document.createElement('span');
  confWrap.className = 'match-conf';
  const lvl = getConfidenceLevel(match.conf);
  confWrap.innerHTML = `
    <div class="mini-bar"><div class="mini-fill ${lvl}" style="width:${match.conf}%"></div></div>
    <span style="font-size:.58rem;color:var(--muted)">${match.conf}%</span>
  `;

  row.append(home, score, away, confWrap);

  const badge = buildResultBadge(match);
  if (badge) row.appendChild(badge);

  wrapper.appendChild(row);

  if (match.formNote) {
    const note = document.createElement('div');
    note.className = 'match-adj';
    note.textContent = match.formNote;
    wrapper.appendChild(note);
  }

  return wrapper;
}

function buildGroupCard(group) {
  const card = document.createElement('article');
  card.className = 'group-card';
  card.setAttribute('aria-label', `Grupo ${group.letter}`);

  const header = document.createElement('div');
  header.className = 'group-header';
  header.innerHTML = `
    <span class="group-letter">${group.letter}</span>
    <span class="group-name">${group.label.replace(`GRUPO ${group.letter} — `, '')}</span>
  `;

  const table = document.createElement('table');
  table.className = 'group-table';
  table.innerHTML = `
    <thead>
      <tr><th>Equipo</th><th>Pts</th><th>GF</th><th>GC</th><th>DF</th></tr>
    </thead>
    <tbody></tbody>
  `;

  const tbody = table.querySelector('tbody');
  group.teams.forEach((team) => {
    const tr = document.createElement('tr');
    tr.className = teamRowClass(team.badge);
    tr.innerHTML = `
      <td>
        <div class="team-name">
          <span class="flag" aria-hidden="true">${team.flag}</span> ${team.name}
          <span class="qualify-badge ${BADGE_CLASS[team.badge]}">${formatQualifyBadge(team.badge)}</span>
        </div>
      </td>
      <td class="pts">${team.pts}</td>
      <td>${team.gf}</td>
      <td>${team.gc}</td>
      <td style="color:${goalDiffColor(team.gd)}">${formatGoalDiff(team.gd)}</td>
    `;
    tbody.appendChild(tr);
  });

  const matchesList = document.createElement('div');
  matchesList.className = 'matches-list';
  group.matches.forEach((m) => matchesList.appendChild(buildMatchRow(m)));

  card.append(header, table, matchesList);
  return card;
}

/** Renderiza la grilla de fase de grupos. */
export function renderGroups() {
  const container = document.getElementById('groups-container');
  if (!container) return;
  container.replaceChildren();
  GROUPS.forEach((g) => container.appendChild(buildGroupCard(g)));
}
