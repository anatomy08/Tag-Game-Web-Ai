export function resolveEntityCollisions(entities, bounds, iterations = 4) {
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        separatePair(entities[i], entities[j]);
      }
    }
    for (const entity of entities) entity.clampToBounds(bounds);
  }
}

function separatePair(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  const minDist = a.radius + b.radius;
  if (dist >= minDist) return;

  let nx;
  let ny;
  if (dist < 0.001) {
    const angle = Math.random() * Math.PI * 2;
    nx = Math.cos(angle);
    ny = Math.sin(angle);
    dist = 0;
  } else {
    nx = dx / dist;
    ny = dy / dist;
  }

  const overlap = minDist - dist;
  a.x -= nx * overlap * 0.5;
  a.y -= ny * overlap * 0.5;
  b.x += nx * overlap * 0.5;
  b.y += ny * overlap * 0.5;
}
