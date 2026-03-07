/**
 * Apple HealthKit Integration
 * 
 * Reads HR data from Apple Watch via HealthKit.
 * Apple Watch doesn't broadcast BLE HR to third-party apps,
 * so we pull it from HealthKit instead.
 * 
 * iOS only — Android uses Google Health Connect (see google-health.ts)
 */
import { Platform } from "react-native";

// Only import on iOS
let AppleHealthKit: any = null;
if (Platform.OS === "ios") {
  try {
    AppleHealthKit = require("react-native-health").default;
  } catch {
    console.warn("react-native-health not available");
  }
}

const HEALTHKIT_PERMISSIONS = {
  permissions: {
    read: [
      "HeartRate",
      "ActiveEnergyBurned",
      "DistanceCycling",
      "DistanceWalkingRunning",
      "Workout",
      "StepCount",
      "RestingHeartRate",
      "HeartRateVariabilitySDNN",
    ],
    write: ["Workout"],
  },
};

export interface HealthHRSample {
  value: number;
  startDate: string;
  endDate: string;
  sourceName: string;
}

/**
 * Check if HealthKit is available (iOS only)
 */
export function isHealthKitAvailable(): boolean {
  if (Platform.OS !== "ios" || !AppleHealthKit) return false;
  return AppleHealthKit.isAvailable();
}

/**
 * Request HealthKit permissions
 */
export function requestHealthKitPermissions(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(false);
      return;
    }

    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (err: any) => {
      if (err) {
        console.error("HealthKit permission error:", err);
        resolve(false);
        return;
      }
      resolve(true);
    });
  });
}

/**
 * Get heart rate samples from HealthKit
 * Pulls recent HR data from Apple Watch
 */
export function getHeartRateSamples(
  startDate: Date,
  endDate: Date = new Date()
): Promise<HealthHRSample[]> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve([]);
      return;
    }

    const options = {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      ascending: true,
      limit: 0, // no limit
    };

    AppleHealthKit.getHeartRateSamples(options, (err: any, results: any[]) => {
      if (err) {
        console.error("HealthKit HR fetch error:", err);
        resolve([]);
        return;
      }

      resolve(
        results.map((r) => ({
          value: r.value,
          startDate: r.startDate,
          endDate: r.endDate,
          sourceName: r.sourceName || "Apple Watch",
        }))
      );
    });
  });
}

/**
 * Get resting heart rate
 */
export function getRestingHeartRate(): Promise<number | null> {
  return new Promise((resolve) => {
    if (!isHealthKitAvailable()) {
      resolve(null);
      return;
    }

    AppleHealthKit.getRestingHeartRate({}, (err: any, results: any) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(results?.value ?? null);
    });
  });
}

/**
 * Observe real-time heart rate changes (background delivery)
 * Calls the callback whenever new HR data arrives from Apple Watch
 */
export function observeHeartRate(
  callback: (sample: HealthHRSample) => void
): () => void {
  if (!isHealthKitAvailable()) return () => {};

  const observer = AppleHealthKit.addEventListener(
    "heartRate",
    (data: any) => {
      callback({
        value: data.value,
        startDate: data.startDate,
        endDate: data.endDate,
        sourceName: data.sourceName || "Apple Watch",
      });
    }
  );

  // Enable background delivery for heart rate
  AppleHealthKit.enableBackgroundDelivery("HeartRate", 1, (err: any) => {
    if (err) console.warn("HealthKit background delivery error:", err);
  });

  return () => {
    if (observer?.remove) observer.remove();
  };
}
