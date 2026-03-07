// Danger Fitness Brand Constants
// All brand strings and colors in one place

export const BRAND = {
  name: "Danger Fitness",
  tagline: "TRAIN WITH HAIDEN",
  subtitle: "The Regiment. The Challenge. The Danger.",
  trainer: {
    name: "Haiden Deegan",
    nickname: "Danger Boy",
    age: 20,
    team: "Monster Energy Yamaha Star Racing",
    titles: "2× SMX Champion",
    location: "Temecula, CA",
    maxHR: 210,
    restingHR: 42,
    instagram: "~2M",
    tiktok: "~1.4M",
  },
  subscription: {
    price: "$19.99",
    period: "month",
    productId: "danger_fitness_monthly",
    trialDays: 7,
  },
  scoring: {
    cyclingMultiplier: 1,    // per mile
    motoMultiplier: 25,      // per hour
    gymMultiplier: 20,       // per hour
    haidenBenchmark: 1690,   // monthly target
  },
} as const;

export const COLORS = {
  background: "#0A0A0A",
  surface: "#141414",
  surfaceAlt: "#1A1A1A",
  border: "#2A2A2A",
  primary: "#29F000",
  primaryDark: "#22D400",
  primaryGlow: "rgba(41, 240, 0, 0.15)",
  primaryMuted: "rgba(41, 240, 0, 0.3)",
  text: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textMuted: "#666666",
  danger: "#FF4444",
  warning: "#FFD700",
  orange: "#FF6B00",
} as const;

export const HR_ZONES = {
  z1: { min: 0.50, max: 0.60, color: "#808080", label: "Easy", name: "Zone 1" },
  z2: { min: 0.60, max: 0.70, color: "#29F000", label: "Fat Burn", name: "Zone 2" },
  z3: { min: 0.70, max: 0.80, color: "#FFD700", label: "Aerobic", name: "Zone 3" },
  z4: { min: 0.80, max: 0.90, color: "#FF6B00", label: "Threshold", name: "Zone 4" },
  z5: { min: 0.90, max: 1.00, color: "#FF0000", label: "Max Effort", name: "Zone 5" },
} as const;

export const BLOCK_CONFIG = {
  cycling: { icon: "🚴", color: "#29F000", label: "Road Ride" },
  moto: { icon: "🏍️", color: "#FF6B00", label: "Moto Practice" },
  gym: { icon: "🏋️", color: "#FFD700", label: "Gym Training" },
  recovery: { icon: "🧘", color: "#808080", label: "Recovery" },
  race: { icon: "🏁", color: "#FF0000", label: "Race Day" },
} as const;

export function getHRZone(hr: number, maxHR: number = 190): number {
  const pct = hr / maxHR;
  if (pct >= 0.90) return 5;
  if (pct >= 0.80) return 4;
  if (pct >= 0.70) return 3;
  if (pct >= 0.60) return 2;
  return 1;
}

export function getHRZoneColor(zone: number): string {
  switch (zone) {
    case 5: return HR_ZONES.z5.color;
    case 4: return HR_ZONES.z4.color;
    case 3: return HR_ZONES.z3.color;
    case 2: return HR_ZONES.z2.color;
    default: return HR_ZONES.z1.color;
  }
}

export function getHRZoneLabel(zone: number): string {
  switch (zone) {
    case 5: return HR_ZONES.z5.label;
    case 4: return HR_ZONES.z4.label;
    case 3: return HR_ZONES.z3.label;
    case 2: return HR_ZONES.z2.label;
    default: return HR_ZONES.z1.label;
  }
}
