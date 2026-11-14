import { PATH_GRAMMAR } from '@plate-region/plate-data';

/** SVG view box with a non-zero origin (path bounds plus margin). */
export type PathViewBox = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/**
 * Absolute points of an `M`/`l`/`z` path (PATH_GRAMMAR). Throws if the path
 * uses any other command. `M` pairs after the first are absolute; `l` is
 * relative; `z` returns the pen to the current subpath start (#176).
 */
export function decodeMlzPath(
  path: string,
): ReadonlyArray<readonly [number, number]> {
  if (!PATH_GRAMMAR.test(path)) {
    throw new Error(`path fails PATH_GRAMMAR: ${path.slice(0, 40)}`);
  }
  const points: Array<readonly [number, number]> = [];
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const part of path.match(/[Mlz][^Mlz]*/g) ?? []) {
    const command = part[0];
    const numbers = (part.slice(1).match(/-?\d+/g) ?? []).map(Number);
    if (numbers.length % 2 !== 0) {
      throw new Error(`path has an incomplete coordinate pair: ${part}`);
    }
    if (command === 'M') {
      if (numbers.length < 2) {
        throw new Error(`path M needs at least one point: ${part}`);
      }
      x = numbers[0] as number;
      y = numbers[1] as number;
      startX = x;
      startY = y;
      points.push([x, y]);
      for (let i = 2; i < numbers.length; i += 2) {
        x = numbers[i] as number;
        y = numbers[i + 1] as number;
        points.push([x, y]);
      }
      continue;
    }
    if (command === 'l') {
      for (let i = 0; i < numbers.length; i += 2) {
        x += numbers[i] as number;
        y += numbers[i + 1] as number;
        points.push([x, y]);
      }
      continue;
    }
    // z — return to the subpath start (no new extrema if start is already listed).
    x = startX;
    y = startY;
  }
  return points;
}

/** Bounding box of SVG path data plus a fractional margin on each side. */
export function pathViewBox(path: string, marginFraction = 0.2): PathViewBox {
  const points = decodeMlzPath(path);
  if (points.length === 0) {
    throw new Error('path has no points');
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [px, py] of points) {
    if (px < minX) minX = px;
    if (py < minY) minY = py;
    if (px > maxX) maxX = px;
    if (py > maxY) maxY = py;
  }
  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * marginFraction;
  const padY = height * marginFraction;
  return {
    x: minX - padX,
    y: minY - padY,
    width: width + 2 * padX,
    height: height + 2 * padY,
  };
}
