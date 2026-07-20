// Pure geometry helpers for drawing health bars as Owlbear curve/text items.
// Ported from the algorithm used by SeamusFinlayson's owl-trackers extension
// (https://github.com/SeamusFinlayson/owl-trackers), which is the proven
// reference for "bar attached to a token, computed independently per client."

export function getFillPortion(value, maxValue) {
  if (value <= 0) return 0;
  if (value >= maxValue) return 1;
  return value / maxValue;
}

// Generates a curve in the shape of a rounded rectangle, optionally
// truncated to only draw the first `fill` portion of its length (used to
// draw the colored fill on top of the bar's background outline).
export function createRoundedRectangle(maxLength, height, radius, fill = 1, pointsInCorner = 6) {
  if (radius * 2 > height) {
    radius = height * 0.5;
  }

  if (fill >= 1) {
    return [
      { x: radius, y: 0 },
      { x: maxLength - radius, y: 0 },
      ...drawArc({ x: maxLength - radius, y: radius }, radius, Math.PI * 0.5, -Math.PI * 0.5, pointsInCorner),
      ...drawArc({ x: maxLength - radius, y: height - radius }, radius, 0, -Math.PI * 0.5, pointsInCorner),
      { x: maxLength - radius, y: height },
      { x: radius, y: height },
      ...drawArc({ x: radius, y: height - radius }, radius, -Math.PI * 0.5, -Math.PI * 0.5, pointsInCorner),
      ...drawArc({ x: radius, y: radius }, radius, -Math.PI, -Math.PI * 0.5, pointsInCorner),
    ];
  }

  const barLength = fill * maxLength;
  if (barLength < radius) {
    const referenceAngle = Math.acos((radius - barLength) / radius);
    return [
      ...drawArc({ x: radius, y: height - radius }, radius, Math.PI + referenceAngle, -referenceAngle, pointsInCorner),
      ...drawArc({ x: radius, y: radius }, radius, Math.PI, -referenceAngle, pointsInCorner),
    ];
  }

  const remainingBarLength = maxLength - barLength;
  if (remainingBarLength < radius) {
    const referenceAngle = Math.acos((radius - remainingBarLength) / radius);
    return [
      { x: radius, y: 0 },
      { x: maxLength - radius, y: 0 },
      ...drawArc({ x: maxLength - radius, y: radius }, radius, Math.PI * 0.5, -Math.PI * 0.5 + referenceAngle, pointsInCorner),
      ...drawArc({ x: maxLength - radius, y: height - radius }, radius, -referenceAngle, -Math.PI * 0.5 + referenceAngle, pointsInCorner),
      { x: maxLength - radius, y: height },
      { x: radius, y: height },
      ...drawArc({ x: radius, y: height - radius }, radius, -Math.PI * 0.5, -Math.PI * 0.5, pointsInCorner),
      ...drawArc({ x: radius, y: radius }, radius, -Math.PI, -Math.PI * 0.5, pointsInCorner),
    ];
  }

  return [
    { x: radius, y: 0 },
    { x: barLength, y: 0 },
    { x: barLength, y: height },
    { x: radius, y: height },
    ...drawArc({ x: radius, y: height - radius }, radius, -Math.PI * 0.5, -Math.PI * 0.5, pointsInCorner),
    ...drawArc({ x: radius, y: radius }, radius, -Math.PI, -Math.PI * 0.5, pointsInCorner),
  ];
}

function drawArc(center, radius, startAngle, arcAngle, arcPoints) {
  arcPoints--;
  const points = [];
  const angleBetweenPoints = arcAngle / arcPoints;
  let angle = startAngle;
  for (let i = 0; i <= arcPoints; i++) {
    points.push({
      x: center.x + radius * Math.cos(angle),
      y: center.y - radius * Math.sin(angle),
    });
    angle += angleBetweenPoints;
  }
  return points;
}

// Math2-equivalent helpers (avoids importing the SDK's Math2 just for this).
function vAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function vSubtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function vMultiply(a, scalarOrVec) {
  if (typeof scalarOrVec === "number") return { x: a.x * scalarOrVec, y: a.y * scalarOrVec };
  return { x: a.x * scalarOrVec.x, y: a.y * scalarOrVec.y };
}
function vRotate(point, center, rotationDegrees) {
  const rad = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// World-space center of an Owlbear Image item, accounting for grid
// offset/dpi, scale, and rotation -- needed to position bars relative to
// the token regardless of how it was placed/scaled on the scene.
export function getImageCenter(image, sceneDpi) {
  let center = { x: 0, y: 0 };
  center = vAdd(center, vMultiply({ x: image.image.width, y: image.image.height }, 0.5));
  center = vSubtract(center, image.grid.offset);
  center = vMultiply(center, sceneDpi / image.grid.dpi);
  center = vMultiply(center, image.scale);
  center = vRotate(center, { x: 0, y: 0 }, image.rotation);
  center = vAdd(center, image.position);
  return center;
}

export function getImageBounds(item, dpi) {
  const dpiScale = dpi / item.grid.dpi;
  const width = Math.abs(item.image.width * dpiScale * item.scale.x);
  const height = Math.abs(item.image.height * dpiScale * item.scale.y);
  return { width, height };
}
