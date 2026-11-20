// Everything the reader sees: the platinum meter, the filter chips, the
// trophy rows, the guide panel for the selected trophy, and the roadmap.
// Rendering is plain DOM built from the data files; the only state it
// reads is the earned set and the view settings, both passed in.

import {
  GRADE_ORDER,
  KIND_FILTERS,
  displayDescription,
  displayName,
  isMasked,
  matchesKind,
  trophiesOfGrade,
} from './guide-data.js';

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function gradeBadge(trophy) {
  return `<span class="grade-badge grade-${trophy.grade}"><span class="grade-dot"></span>${trophy.grade}</span>`;
}

function tagRow(trophy) {
  const tags = [`<span class="tag tag-kind">${escapeHtml(trophy.kind)}</span>`];
  if (trophy.missable) tags.push('<span class="tag tag-missable">Missable</span>');
  if (trophy.hidden) tags.push('<span class="tag tag-hidden">Hidden on PSN</span>');
  if (trophy.countLabel) tags.push(`<span class="tag tag-count">${escapeHtml(trophy.countLabel)}</span>`);
  return tags.join('');
}

export function renderMeter(els, trophies, earned) {
  const total = trophies.length;
  const done = trophies.filter((t) => earned.has(t.id)).length;
  els.count.textContent = String(done);
  els.fill.style.width = `${Math.round((done / total) * 100)}%`;
  els.pct.textContent =
    done === total
      ? 'Platinum earned — you are a Leonida Legend.'
      : `${Math.round((done / total) * 100)}% to Vice Got a Price! · ${total - done} to go`;
  els.tally.innerHTML = GRADE_ORDER.map((grade) => {
    const ofGrade = trophiesOfGrade(trophies, grade);
    const got = ofGrade.filter((t) => earned.has(t.id)).length;
    return `<span class="grade-${grade}"><span class="grade-dot"></span>${grade} ${got}/${ofGrade.length}</span>`;
  }).join('');
}

export function chipCounts(trophies, earned) {
  const isEarned = (t) => earned.has(t.id);
  const counts = {};
  for (const filter of KIND_FILTERS) {
    counts[filter.id] = trophies.filter((t) => matchesKind(t, filter.id, isEarned)).length;
  }
  return counts;
}

export function renderChips(container, trophies, earned, activeKind, onPick) {
  const counts = chipCounts(trophies, earned);
  container.innerHTML = '';
  for (const filter of KIND_FILTERS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip${filter.id === activeKind ? ' is-active' : ''}`;
    chip.innerHTML = `${escapeHtml(filter.label)}<span class="chip-count">${counts[filter.id]}</span>`;
    chip.addEventListener('click', () => onPick(filter.id));
    container.append(chip);
  }
}

export function filterTrophies(trophies, state) {
  const query = state.query.trim().toLowerCase();
  return trophies.filter((t) => {
    if (!matchesKind(t, state.kind, state.isEarned)) return false;
    if (state.settings.hideEarned && state.isEarned(t)) return false;
    if (!query) return true;
    const haystack = `${t.name} ${t.description} ${t.guide} ${t.kind} ${t.grade}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function renderList(listEl, visible, state) {
  listEl.innerHTML = '';
  for (const trophy of visible) {
    const earned = state.isEarned(trophy);
    const li = document.createElement('li');
    const row = document.createElement('div');
    row.className = `trophy-row${earned ? ' is-earned' : ''}${trophy.id === state.selectedId ? ' is-selected' : ''}`;
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', `Show the guide for ${displayName(trophy, state.settings, state.isEarned)}`);
    row.innerHTML = `
      <label class="row-check" aria-label="Mark ${escapeHtml(trophy.name)} as earned">
        <input type="checkbox" ${earned ? 'checked' : ''}>
      </label>
      ${gradeBadge(trophy)}
      <span class="row-main">
        <span class="row-name">${escapeHtml(displayName(trophy, state.settings, state.isEarned))}</span>
        <span class="row-desc">${escapeHtml(displayDescription(trophy, state.settings, state.isEarned))}</span>
      </span>
      <span class="row-tags">${tagRow(trophy)}</span>`;
    const checkbox = row.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('click', (event) => event.stopPropagation());
    checkbox.addEventListener('change', () => state.onToggle(trophy.id, checkbox.checked));
    row.addEventListener('click', () => state.onSelect(trophy.id));
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        state.onSelect(trophy.id);
      }
    });
    li.append(row);
    listEl.append(li);
  }
}

