import { BleManager, Device, State } from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { HR_SERVICE_UUID } from "./heart-rate";

export interface BLEDevice {
  id: string;
  name: string;
  rssi: number;
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

export async function scanForHRDevices(): Promise<BLEDevice[]> {
  const granted = await requestPermissions();
  if (!granted) {
    throw new Error("Bluetooth permissions not granted");
  }

  await ensureBluetoothReady();

  const mgr = getManager();
  const devices: Map<string, BLEDevice> = new Map();

  // Known HR device name patterns
  const HR_NAME_PATTERNS = [
    /garmin/i, /forerunner/i, /hrm/i, /polar/i, /wahoo/i, /tickr/i,
    /oh1/i, /verity/i, /coospo/i, /magene/i, /heart/i, /hr/i,
    /scosche/i, /rhythm/i, /moofit/i, /coros/i, /suunto/i,
  ];

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      mgr.stopDeviceScan();
      resolve(Array.from(devices.values()));
    }, 15000);

    // Scan WITHOUT service UUID filter — many watches (especially Garmin)
    // don't advertise 0x180D in their scan response even when broadcasting HR.
    // We accept any named device and also specifically look for HR service advertisers.
    mgr.startDeviceScan(
      null, // No service filter — scan all BLE devices
      { allowDuplicates: false },
      (error: Error | null, device: Device | null) => {
        if (error || !device) return;

        const name = device.name || device.localName;
        if (!name) return;

        // Check if device advertises HR service
        const serviceUUIDs = device.serviceUUIDs || [];
        const advertisesHR = serviceUUIDs.some(
          (uuid) => uuid.toLowerCase().includes("180d")
        );

        // Check if device name matches known HR device patterns
        const nameMatchesHR = HR_NAME_PATTERNS.some((p) => p.test(name));

        if (advertisesHR || nameMatchesHR) {
          devices.set(device.id, {
            id: device.id,
            name,
            rssi: device.rssi ?? -100,
          });
        }
      }
    );

    // Allow manual stop
    (scanForHRDevices as any)._timeout = timeout;
  });
}

export function stopScan(): void {
  const mgr = getManager();
  mgr.stopDeviceScan();
}
