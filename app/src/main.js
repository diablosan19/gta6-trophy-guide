// Leonida Trophy Guide — bootstrap. Loads the data, restores the reader's
// progress and settings, wires the toolbar, tabs and tracker, and keeps
// every view (meter, list, detail, roadmap) rendering from one state.

import { loadGuideData } from './guide-data.js';
import {
  exportProgress,
  loadProgress,
  loadSettings,
  parseImportedProgress,
  saveProgress,
  saveSettings,
} from './progress.js';
import {
  filterTrophies,
  renderChips,
  renderDetail,
  renderList,
  renderMeter,
  renderRoadmap,
} from './render.js';

const els = {
  count: document.querySelector('#earned-count'),
  fill: document.querySelector('#meter-fill'),
  pct: document.querySelector('#meter-pct'),
  tally: document.querySelector('#grade-tally'),
  chips: document.querySelector('#kind-chips'),
  list: document.querySelector('#trophy-list'),
  detail: document.querySelector('#detail'),
  resultCount: document.querySelector('#result-count'),
  search: document.querySelector('#search'),
  spoilerToggle: document.querySelector('#spoiler-toggle'),
  hideEarnedToggle: document.querySelector('#hide-earned-toggle'),
  roadmapRoot: document.querySelector('#roadmap-root'),
  viewTracker: document.querySelector('#view-tracker'),
  viewRoadmap: document.querySelector('#view-roadmap'),
  tabTracker: document.querySelector('#tab-tracker'),
  tabRoadmap: document.querySelector('#tab-roadmap'),
};

const { trophies, roadmap } = await loadGuideData();
const earned = loadProgress();
const settings = loadSettings();

const state = {
  kind: 'all',
  query: '',
  settings,
  selectedId: null,
  isEarned: (trophy) => earned.has(trophy.id),
  onSelect: (id) => {
    state.selectedId = id;
    renderAll();
  },
  onToggle: (id, isNowEarned) => {
    if (isNowEarned) earned.add(id);
    else earned.delete(id);
    saveProgress(earned);
    renderAll();
  },
  onJump: (id) => {
    state.selectedId = id;
    showView('tracker');
    renderAll();
    els.detail.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  },
};

// The first thing a new reader should see open: their next story trophy,
// or the platinum itself when the story is done.
state.selectedId =
  trophies.find((t) => t.kind === 'story' && t.grade !== 'platinum' && !earned.has(t.id))?.id ??
  trophies[0].id;

function showView(which) {
  const tracker = which === 'tracker';
  els.viewTracker.hidden = !tracker;
  els.viewRoadmap.hidden = tracker;
  els.tabTracker.classList.toggle('is-active', tracker);
  els.tabRoadmap.classList.toggle('is-active', !tracker);
  els.tabTracker.setAttribute('aria-selected', String(tracker));
  els.tabRoadmap.setAttribute('aria-selected', String(!tracker));
}

function renderAll() {
  renderMeter(els, trophies, earned);
  renderChips(els.chips, trophies, earned, state.kind, (kind) => {
    state.kind = kind;
    renderAll();
  });
  const visible = filterTrophies(trophies, state);
  renderList(els.list, visible, state);
  els.resultCount.textContent = `Showing ${visible.length} of ${trophies.length} trophies`;
  const selected = trophies.find((t) => t.id === state.selectedId) ?? null;
  renderDetail(els.detail, selected, state);
  renderRoadmap(els.roadmapRoot, roadmap, trophies, state);
}

els.search.addEventListener('input', () => {
  state.query = els.search.value;
  renderAll();
});

els.spoilerToggle.checked = settings.spoilers;
els.spoilerToggle.addEventListener('change', () => {
  settings.spoilers = els.spoilerToggle.checked;
  saveSettings(settings);
  renderAll();
});

els.hideEarnedToggle.checked = settings.hideEarned;
els.hideEarnedToggle.addEventListener('change', () => {
  settings.hideEarned = els.hideEarnedToggle.checked;
  saveSettings(settings);
  renderAll();
});

document.querySelector('#export-btn').addEventListener('click', () => exportProgress(earned));

document.querySelector('#import-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const parsed = parseImportedProgress(await file.text());
  if (parsed) {
    earned.clear();
    for (const id of parsed) {
      if (trophies.some((t) => t.id === id)) earned.add(id);
    }
    saveProgress(earned);
    renderAll();
  }
  event.target.value = '';
});

document.querySelector('#reset-btn').addEventListener('click', () => {
  if (window.confirm('Clear every earned tick and start the tracker from zero?')) {
    earned.clear();
    saveProgress(earned);
    renderAll();
  }
});

els.tabTracker.addEventListener('click', () => showView('tracker'));
els.tabRoadmap.addEventListener('click', () => showView('roadmap'));

renderAll();
