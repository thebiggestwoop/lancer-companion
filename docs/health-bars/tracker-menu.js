import OBR from "https://esm.sh/@owlbear-rodeo/sdk@3.1.0";
import { BAR_KEYS, BAR_LABELS, BAR_COLORS, getBar, getBarsHidden, metaKey, HIDDEN_KEY } from "./bar-data.js";

const container = document.getElementById("bars-container");
const hideToggleBtn = document.getElementById("hide-toggle-btn");

let targetItemId = null;
let role = "PLAYER";

async function init() {
  role = await OBR.player.getRole();
  const selection = await OBR.player.getSelection();

  if (!selection || selection.length !== 1) {
    showMessage("Select exactly one token first.");
    return;
  }
  targetItemId = selection[0];

  const items = await OBR.scene.items.getItems([targetItemId]);
  const item = items[0];
  if (!item) {
    showMessage("Token not found.");
    return;
  }

  render(item);

  OBR.scene.items.onChange((allItems) => {
    // Don't clobber an in-progress edit if a change comes in from
    // elsewhere while this field is focused.
    if (container.contains(document.activeElement)) return;
    const updated = allItems.find((i) => i.id === targetItemId);
    if (updated) render(updated);
  });

  hideToggleBtn.addEventListener("click", toggleHidden);
}

function showMessage(text) {
  container.textContent = "";
  const p = document.createElement("p");
  p.className = "status-message";
  p.textContent = text;
  container.appendChild(p);
}

function render(item) {
  container.textContent = "";
  for (const barKey of BAR_KEYS) {
    const bar = getBar(item, barKey) ?? { value: 0, max: 0 };
    container.appendChild(buildBarRow(barKey, bar));
  }

  const hidden = getBarsHidden(item);
  if (role === "GM") {
    hideToggleBtn.hidden = false;
    hideToggleBtn.textContent = hidden ? "Show numbers to players" : "Hide numbers from players";
  } else {
    hideToggleBtn.hidden = true;
  }
}

function buildBarRow(barKey, bar) {
  const row = document.createElement("div");
  row.className = "bar-row";

  const label = document.createElement("span");
  label.className = "bar-label";
  label.textContent = BAR_LABELS[barKey];
  label.style.color = BAR_COLORS[barKey];
  row.appendChild(label);

  const valueInput = document.createElement("input");
  valueInput.type = "number";
  valueInput.className = "bar-input";
  valueInput.value = bar.value;
  valueInput.addEventListener("change", () => {
    writeBar(barKey, { value: Number(valueInput.value) || 0, max: Number(maxInput.value) || 0 });
  });
  row.appendChild(valueInput);

  const slash = document.createElement("span");
  slash.textContent = "/";
  row.appendChild(slash);

  const maxInput = document.createElement("input");
  maxInput.type = "number";
  maxInput.className = "bar-input";
  maxInput.value = bar.max;
  maxInput.addEventListener("change", () => {
    writeBar(barKey, { value: Number(valueInput.value) || 0, max: Number(maxInput.value) || 0 });
  });
  row.appendChild(maxInput);

  return row;
}

async function writeBar(barKey, bar) {
  await OBR.scene.items.updateItems([targetItemId], (items) => {
    for (const item of items) {
      item.metadata[metaKey(barKey)] = bar;
    }
  });
}

async function toggleHidden() {
  const items = await OBR.scene.items.getItems([targetItemId]);
  const hidden = getBarsHidden(items[0]);
  await OBR.scene.items.updateItems([targetItemId], (items) => {
    for (const item of items) {
      item.metadata[metaKey(HIDDEN_KEY)] = !hidden;
    }
  });
}

if (OBR.isReady) {
  init();
} else {
  OBR.onReady(init);
}
