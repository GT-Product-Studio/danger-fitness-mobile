/**
 * Unified Health Data Provider
 * 
 * Abstracts platform differences:
 * - iOS: Apple HealthKit (Apple Watch HR data)
 * - Android: Google Health Connect (Wear OS HR data)
 * 
 * This complements BLE direct connection:
 * - BLE: Real-time HR from Polar/Garmin/Wahoo/chest straps
 * - HealthKit/Health Connect: Apple Watch & Samsung Galaxy Watch data
 * 
 * Together, they cover virtually every fitness device on the market.
 */
import { Platform } from "react-native";

export interface HealthHRSample {
  value: number;
  startDate: string;
  endDate: string;
  sourceName: string;
}

export type HealthSource = "healthkit" | "health-connect" | "none";

/**
 * Get which health platform is available
 */
export function getHealthSource(): HealthSource {
  if (Platform.OS === "ios") return "healthkit";
  if (Platform.OS === "android") return "health-connect";
  return "none";
}

/**
 * Request health data permissions (platform-aware)
 */
export async function requestHealthPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    const { requestHealthKitPermissions } = require("./apple-health");
    return requestHealthKitPermissions();
  }
  if (Platform.OS === "android") {
    const { requestHealthConnectPermissions } = require("./google-health");
    return requestHealthConnectPermissions();
  }
  return false;
}

/**
 * Get heart rate samples from the platform health store
 */
export async function getHeartRateSamples(
  startDate: Date,
  endDate?: Date
): Promise<HealthHRSample[]> {
  if (Platform.OS === "ios") {
    const appleHealth = require("./apple-health");
    return appleHealth.getHeartRateSamples(startDate, endDate);
  }
  if (Platform.OS === "android") {
    const googleHealth = require("./google-health");
    return googleHealth.getHeartRateSamples(startDate, endDate);
  }
  return [];
}

/**
 * Get resting heart rate (iOS only for now)
 */
export async function getRestingHeartRate(): Promise<number | null> {
  if (Platform.OS === "ios") {
    const { getRestingHeartRate: getRHR } = require("./apple-health");
    return getRHR();
  }
  return null;
}

/**
 * Observe real-time HR changes (iOS only — HealthKit background delivery)
 * Returns cleanup function
 */
export function observeHeartRate(
  callback: (sample: HealthHRSample) => void
): () => void {
  if (Platform.OS === "ios") {
    const { observeHeartRate: observe } = require("./apple-health");
    return observe(callback);
  }
  return () => {};
}
