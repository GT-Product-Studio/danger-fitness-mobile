import { HR_ZONES, getHRZone, getHRZoneColor, getHRZoneLabel } from "../constants/brand";

export { getHRZone as getZoneForHR };
export { getHRZoneColor as getZoneColor };
export { getHRZoneLabel as getZoneLabel };

export const ZONE_COLORS = {
  1: HR_ZONES.z1.color,
  2: HR_ZONES.z2.color,
  3: HR_ZONES.z3.color,
  4: HR_ZONES.z4.color,
  5: HR_ZONES.z5.color,
} as const;

export interface HRSample {
  hr: number;
  timestamp: number;
  zone: number;
}

export interface ZoneTime {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
}

/**
 * Calculate time (in seconds) spent in each HR zone from a list of samples.
 * Assumes samples are ~1 second apart.
 */
export function getTimeInZones(samples: HRSample[]): ZoneTime {
  const result: ZoneTime = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0 };

  for (let i = 0; i < samples.length; i++) {
    const sample = samples[i];
    // Estimate seconds per sample
    const duration =
      i < samples.length - 1
        ? Math.min((samples[i + 1].timestamp - sample.timestamp) / 1000, 5)
        : 1;

    const key = `z${sample.zone}` as keyof ZoneTime;
    result[key] += duration;
  }

  return result;
}

/**
 * Get zone boundaries in BPM for a given maxHR.
 */
export function getZoneBoundaries(maxHR: number) {
  return {
    z1: { min: Math.round(maxHR * 0.5), max: Math.round(maxHR * 0.6) },
    z2: { min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7) },
    z3: { min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8) },
    z4: { min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9) },
    z5: { min: Math.round(maxHR * 0.9), max: maxHR },
  };
}
