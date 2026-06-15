import { KNOCKOUT_ROUNDS, KNOCKOUT_SKIP_SCORES } from '../data/knockout.js';
import { getConfidenceLevel } from '../utils.js';

/** Renderiza la tabla del cuadro eliminatorio. */
export function renderKnockout() {
  const tbody = document.getElementById('knockout-body');
  if (!tbody) return;

  tbody.replaceChildren();
  let lastRound = '';

  KNOCKOUT_ROUNDS.forEach((match) => {
    if (!match.score || KNOCKOUT_SKIP_SCORES.has(match.score)) return;

    const tr = document.createElement('tr');
    const showRound = match.round !== lastRound;
    lastRound = match.round;
    const lvl = getConfidenceLevel(match.conf);

    tr.innerHTML = `
      <td>${showRound ? `<span class="round-cell">${match.round}</span>` : '<span style="color:var(--border)">—</span>'}</td>
      <td class="winner-cell">${match.winner}</td>
      <td style="color:var(--muted);text-align:center;font-size:.7rem">vs</td>
      <td class="loser-cell">${match.loser}</td>
      <td style="font-family:'Barlow Condensed',sans-serif;font-weight:700;color:var(--amber)">${match.score}</td>
      <td>
        <div style="display:flex;align-items:center;gap:.4rem;font-size:.7rem">
          <div class="mini-bar" style="width:60px"><div class="mini-fill ${lvl}" style="width:${match.conf}%"></div></div>
          ${match.conf}%
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
