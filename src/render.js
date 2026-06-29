export function render(ctx, { bounds, canvasSize, entities, player, pulsePhase, score = 0, timeLeft = 0 }) {
  const { width, height } = canvasSize;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);

  const { left, top, right, bottom } = bounds;
  const w = right - left;
  const h = bottom - top;
  drawBackground(ctx, left, top, w, h);
  drawArenaBorder(ctx, left, top, w, h);
  drawMapHud(ctx, left, top, w, score, timeLeft);
  drawTargetLine(ctx, player);
  for (const entity of entities) drawEntity(ctx, entity, pulsePhase);
}

function drawBackground(ctx, x, y, w, h) {
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let gx = x; gx <= x + w; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, y);
    ctx.lineTo(gx, y + h);
    ctx.stroke();
  }
  for (let gy = y; gy <= y + h; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(x, gy);
    ctx.lineTo(x + w, gy);
    ctx.stroke();
  }
}

function drawArenaBorder(ctx, x, y, w, h) {
  ctx.strokeStyle = '#4ecca3';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(78, 204, 163, 0.25)';
  ctx.lineWidth = 6;
  ctx.strokeRect(x - 2, y - 2, w + 4, h + 4);
}

function drawMapHud(ctx, x, y, w, score, timeLeft) {
  const mins = Math.floor(timeLeft / 60);
  const secs = String(Math.floor(timeLeft % 60)).padStart(2, '0');
  ctx.save();
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillStyle = 'rgba(26, 26, 46, 0.72)';
  ctx.fillRect(x + 10, y + 10, 104, 32);
  ctx.fillRect(x + w - 90, y + 10, 80, 32);
  ctx.fillStyle = '#eef7ff';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, x + 20, y + 17);
  ctx.textAlign = 'right';
  ctx.fillText(mins + ':' + secs, x + w - 20, y + 17);
  ctx.restore();
}

function drawTargetLine(ctx, player) {
  const dx = player.targetX - player.x;
  const dy = player.targetY - player.y;
  if (Math.hypot(dx, dy) < 5) return;
  ctx.strokeStyle = 'rgba(78, 204, 163, 0.25)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.targetX, player.targetY);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawEntity(ctx, entity, pulsePhase) {
  const { x, y, radius, color, isIt, isPlayer } = entity;
  if (isIt) {
    const pulse = 1 + Math.sin(pulsePhase) * 0.15;
    ctx.beginPath();
    ctx.arc(x, y, radius * 1.8 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(233, 69, 96, 0.25)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e94560';
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (isPlayer) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('YOU', x, y);
  }
}
