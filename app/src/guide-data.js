// Loads the guide's two data files and holds the shared vocabulary:
// grades in display order, the filter kinds, and the small predicates
// every view agrees on (what counts as missable, what a spoiler hides).

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectibles', label: 'Collectibles' },
  { id: 'activities', label: 'Activities' },
  { id: 'online', label: 'Online & co-op' },
  { id: 'misc', label: 'Misc' },
  { id: 'earned', label: 'Earned' },
  { id: 'remaining', label: 'Remaining' },
];

export async function loadGuideData() {
  const [trophyDoc, roadmapDoc] = await Promise.all([
    fetch('data/trophies.json').then((r) => r.json()),
    fetch('data/roadmap.json').then((r) => r.json()),
  ]);
  const trophies = Array.isArray(trophyDoc) ? trophyDoc : trophyDoc.trophies;
  return { trophies, roadmap: roadmapDoc };
}

export function trophiesOfGrade(trophies, grade) {
  return trophies.filter((t) => t.grade === grade);
}

export function matchesKind(trophy, kind, isEarned) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  if (kind === 'earned') return isEarned(trophy);
  if (kind === 'remaining') return !isEarned(trophy);
  return trophy.kind === kind;
}

// Spoiler protection hides a story trophy's name and description until it
// is earned. The platinum is exempt: it is the goal named on the cover of
// the guide itself, and its description spoils nothing.
export function isMasked(trophy, settings, isEarned) {
  return Boolean(
    settings.spoilers &&
    trophy.kind === 'story' &&
    trophy.grade !== 'platinum' &&
    !isEarned(trophy),
  );
}

export function displayName(trophy, settings, isEarned) {
  return isMasked(trophy, settings, isEarned) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, settings, isEarned) {
  return isMasked(trophy, settings, isEarned)
    ? 'Spoiler protection is on: this story trophy stays hidden until you earn it.'
    : trophy.description;
}
