import { CONFIDENCE_BUCKETS, RHO_INTRA_GROUP } from '../config.js';
import {
  applyScoreMode,
  correlatedStats,
  fmtProb,
  getProbGroupLabels,
  getProbGroupsConfs,
  pAboveK,
  statsOf,
} from '../models/probability.js';

let probMode = 'resultado';

/** @returns {'resultado'|'marcador'} */
export function getProbMode() {
  return probMode;
}

/**
 * Cambia modo de probabilidad y re-renderiza.
 * @param {'resultado'|'marcador'} mode
 */
export function setProbMode(mode) {
  probMode = mode;
  const note = document.getElementById('prob-mode-note');
  if (note) note.style.display = mode === 'marcador' ? 'block' : 'none';
  renderProbability();
}

/** Renderiza pestaña de probabilidad de aciertos. */
export function renderProbability() {
  const PROB_GROUPS_CONFS = getProbGroupsConfs();
  const PROB_GROUP_CONFS = PROB_GROUPS_CONFS.flat();
  const groupsEff =
    probMode === 'marcador' ? PROB_GROUPS_CONFS.map(applyScoreMode) : PROB_GROUPS_CONFS;
  const gs = correlatedStats(groupsEff);
  const log10All = gs.lnP / Math.log(10);
  const PROB_GROUP_LABELS = getProbGroupLabels();

  const summary = document.getElementById('prob-summary');
  if (summary) {
    summary.innerHTML = `
      <div style="color:var(--muted); font-size:.6rem; text-transform:uppercase; letter-spacing:.08em;">Fase de Grupos</div>
      <div style="font-size:2.4rem; font-weight:900; color:var(--amber); line-height:1.1; margin-top:.3rem;">
        ${gs.mean.toFixed(1)}<span style="font-size:1.2rem; color:var(--muted);">/${gs.n}</span>
      </div>
      <div style="color:var(--muted); font-size:.7rem; margin-top:2px;">partidos esperados ✓ (~${(gs.mean / gs.n * 100).toFixed(0)}%)</div>
      <div style="margin-top:.5rem; height:4px; background:var(--border); border-radius:2px; overflow:hidden; max-width:300px; margin-inline:auto;">
        <div style="height:100%; width:${gs.avgC}%; background:linear-gradient(90deg,var(--gold),var(--amber)); border-radius:2px;"></div>
      </div>
      <div style="color:var(--amber); font-size:.75rem; font-weight:700; margin-top:2px;">${gs.avgC.toFixed(1)}% conf. promedio</div>
    `;
  }

  const bellMeta = document.getElementById('prob-bell-meta');
  if (bellMeta) {
    bellMeta.textContent = `Normal aproximada (con correlación intra-grupo, ρ=${RHO_INTRA_GROUP}) · Media=${gs.mean.toFixed(1)} · σ=${gs.sd.toFixed(1)}`;
  }

  const lo = Math.max(0, Math.floor(gs.mean - 4 * gs.sd));
  const hi = Math.min(gs.n, Math.ceil(gs.mean + 4 * gs.sd));
  const bellPts = [];
  for (let k = lo; k <= hi; k++) {
    const z = (k - gs.mean) / gs.sd;
    const d = (Math.exp(-0.5 * z * z) / (gs.sd * Math.sqrt(2 * Math.PI))) * 100;
    bellPts.push({ k, d });
  }
  const maxD = Math.max(...bellPts.map((p) => p.d));
  const W = 600;
  const H = 220;
  const padL = 30;
  const padR = 15;
  const padT = 25;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xScale = (k) => padL + ((k - lo) / (hi - lo)) * plotW;
  const yScale = (d) => padT + (1 - d / maxD) * plotH;

  let areaPath = `M ${xScale(lo)} ${yScale(0)} `;
  bellPts.forEach((p) => {
    areaPath += `L ${xScale(p.k)} ${yScale(p.d)} `;
  });
  areaPath += `L ${xScale(hi)} ${yScale(0)} Z`;
  let linePath = `M ${xScale(bellPts[0].k)} ${yScale(bellPts[0].d)} `;
  bellPts.slice(1).forEach((p) => {
    linePath += `L ${xScale(p.k)} ${yScale(p.d)} `;
  });

  const meanX = xScale(gs.mean);
  let ticks = '';
  const step = Math.max(1, Math.round((hi - lo) / 8));
  for (let k = lo; k <= hi; k += step) {
    ticks += `<text x="${xScale(k)}" y="${H - 8}" fill="var(--muted)" font-size="10" text-anchor="middle">${k}</text>`;
  }

  const bellSvg = document.getElementById('prob-bell-svg');
  if (bellSvg) {
    bellSvg.innerHTML = `
      <defs>
        <linearGradient id="bellGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="var(--gold)" stop-opacity="0.4"/>
          <stop offset="95%" stop-color="var(--gold)" stop-opacity="0.04"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#bellGrad)" />
      <path d="${linePath}" fill="none" stroke="var(--gold)" stroke-width="2" />
      <line x1="${meanX}" y1="${padT}" x2="${meanX}" y2="${H - padB}" stroke="var(--amber)" stroke-width="1.5" stroke-dasharray="4 3" />
      <text x="${meanX}" y="${padT - 8}" fill="var(--amber)" font-size="11" text-anchor="middle">↑ ${Math.round(gs.mean)}</text>
      ${ticks}
      <text x="${W - padR}" y="${H - 8}" fill="var(--muted)" font-size="10" text-anchor="end">aciertos</text>
    `;
  }

  const thresholds = [
    { label: 'Acertar TODO', isLog: true, color: 'var(--red)' },
    { label: `≥90% (${Math.ceil(0.9 * gs.n)})`, prob: pAboveK(gs.mean, gs.sd, 0.9 * gs.n) * 100, color: '#e67e22' },
    { label: `≥80% (${Math.ceil(0.8 * gs.n)})`, prob: pAboveK(gs.mean, gs.sd, 0.8 * gs.n) * 100, color: 'var(--gold)' },
    { label: `≥70% (${Math.ceil(0.7 * gs.n)})`, prob: pAboveK(gs.mean, gs.sd, 0.7 * gs.n) * 100, color: '#2ecc71' },
    { label: `Esperado (~${Math.round(gs.mean)})`, prob: pAboveK(gs.mean, gs.sd, gs.mean - 0.5) * 100, color: '#27ae60' },
  ];

  const thresholdsEl = document.getElementById('prob-thresholds');
  if (thresholdsEl) {
    thresholdsEl.innerHTML = thresholds
      .map(
        (t) => `
      <div class="prob-threshold-row" style="border-left-color:${t.color};">
        <div style="color:var(--text);">${t.label}</div>
        <div style="font-weight:900; font-size:.9rem; color:${t.color};">
          ${t.isLog ? `10<sup style="font-size:.6rem;">${Math.round(log10All)}</sup>` : fmtProb(t.prob)}
        </div>
      </div>
    `
      )
      .join('');
  }

  const explainEl = document.getElementById('prob-mode-explain');
  if (explainEl) {
    explainEl.innerHTML =
      probMode === 'resultado'
        ? '⚽ "Resultado" = quién gana o si es empate.<br>Sin importar el marcador exacto.'
        : '🎯 "Marcador exacto" incluye acertar el score preciso.<br>Prob. varía 6%–14% según qué tan parejo es el partido.';
  }

  const buckets = CONFIDENCE_BUCKETS.map((b) => ({
    ...b,
    count: PROB_GROUP_CONFS.filter((p) => p >= b.min && p < b.max).length,
  }));

  const HW = 600;
  const HH = 200;
  const hPadL = 30;
  const hPadR = 10;
  const hPadT = 20;
  const hPadB = 30;
  const hPlotW = HW - hPadL - hPadR;
  const hPlotH = HH - hPadT - hPadB;
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);
  const barW = hPlotW / buckets.length;
  let bars = '';
  buckets.forEach((b, i) => {
    const barH = (b.count / maxCount) * hPlotH;
    const x = hPadL + i * barW;
    const y = hPadT + (hPlotH - barH);
    bars += `<rect x="${x + barW * 0.12}" y="${y}" width="${barW * 0.76}" height="${barH}" fill="${b.color}" rx="3"/>`;
    bars += `<text x="${x + barW / 2}" y="${y - 6}" fill="var(--text)" font-size="11" text-anchor="middle" font-weight="700">${b.count}</text>`;
    bars += `<text x="${x + barW / 2}" y="${HH - 8}" fill="var(--muted)" font-size="10" text-anchor="middle">${b.label}</text>`;
  });

  const histSvg = document.getElementById('prob-hist-svg');
  if (histSvg) histSvg.innerHTML = bars;

  const groupRows = PROB_GROUP_LABELS.map((label, gi) => {
    const s = statsOf(groupsEff[gi]);
    return { label, mean: s.mean, avgC: s.avgC };
  });

  const groupTable = document.getElementById('prob-group-table');
  if (groupTable) {
    let tbody = groupRows
      .map(
        (r) => `
    <tr class="prob-group-row">
      <td style="color:var(--text);">${r.label}</td>
      <td style="text-align:center; color:var(--amber); font-weight:700;">${r.avgC.toFixed(0)}%</td>
      <td style="text-align:center; color:#27ae60; font-weight:700;">${r.mean.toFixed(1)}/6</td>
    </tr>
  `
      )
      .join('');
    tbody += `
    <tr class="prob-group-row" style="border-top:2px solid var(--gold);">
      <td style="color:var(--amber); font-weight:700; padding-top:.4rem;">TOTAL</td>
      <td style="text-align:center; color:var(--amber); font-weight:700; padding-top:.4rem;">${gs.avgC.toFixed(0)}%</td>
      <td style="text-align:center; color:var(--amber); font-weight:900; padding-top:.4rem;">${gs.mean.toFixed(1)}/72</td>
    </tr>
  `;
    groupTable.innerHTML = tbody;
  }

  const p70 = pAboveK(gs.mean, gs.sd, 0.7 * gs.n) * 100;
  const p70fmt = p70 > 0.01 ? (p70 < 1 ? `${p70.toFixed(2)}%` : `${p70.toFixed(0)}%`) : '<1%';
  const lowest = PROB_GROUP_CONFS.slice().sort((a, b) => a - b).slice(0, 4);

  const conclusion = document.getElementById('prob-conclusion');
  if (conclusion) {
    conclusion.innerHTML = `
      <div style="font-weight:700; color:var(--gold); margin-bottom:.3rem;">📊 Conclusión clave</div>
      <div style="font-size:.85rem; color:var(--text);">
        En modo <strong style="color:var(--amber);">${probMode === 'resultado' ? 'resultado' : 'marcador exacto'}</strong>:
        se esperan acertar <strong style="color:var(--amber);">~${gs.mean.toFixed(0)} de 72 partidos</strong> de la fase de grupos
        (~${(gs.mean / gs.n * 100).toFixed(0)}%).
        Hay ~${p70fmt} de chances de superar el 70% de aciertos en esta fase.
        Acertar <em>todos</em> los 72 partidos es prácticamente <strong style="color:var(--red);">imposible</strong>
        (prob ≈ 10<sup style="font-size:.6rem;">${Math.round(log10All)}</sup>).
        Los partidos con menor confianza (conf. ${lowest.join('%, ')}%) son donde una sorpresa puede definir tu posición en el concurso.
      </div>
    `;
  }
}
