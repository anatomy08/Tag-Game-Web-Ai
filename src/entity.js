export class Entity {
  constructor({ x, y, radius, color, speed, isPlayer = false, name = '' }) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.speed = speed;
    this.baseSpeed = speed;
    this.isPlayer = isPlayer;
    this.name = name;
    this.isIt = false;
    this.targetX = x;
    this.targetY = y;
    this.speedBoostHold = 0;
    this.speedBoostFade = 0;
    this.speedBoostFadeDuration = 0;
    this.speedBoostMultiplier = 1;
  }

  setTarget(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  moveTowardTarget(deltaTime, bounds) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1) return;
    const ratio = Math.min((this.speed * deltaTime) / dist, 1);
    this.x += dx * ratio;
    this.y += dy * ratio;
    this.clampToBounds(bounds);
  }

  moveByInput(dirX, dirY, deltaTime, bounds) {
    const len = Math.hypot(dirX, dirY);
    if (len < 0.01) return;
    this.x += (dirX / len) * this.speed * deltaTime;
    this.y += (dirY / len) * this.speed * deltaTime;
    this.clampToBounds(bounds);
    this.targetX = this.x;
    this.targetY = this.y;
  }

  clampToBounds(bounds) {
    this.x = Math.max(bounds.left + this.radius, Math.min(bounds.right - this.radius, this.x));
    this.y = Math.max(bounds.top + this.radius, Math.min(bounds.bottom - this.radius, this.y));
    this.targetX = Math.max(bounds.left + this.radius, Math.min(bounds.right - this.radius, this.targetX));
    this.targetY = Math.max(bounds.top + this.radius, Math.min(bounds.bottom - this.radius, this.targetY));
  }

  distanceTo(other) {
    return Math.hypot(other.x - this.x, other.y - this.y);
  }

  resetPosition(x, y) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speed = this.baseSpeed;
    this.speedBoostHold = 0;
    this.speedBoostFade = 0;
    this.speedBoostFadeDuration = 0;
    this.speedBoostMultiplier = 1;
  }

  applySpeedBoost(multiplier, holdSeconds, fadeSeconds) {
    this.speedBoostMultiplier = multiplier;
    this.speedBoostHold = holdSeconds;
    this.speedBoostFade = fadeSeconds;
    this.speedBoostFadeDuration = fadeSeconds;
    this.speed = this.baseSpeed * multiplier;
  }

  updateSpeedBoost(deltaTime) {
    if (this.speedBoostHold > 0) {
      this.speedBoostHold = Math.max(0, this.speedBoostHold - deltaTime);
      this.speed = this.baseSpeed * this.speedBoostMultiplier;
      return;
    }
    if (this.speedBoostFade > 0) {
      this.speedBoostFade = Math.max(0, this.speedBoostFade - deltaTime);
      const ratio = this.speedBoostFadeDuration > 0 ? this.speedBoostFade / this.speedBoostFadeDuration : 0;
      this.speed = this.baseSpeed * (1 + (this.speedBoostMultiplier - 1) * ratio);
      return;
    }
    this.speed = this.baseSpeed;
  }
}
