import { OVERRATED, STRATEGY, UNDERRATED, UPSETS } from '../data/knockout.js';
import { getConfidenceLevel } from '../utils.js';

function appendAnalysisItems(container, items, renderItem) {
  if (!container) return;
  container.replaceChildren();
  items.forEach((item, index) => container.appendChild(renderItem(item, index)));
}

function createAnalysisItem(num, innerHtml) {
  const div = document.createElement('div');
  div.className = 'analysis-item';
  div.innerHTML = `
    <span class="item-num">${num}</span>
    <div class="item-text">${innerHtml}</div>
  `;
  return div;
}

/** Renderiza pestaña de análisis especial. */
export function renderAnalysis() {
  appendAnalysisItems(document.getElementById('upsets-list'), UPSETS, (u, i) => {
    const lvl = getConfidenceLevel(u.prob);
    return createAnalysisItem(
      i + 1,
      `<strong>${u.match}</strong><br>
       <span style="color:var(--red);font-size:.72rem">Sorpresa: ${u.scenario}</span>
       <div class="item-sub">${u.reason}</div>
       <div class="conf-bar-inline">
         <div class="mini-bar"><div class="mini-fill ${lvl}" style="width:${u.prob}%"></div></div>
         <span>${u.prob}% prob. sorpresa</span>
       </div>`
    );
  });

  appendAnalysisItems(document.getElementById('over-list'), OVERRATED, (o, i) =>
    createAnalysisItem(
      i + 1,
      `<strong>${o.team}</strong>
       <span style="color:var(--red);font-size:.7rem;margin-left:.3rem">${o.odds}</span>
       <div class="item-sub">${o.reason}</div>`
    )
  );

  appendAnalysisItems(document.getElementById('under-list'), UNDERRATED, (u, i) =>
    createAnalysisItem(
      i + 1,
      `<strong>${u.team}</strong>
       <span style="color:#27ae60;font-size:.7rem;margin-left:.3rem">${u.odds}</span>
       <div class="item-sub">${u.reason}</div>`
    )
  );

  appendAnalysisItems(document.getElementById('strategy-list'), STRATEGY, (s, i) =>
    createAnalysisItem(
      i + 1,
      `<strong>${s.tip}</strong><div class="item-sub">${s.sub}</div>`
    )
  );
}
