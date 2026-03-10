import { BleManager, Device, State } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { HR_SERVICE_UUID } from "./heart-rate";

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
  isHRDevice: boolean;
}

let manager: BleManager | null = null;

function getManager(): BleManager {
  if (!manager) {
    manager = new BleManager();
  }
  return manager;
}

export { getManager as getBleManager };

async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === "ios") {
    return true; // iOS permissions handled via Info.plist
  }

  if (Platform.OS === "android") {
    if (Platform.Version >= 31) {
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED
      );
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  return false;
}

async function ensureBluetoothReady(): Promise<void> {
  const mgr = getManager();
  const state = await mgr.state();
  if (state !== State.PoweredOn) {
    await new Promise<void>((resolve, reject) => {
      const sub = mgr.onStateChange((newState) => {
        if (newState === State.PoweredOn) {
          sub.remove();
          resolve();
        }
      }, true);
      setTimeout(() => {
        sub.remove();
        reject(new Error("Bluetooth not available"));
      }, 10000);
    });
  }
}

// Known HR device name patterns
const HR_NAME_PATTERNS = [
  /garmin/i, /forerunner/i, /fr\d/i, /hrm/i, /polar/i, /wahoo/i, /tickr/i,
  /oh1/i, /verity/i, /coospo/i, /magene/i, /heart/i, /hr/i,
  /scosche/i, /rhythm/i, /moofit/i, /coros/i, /suunto/i, /venu/i,
  /vivoactive/i, /fenix/i, /epix/i, /instinct/i, /enduro/i,
];

function isLikelyHRDevice(name: string, serviceUUIDs: string[]): boolean {
  const advertisesHR = serviceUUIDs.some(
    (uuid) => uuid.toLowerCase().includes("180d")
  );
  const nameMatchesHR = HR_NAME_PATTERNS.some((p) => p.test(name));
  return advertisesHR || nameMatchesHR;
}

export async function scanForHRDevices(): Promise<BLEDevice[]> {
  const granted = await requestPermissions();
  if (!granted) {
    throw new Error("Bluetooth permissions not granted");
  }

  await ensureBluetoothReady();

  const mgr = getManager();
  const devices: Map<string, BLEDevice> = new Map();

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      mgr.stopDeviceScan();
      // Sort: HR devices first, then by signal strength
      const result = Array.from(devices.values()).sort((a, b) => {
        if (a.isHRDevice && !b.isHRDevice) return -1;
        if (!a.isHRDevice && b.isHRDevice) return 1;
        return b.rssi - a.rssi;
      });
      resolve(result);
    }, 15000);

    // Scan ALL BLE devices — no service filter.
    // Show every named device so the user can find their watch.
    mgr.startDeviceScan(
      null,
      { allowDuplicates: false },
      (error: Error | null, device: Device | null) => {
        if (error || !device) return;

        const name = device.name || device.localName;
        if (!name) return;

        const serviceUUIDs = device.serviceUUIDs || [];
        const isHR = isLikelyHRDevice(name, serviceUUIDs);

        devices.set(device.id, {
          id: device.id,
          name,
          rssi: device.rssi ?? -100,
          isHRDevice: isHR,
        });
      }
    );

    (scanForHRDevices as any)._timeout = timeout;
  });
}

export function stopScan(): void {
  const mgr = getManager();
  mgr.stopDeviceScan();
}
