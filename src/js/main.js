import { applyFormAdjustments } from './models/formAdjustment.js';
import { renderAnalysis } from './render/analysis.js';
import { renderGroups } from './render/groups.js';
import { renderKnockout } from './render/knockout.js';
import { renderProbability, setProbMode } from './render/probability.js';
import { renderFixture } from './render/fixture.js';
import { loadLiveResults } from './services/liveResults.js';

const TAB_IDS = ['fase-grupos', 'cuadro', 'campeones', 'analisis', 'fixture', 'probabilidad'];

/** Cambia pestaña activa con soporte de teclado. */
export function showTab(id, tabEl) {
  document.querySelectorAll('.section').forEach((s) => s.classList.remove('active'));
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
    t.tabIndex = -1;
  });

  const section = document.getElementById(id);
  if (section) section.classList.add('active');

  const tab = tabEl || document.querySelector(`.tab[data-tab="${id}"]`);
  if (tab) {
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.tabIndex = 0;
    tab.focus();
  }
}

function initTabs() {
  const tablist = document.querySelector('.tabs');
  if (!tablist) return;

  tablist.setAttribute('role', 'tablist');
  tablist.setAttribute('aria-label', 'Secciones del análisis');

  document.querySelectorAll('.tab').forEach((tab, index) => {
    const id = tab.dataset.tab;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('id', `tab-${id}`);
    tab.setAttribute('aria-controls', id);
    tab.setAttribute('aria-selected', tab.classList.contains('active') ? 'true' : 'false');
    tab.tabIndex = tab.classList.contains('active') ? 0 : -1;

    const panel = document.getElementById(id);
    if (panel) {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${id}`);
    }

    tab.addEventListener('click', () => showTab(id, tab));
    tab.addEventListener('keydown', (e) => {
      let next = index;
      if (e.key === 'ArrowRight') next = (index + 1) % TAB_IDS.length;
      else if (e.key === 'ArrowLeft') next = (index - 1 + TAB_IDS.length) % TAB_IDS.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = TAB_IDS.length - 1;
      else return;

      e.preventDefault();
      const nextTab = document.querySelector(`.tab[data-tab="${TAB_IDS[next]}"]`);
      if (nextTab) showTab(TAB_IDS[next], nextTab);
    });
  });
}

function initProbToggles() {
  document.querySelectorAll('.prob-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.prob-toggle').forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      setProbMode(btn.dataset.mode);
    });
  });
}

function initDisclaimerModal() {
  const overlay = document.getElementById('disclaimer-modal');
  const closeBtn = document.getElementById('disclaimer-close');
  const dialog = overlay?.querySelector('.disclaimer-box');
  if (!overlay || !closeBtn || !dialog) return;

  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'disclaimer-title');

  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  function getFocusable() {
    return [...dialog.querySelectorAll(focusableSelector)].filter(
      (el) => !el.hasAttribute('disabled')
    );
  }

  function closeModal() {
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  function openModal() {
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    closeBtn.focus();
  }

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== 'Tab') return;

    const focusable = getFocusable();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  openModal();
}

function init() {
  initTabs();
  initProbToggles();
  initDisclaimerModal();

  applyFormAdjustments();
  renderGroups();
  renderKnockout();
  renderAnalysis();
  renderFixture();
  renderProbability();
  loadLiveResults();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
