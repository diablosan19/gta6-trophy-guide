// The tracker half of the guide: which trophies are earned, and the two
// view settings, kept in localStorage so progress survives a closed tab.
// Nothing leaves the browser except the export file the reader asks for,
// and import reads a file in exactly that export shape.

const PROGRESS_KEY = 'leonida-trophy-guide.progress.v1';
const SETTINGS_KEY = 'leonida-trophy-guide.settings.v1';

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadProgress() {
  const saved = readJson(PROGRESS_KEY, { earned: [] });
  return new Set(Array.isArray(saved.earned) ? saved.earned : []);
}

export function saveProgress(earnedIds) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify({ earned: [...earnedIds] }));
}

export function loadSettings() {
  const saved = readJson(SETTINGS_KEY, {});
  return { spoilers: Boolean(saved.spoilers), hideEarned: Boolean(saved.hideEarned) };
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function exportProgress(earnedIds) {
  const payload = {
    app: 'leonida-trophy-guide',
    game: 'Grand Theft Auto VI',
    platform: 'PlayStation 5',
    exportedAt: new Date().toISOString(),
    earned: [...earnedIds].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Accepts the export shape ({ earned: [ids] }) and, generously, a bare
// array of ids or an { earned: { id: true } } map. Returns the id set, or
// null when the file is not a progress file at all.
export function parseImportedProgress(text) {
  let doc;
  try {
    doc = JSON.parse(text);
  } catch {
    return null;
  }
  const list = Array.isArray(doc) ? doc : doc.earned;
  if (Array.isArray(list)) {
    return new Set(list.map(Number).filter((n) => Number.isInteger(n) && n > 0));
  }
  if (list && typeof list === 'object') {
    return new Set(
      Object.keys(list)
        .filter((k) => list[k])
        .map(Number)
        .filter((n) => Number.isInteger(n) && n > 0),
    );
  }
  return null;
}
