/**
 * Google Health Connect Integration
 * 
 * Reads HR data from Wear OS watches (Samsung Galaxy Watch, Pixel Watch, etc.)
 * via Google Health Connect on Android.
 * 
 * Android only — iOS uses Apple HealthKit (see apple-health.ts)
 */
import { Platform } from "react-native";

let HealthConnect: any = null;
if (Platform.OS === "android") {
  try {
    HealthConnect = require("react-native-health-connect");
  } catch {
    console.warn("react-native-health-connect not available");
  }
}

export interface HealthHRSample {
  value: number;
  startDate: string;
  endDate: string;
  sourceName: string;
}

/**
 * Check if Health Connect is available (Android only)
 */
export function isHealthConnectAvailable(): boolean {
  if (Platform.OS !== "android" || !HealthConnect) return false;
  return true;
}

/**
 * Initialize Health Connect and request permissions
 */
export async function requestHealthConnectPermissions(): Promise<boolean> {
  if (!isHealthConnectAvailable()) return false;

  try {
    const isAvailable = await HealthConnect.getSdkStatus();
    if (isAvailable !== HealthConnect.SdkAvailabilityStatus.SDK_AVAILABLE) {
      return false;
    }

    await HealthConnect.initialize();

    const granted = await HealthConnect.requestPermission([
      { accessType: "read", recordType: "HeartRate" },
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "Distance" },
      { accessType: "read", recordType: "ActiveCaloriesBurned" },
      { accessType: "read", recordType: "Steps" },
      { accessType: "write", recordType: "ExerciseSession" },
    ]);

    return granted.length > 0;
  } catch (err) {
    console.error("Health Connect permission error:", err);
    return false;
  }
}

/**
 * Get heart rate records from Health Connect
 */
export async function getHeartRateSamples(
  startDate: Date,
  endDate: Date = new Date()
): Promise<HealthHRSample[]> {
  if (!isHealthConnectAvailable()) return [];

  try {
    const result = await HealthConnect.readRecords("HeartRate", {
      timeRangeFilter: {
        operator: "between",
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      },
    });

    const samples: HealthHRSample[] = [];
    for (const record of result) {
      for (const sample of record.samples || []) {
        samples.push({
          value: sample.beatsPerMinute,
          startDate: sample.time,
          endDate: sample.time,
          sourceName: record.metadata?.dataOrigin || "Wear OS",
        });
      }
    }

    return samples.sort(
      (a, b) =>
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  } catch (err) {
    console.error("Health Connect HR fetch error:", err);
    return [];
  }
}