export function renderDetail(detailEl, trophy, state) {
  if (!trophy) {
    detailEl.innerHTML = '<p class="placeholder">Pick a trophy from the list and its guide, sources and missable warnings appear here.</p>';
    return;
  }
  const earned = state.isEarned(trophy);
  const masked = isMasked(trophy, state.settings, state.isEarned);
  const sources = (trophy.sources || [])
    .map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.name)}</a></li>`)
    .join('');
  detailEl.innerHTML = `
    <div class="detail-meta">${gradeBadge(trophy)}${tagRow(trophy)}</div>
    <h2>${escapeHtml(displayName(trophy, state.settings, state.isEarned))}</h2>
    <p class="official-desc">“${escapeHtml(displayDescription(trophy, state.settings, state.isEarned))}” — official PlayStation description</p>
    ${trophy.countLabel ? `<p class="counter-line">Target: ${escapeHtml(trophy.countLabel)}</p>` : ''}
    ${trophy.missable ? `<div class="missable-box"><strong>Missable — plan for it.</strong> ${escapeHtml(trophy.missableNote || 'This trophy can be missed; earn it before the story moves on.')}</div>` : ''}
    <h3>The guide</h3>
    <p>${masked ? 'Turn spoiler protection off, or earn this trophy, to read its guide.' : escapeHtml(trophy.guide)}</p>
    <h3>Sources</h3>
    <ul class="source-list">${sources}</ul>
    <label class="earn-line"><input type="checkbox" id="detail-earned" ${earned ? 'checked' : ''}> I have earned this trophy</label>`;
  detailEl.querySelector('#detail-earned').addEventListener('change', (event) => {
    state.onToggle(trophy.id, event.target.checked);
  });
}

export function renderRoadmap(rootEl, roadmap, trophies, state) {
  const byId = new Map(trophies.map((t) => [t.id, t]));
  const stages = roadmap.stages
    .map((stage) => {
      const stageTrophies = stage.trophyIds.map((id) => byId.get(id)).filter(Boolean);
      const done = stageTrophies.filter((t) => state.isEarned(t)).length;
      const chips = stageTrophies
        .map((t) => {
          const earned = state.isEarned(t);
          return `<button type="button" class="stage-chip${earned ? ' is-earned' : ''}" data-trophy-id="${t.id}"><span class="grade-dot grade-${t.grade}"></span>${escapeHtml(displayName(t, state.settings, state.isEarned))}${t.missable ? ' ⚠' : ''}</button>`;
        })
        .join('');
      const tips = (stage.tips || []).map((tip) => `<li>${escapeHtml(tip)}</li>`).join('');
      return `
      <article class="stage">
        <div class="stage-head">
          <span class="stage-n">Stage ${stage.n}</span>
          <h3>${escapeHtml(stage.title)}</h3>
          <span class="stage-progress">${done}/${stageTrophies.length} earned</span>
        </div>
        <p>${escapeHtml(stage.summary)}</p>
        ${tips ? `<ul class="stage-tips">${tips}</ul>` : ''}
        <div class="stage-trophies">${chips}</div>
      </article>`;
    })
    .join('');
  rootEl.innerHTML = `
    <h2 class="visually-hidden">${escapeHtml(roadmap.title)}</h2>
    <p class="roadmap-intro">${escapeHtml(roadmap.intro)}</p>
    <div class="ponr"><strong>Point of no return:</strong> ${escapeHtml(roadmap.pointOfNoReturn)}</div>
    ${stages}`;
  rootEl.querySelectorAll('.stage-chip').forEach((chip) => {
    chip.addEventListener('click', () => state.onJump(Number(chip.dataset.trophyId)));
  });
}
