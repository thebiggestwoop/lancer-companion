// Shared data model for health bars, stored in each token item's metadata
// (synced to everyone) so any client can independently decide how to render
// it based on that client's own role -- see background.js for the rendering
// half of that trick.

export const PLUGIN_PREFIX = "com.lancer-companion.owlbear-extension";

export const BAR_KEYS = ["hp", "structure", "heat"];
export const BAR_LABELS = { hp: "HP", structure: "Structure", heat: "Heat" };
export const BAR_COLORS = { hp: "#3ba55d", structure: "#8e9297", heat: "#e67e22" };

export const HIDDEN_KEY = "bars-hidden";

export function metaKey(key) {
  return `${PLUGIN_PREFIX}/${key}`;
}

export function getBar(item, barKey) {
  const raw = item.metadata[metaKey(barKey)];
  if (!raw || typeof raw.value !== "number" || typeof raw.max !== "number") return null;
  return { value: raw.value, max: raw.max };
}

export function hasAnyBar(item) {
  return BAR_KEYS.some((key) => getBar(item, key) !== null);
}

export function getBarsHidden(item) {
  return item.metadata[metaKey(HIDDEN_KEY)] === true;
}
