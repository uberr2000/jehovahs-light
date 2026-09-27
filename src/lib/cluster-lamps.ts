export type LampPoint = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;
export const LAMP_MERGE_KM = 1;

function toXyz(point: LampPoint): [number, number, number] {
  const lat = (point.latitude * Math.PI) / 180;
  const lng = (point.longitude * Math.PI) / 180;
  const r = EARTH_RADIUS_KM * Math.cos(lat);
  return [r * Math.cos(lng), r * Math.sin(lng), EARTH_RADIUS_KM * Math.sin(lat)];
}

/**
 * Collapse lamps within `mergeKm` of an earlier lamp into that lamp, so a
 * household on one Wi-Fi shows one beacon while each person still counts.
 * Buckets 3D points in a km grid, which stays correct at the poles and the
 * antimeridian; at this scale chord distance equals surface distance.
 */
export function clusterLamps<T extends LampPoint>(points: T[], mergeKm = LAMP_MERGE_KM): T[] {
  const cells = new Map<string, [number, number, number][]>();
  const kept: T[] = [];

  for (const point of points) {
    const xyz = toXyz(point);
    const cx = Math.floor(xyz[0] / mergeKm);
    const cy = Math.floor(xyz[1] / mergeKm);
    const cz = Math.floor(xyz[2] / mergeKm);

    let merged = false;
    search: for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const centers = cells.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!centers) continue;
          for (const c of centers) {
            if (Math.hypot(c[0] - xyz[0], c[1] - xyz[1], c[2] - xyz[2]) < mergeKm) {
              merged = true;
              break search;
            }
          }
        }
      }
    }
    if (merged) continue;

    const key = `${cx},${cy},${cz}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(xyz);
    else cells.set(key, [xyz]);
    kept.push(point);
  }

  return kept;
}
