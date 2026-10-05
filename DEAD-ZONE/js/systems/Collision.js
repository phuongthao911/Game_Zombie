/**
 * Collision — Hệ thống va chạm 2D (Circle, Point, AABB)
 */

/**
 * Kiểm tra va chạm giữa 2 hình tròn
 * @param {number} x1 @param {number} y1 @param {number} r1
 * @param {number} x2 @param {number} y2 @param {number} r2
 * @returns {boolean}
 */
export function circleIntersect(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const radiusSum = r1 + r2;
  return (dx * dx + dy * dy) <= (radiusSum * radiusSum);
}

/**
 * Tính khoảng cách euclid giữa 2 điểm
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.hypot(dx, dy);
}

/**
 * Tính khoảng cách bình phương (nhanh hơn vì không dùng sqrt)
 */
export function distanceSq(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Chi tiết va chạm 2 hình tròn kèm vector đẩy ra
 * @returns {{ collided: boolean, overlap: number, nx: number, ny: number }}
 */
export function circleCollisionDetail(x1, y1, r1, x2, y2, r2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distSq = dx * dx + dy * dy;
  const radiusSum = r1 + r2;

  if (distSq > radiusSum * radiusSum || distSq === 0) {
    return { collided: false, overlap: 0, nx: 0, ny: 0 };
  }

  const dist = Math.sqrt(distSq);
  const overlap = radiusSum - dist;
  return {
    collided: true,
    overlap,
    nx: dx / dist,
    ny: dy / dist
  };
}

/**
 * Đẩy 2 entity hình tròn ra xa nhau để tránh chồng lấn (Soft separation)
 * @param {{ x: number, y: number, radius: number }} a
 * @param {{ x: number, y: number, radius: number }} b
 * @param {number} [pushFactor=0.5]
 */
export function separateCircles(a, b, pushFactor = 0.5) {
  const detail = circleCollisionDetail(a.x, a.y, a.radius, b.x, b.y, b.radius);
  if (!detail.collided) return;

  // Mỗi entity chịu một nửa độ lún (half overlap) tỉ lệ theo pushFactor
  const halfOverlap = detail.overlap * 0.5;
  const moveX = detail.nx * halfOverlap * pushFactor;
  const moveY = detail.ny * halfOverlap * pushFactor;

  a.x -= moveX;
  a.y -= moveY;
  b.x += moveX;
  b.y += moveY;
}

/**
 * Kiểm tra va chạm giữa hình tròn và hình hộp AABB
 * @param {number} cx @param {number} cy @param {number} radius
 * @param {number} rx @param {number} ry @param {number} rw @param {number} rh
 * @returns {boolean}
 */
export function circleBoxIntersect(cx, cy, radius, rx, ry, rw, rh) {
  // Tìm điểm gần nhất trên box với tâm hình tròn
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - closestX;
  const dy = cy - closestY;

  return (dx * dx + dy * dy) <= (radius * radius);
}

/**
 * Đẩy hình tròn ra khỏi hình hộp AABB (Obstacle Collision Response)
 * @param {{ x: number, y: number, radius: number }} circle
 * @param {{ x: number, y: number, w: number, h: number }} box
 * @returns {boolean} true nếu có va chạm và đã đẩy ra
 */
export function resolveCircleBox(circle, box) {
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.w));
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.h));

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > circle.radius * circle.radius) {
    return false;
  }

  // Nếu tâm hình tròn nằm bên trong hộp hoàn toàn
  if (distSq === 0) {
    const leftDist   = Math.abs(circle.x - box.x);
    const rightDist  = Math.abs(box.x + box.w - circle.x);
    const topDist    = Math.abs(circle.y - box.y);
    const bottomDist = Math.abs(box.y + box.h - circle.y);
    const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

    if (minDist === leftDist)   circle.x = box.x - circle.radius;
    else if (minDist === rightDist) circle.x = box.x + box.w + circle.radius;
    else if (minDist === topDist)   circle.y = box.y - circle.radius;
    else circle.y = box.y + box.h + circle.radius;
    return true;
  }

  const dist = Math.sqrt(distSq);
  const overlap = circle.radius - dist;
  circle.x += (dx / dist) * overlap;
  circle.y += (dy / dist) * overlap;
  return true;
}

/**
 * Kiểm tra điểm nằm trong hộp AABB
 */
export function pointInBox(px, py, box) {
  return px >= box.x && px <= box.x + box.w && py >= box.y && py <= box.y + box.h;
}
