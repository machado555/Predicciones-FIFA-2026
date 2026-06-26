import { FIXTURES } from '../data/fixture.js';
import { GROUPS } from '../data/groups.js';
import { KNOCKOUT_ROUNDS } from '../data/knockout.js';
import { flagOf } from '../utils.js';

let currentFilter = 'all';
let currentDay = 'all';

function getMatchData(fix) {
  if (fix.ref.type === 'group') {
    const m = GROUPS[fix.ref.gi]?.matches[fix.ref.mi];
    if (!m) return null;
    return {
      home: m.h,
      away: m.a,
      homeFlag: flagOf(m.h),
      awayFlag: flagOf(m.a),
      predicted: m.score,
      real: m.real || null,
      played: m.played || false,
      conf: m.conf ?? m.baseConf,
    };
  }

  if (fix.ref.type === 'ko') {
    const m = KNOCKOUT_ROUNDS[fix.ref.idx];
    if (!m) return null;
    return {
      home: m.winner,
      away: m.loser,
      homeFlag: flagOf(m.winner),
      awayFlag: flagOf(m.loser),
      predicted: m.score,
      real: null,
      played: false,
      conf: m.conf,
    };
  }

  return null;
}

function getStatus(fix, md) {
  if (!md) return { label: '⏳ Próximo', cls: 'badge-upcoming' };
  if (md.played && md.real) return { label: '✅ Finalizado', cls: 'badge-final' };

  const today = new Date();
  const matchDate = new Date(fix.date + 'T' + (fix.time || '00:00') + ':00');

  if (
    today.getFullYear() === matchDate.getFullYear() &&
    today.getMonth() === matchDate.getMonth() &&
    today.getDate() === matchDate.getDate()
  ) {
    return { label: '🔴 EN VIVO', cls: 'badge-live' };
  }

  return { label: '⏳ Próximo', cls: 'badge-upcoming' };
}

function formatDateTime(dateStr, timeStr) {
  const d = new Date(dateStr + 'T' + (timeStr || '00:00') + ':00');
  const day = d.getDate();
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ];
  const month = months[d.getMonth()];
  return { dateLabel: `${day} ${month}`, dayName: d.toLocaleDateString('es-ES', { weekday: 'long' }) };
}

function createSkeleton() {
  const container = document.getElementById('fixture-container');
  if (!container) return;
  container.innerHTML = `
    <div class="fixture-skeleton">
      <div class="sk-item"></div>
      <div class="sk-item"></div>
      <div class="sk-item"></div>
      <div class="sk-item"></div>
      <div class="sk-item"></div>
      <div class="sk-item"></div>
    </div>
  `;
}

function buildDateGroupHeader(dateLabel, dayName) {
  const header = document.createElement('div');
  header.className = 'fixture-day-header';
  header.innerHTML = `
    <span class="fixture-day-date">${dateLabel}</span>
    <span class="fixture-day-name">${dayName}</span>
  `;
  return header;
}

function buildFixtureRow(fix, md) {
  const status = getStatus(fix, md);
  const dt = formatDateTime(fix.date, fix.time);
  const resultDisplay = md && md.played && md.real
    ? md.real
    : '<span class="fixture-vs">vs</span>';

  const row = document.createElement('div');
  row.className = 'fixture-row';
  row.setAttribute('data-phase', fix.phase.startsWith('Grupo') ? 'groups' : 'knockout');
  row.setAttribute('data-date', fix.date);

  row.innerHTML = `
    <div class="fixture-dt">
      <span class="fixture-date">${dt.dateLabel}</span>
      <span class="fixture-time">${fix.time || '—'}</span>
    </div>
    <div class="fixture-phase">${fix.phase}</div>
    <div class="fixture-teams">
      <span class="fixture-team home">${md ? md.home : '—'}</span>
      <span class="fixture-result">${resultDisplay}</span>
      <span class="fixture-team away">${md ? md.away : '—'}</span>
    </div>
    <div class="fixture-status">
      <span class="fixture-badge ${status.cls}">${status.label}</span>
    </div>
    <div class="fixture-venue">
      <span class="fixture-venue-icon" aria-hidden="true">🏟️</span>
      <span>${fix.venue}</span>
    </div>
  `;

  return row;
}

