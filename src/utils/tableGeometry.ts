export interface SeatPoint {
  /** Position as a percentage of the table width / height. */
  xPct: number;
  yPct: number;
  /** Outward unit normal of the table edge at this point. */
  nx: number;
  ny: number;
}

interface Segment {
  length: number;
  at: (t: number) => { x: number; y: number; nx: number; ny: number };
}

/**
 * Evenly spaced seats along the edge of a stadium-shaped table (straight sides, round ends),
 * starting at the bottom center and going clockwise. Works for wide and tall tables.
 */
export function stadiumSeats(count: number, width: number, height: number): SeatPoint[] {
  if (count <= 0 || width <= 0 || height <= 0) return [];
  const w = width;
  const h = height;
  const r = Math.min(w, h) / 2;
  const cx = w / 2;

  const line = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number): Segment => {
    const length = Math.hypot(x1 - x0, y1 - y0);
    return {
      length,
      at: (t) => {
        const k = length === 0 ? 0 : t / length;
        return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, nx, ny };
      },
    };
  };
  const arc = (ax: number, ay: number, from: number): Segment => ({
    length: (Math.PI / 2) * r,
    at: (t) => {
      const angle = from + t / r;
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      return { x: ax + r * nx, y: ay + r * ny, nx, ny };
    },
  });

  // Screen coordinates (y grows downwards): bottom -> left -> top -> right -> bottom.
  const segments: Segment[] = [
    line(cx, h, r, h, 0, 1),
    arc(r, h - r, Math.PI / 2),
    line(0, h - r, 0, r, -1, 0),
    arc(r, r, Math.PI),
    line(r, 0, w - r, 0, 0, -1),
    arc(w - r, r, -Math.PI / 2),
    line(w, r, w, h - r, 1, 0),
    arc(w - r, h - r, 0),
    line(w - r, h, cx, h, 0, 1),
  ];
  const perimeter = segments.reduce((sum, s) => sum + s.length, 0);

  const seats: SeatPoint[] = [];
  for (let i = 0; i < count; i++) {
    let d = (i * perimeter) / count;
    let segment = segments[0];
    for (const s of segments) {
      segment = s;
      if (d <= s.length) break;
      d -= s.length;
    }
    const p = segment.at(Math.min(d, segment.length));
    seats.push({ xPct: (p.x / w) * 100, yPct: (p.y / h) * 100, nx: p.nx, ny: p.ny });
  }
  return seats;
}
