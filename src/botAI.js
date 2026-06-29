const JITTER_INTERVAL = 2000;
const FLEE_SAMPLES = 16;
const FLEE_DISTANCE = 160;

export function updateBotAI(bot, allEntities, bounds, now) {
  if (!bot._lastJitter) bot._lastJitter = 0;
  if (!bot._jitterX) bot._jitterX = 0;
  if (!bot._jitterY) bot._jitterY = 0;

  if (now - bot._lastJitter > JITTER_INTERVAL) {
    bot._jitterX = (Math.random() - 0.5) * 40;
    bot._jitterY = (Math.random() - 0.5) * 40;
    bot._lastJitter = now;
  }

  if (bot.isIt) chaseNearest(bot, allEntities);
  else fleeFromIt(bot, allEntities, bounds);

  bot.targetX += bot._jitterX * 0.015;
  bot.targetY += bot._jitterY * 0.015;
  bot.clampToBounds(bounds);
}

function chaseNearest(bot, allEntities) {
  let nearest = null;
  let nearestDist = Infinity;
  for (const entity of allEntities) {
    if (entity === bot || entity.isIt) continue;
    const dist = bot.distanceTo(entity);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = entity;
    }
  }
  if (nearest) bot.setTarget(nearest.x, nearest.y);
}

function fleeFromIt(bot, allEntities, bounds) {
  const itEntity = allEntities.find((e) => e.isIt);
  if (!itEntity) return;
  const awayAngle = Math.atan2(bot.y - itEntity.y, bot.x - itEntity.x);
  let bestX = bot.x;
  let bestY = bot.y;
  let bestScore = -Infinity;

  for (let i = 0; i < FLEE_SAMPLES; i++) {
    const spread = (i / (FLEE_SAMPLES - 1) - 0.5) * Math.PI * 0.85;
    const angle = awayAngle + spread;
    const tx = clamp(bot.x + Math.cos(angle) * FLEE_DISTANCE, bounds.left + bot.radius, bounds.right - bot.radius);
    const ty = clamp(bot.y + Math.sin(angle) * FLEE_DISTANCE, bounds.top + bot.radius, bounds.bottom - bot.radius);
    const distFromIt = Math.hypot(tx - itEntity.x, ty - itEntity.y);
    const edgePenalty = wallProximityPenalty(tx, ty, bot, bounds);
    const score = distFromIt - edgePenalty;
    if (score > bestScore) {
      bestScore = score;
      bestX = tx;
      bestY = ty;
    }
  }
  bot.setTarget(bestX, bestY);
}

function wallProximityPenalty(x, y, bot, bounds) {
  const margin = bot.radius * 2.5;
  const minDist = Math.min(
    x - (bounds.left + bot.radius),
    bounds.right - bot.radius - x,
    y - (bounds.top + bot.radius),
    bounds.bottom - bot.radius - y
  );
  return minDist >= margin ? 0 : (margin - minDist) * 3;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