function buildMobileFixtureCard(fix, md) {
  const status = getStatus(fix, md);
  const dt = formatDateTime(fix.date, fix.time);
  const resultDisplay = md && md.played && md.real
    ? md.real
    : '<span class="fixture-vs">vs</span>';

  const card = document.createElement('div');
  card.className = 'fixture-card';
  card.setAttribute('data-phase', fix.phase.startsWith('Grupo') ? 'groups' : 'knockout');
  card.setAttribute('data-date', fix.date);

  card.innerHTML = `
    <div class="fixture-card-header">
      <span class="fixture-card-phase">${fix.phase}</span>
      <span class="fixture-badge ${status.cls}">${status.label}</span>
    </div>
    <div class="fixture-card-main">
      <div class="fixture-card-team">${md ? md.home : '—'}</div>
      <div class="fixture-card-score">${resultDisplay}</div>
      <div class="fixture-card-team">${md ? md.away : '—'}</div>
    </div>
    <div class="fixture-card-footer">
      <span>📅 ${dt.dayName} ${dt.dateLabel} · ${fix.time || '—'}</span>
      <span>🏟️ ${fix.venue}</span>
    </div>
  `;

  return card;
}

function renderFixtureList() {
  const container = document.getElementById('fixture-container');
  if (!container) return;

  const isMobile = window.innerWidth <= 700;

  const filtered = FIXTURES.filter((fix) => {
    if (currentFilter === 'groups' && !fix.phase.startsWith('Grupo')) return false;
    if (currentFilter === 'knockout' && fix.phase.startsWith('Grupo')) return false;
    if (currentDay !== 'all' && fix.date !== currentDay) return false;
    return true;
  });

  container.replaceChildren();

  if (filtered.length === 0) {
    container.innerHTML = '<p style="text-align:center;color:var(--muted);padding:2rem;">No hay partidos para esta selección.</p>';
    return;
  }

  if (isMobile) {
    let lastDate = '';
    filtered.forEach((fix) => {
      const md = getMatchData(fix);
      if (fix.date !== lastDate) {
        const dt = formatDateTime(fix.date, fix.time);
        container.appendChild(buildDateGroupHeader(dt.dateLabel, dt.dayName));
        lastDate = fix.date;
      }
      container.appendChild(buildMobileFixtureCard(fix, md));
    });
  } else {
    let lastDate = '';
    filtered.forEach((fix) => {
      const md = getMatchData(fix);
      if (fix.date !== lastDate) {
        const dt = formatDateTime(fix.date, fix.time);
        container.appendChild(buildDateGroupHeader(dt.dateLabel, dt.dayName));
        lastDate = fix.date;
      }
      container.appendChild(buildFixtureRow(fix, md));
    });
  }
}

function initFilters() {
  const phaseBtns = document.querySelectorAll('.fixture-filter-btn');
  phaseBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      phaseBtns.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      currentFilter = btn.dataset.filter || 'all';
      renderFixtureList();
    });
  });

  const daySelect = document.getElementById('fixture-day-filter');
  if (daySelect) {
    daySelect.addEventListener('change', () => {
      currentDay = daySelect.value || 'all';
      renderFixtureList();
    });
  }
}

function populateDayFilter() {
  const select = document.getElementById('fixture-day-filter');
  if (!select) return;

  const days = new Set();
  FIXTURES.forEach((f) => days.add(f.date));

  const sortedDays = [...days].sort();
  sortedDays.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = d;
    const dt = formatDateTime(d, '12:00');
    opt.textContent = `${dt.dayName}, ${dt.dateLabel}`;
    select.appendChild(opt);
  });
}

export function renderFixture() {
  const container = document.getElementById('fixture-container');
  if (!container) return;

  createSkeleton();

  setTimeout(() => {
    populateDayFilter();
    initFilters();
    renderFixtureList();
  }, 0);
}

window.addEventListener('resize', () => {
  const section = document.getElementById('fixture');
  if (section && section.classList.contains('active')) {
    renderFixtureList();
  }
});
