import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Device, Subscription } from "react-native-ble-plx";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  parseHeartRate,
  HeartRateData,
  HR_SERVICE_UUID,
  HR_MEASUREMENT_UUID,
} from "./heart-rate";
import { getBleManager, scanForHRDevices, stopScan, BLEDevice } from "./device-scanner";
import { getZoneForHR, HRSample } from "./hr-zones";

const LAST_DEVICE_KEY = "@ble_last_device";
const MAX_HR_KEY = "@ble_max_hr";

export type ConnectionState = "disconnected" | "scanning" | "connecting" | "connected" | "streaming";

interface BLEContextType {
  connectionState: ConnectionState;
  connectedDevice: BLEDevice | null;
  currentHR: number;
  currentZone: number;
  hrHistory: HRSample[];
  allSamples: HRSample[];
  isScanning: boolean;
  discoveredDevices: BLEDevice[];
  maxHR: number;
  startScan: () => Promise<void>;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  startHRStream: () => Promise<void>;
  stopHRStream: () => void;
  setMaxHR: (hr: number) => Promise<void>;
  clearSamples: () => void;
}

const BLEContext = createContext<BLEContextType | null>(null);

export function BLEProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [connectedDevice, setConnectedDevice] = useState<BLEDevice | null>(null);
  const [currentHR, setCurrentHR] = useState(0);
  const [currentZone, setCurrentZone] = useState(1);
  const [hrHistory, setHRHistory] = useState<HRSample[]>([]);
  const [allSamples, setAllSamples] = useState<HRSample[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState<BLEDevice[]>([]);
  const [maxHR, setMaxHRState] = useState(190);

  const bleDeviceRef = useRef<Device | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved maxHR on mount
  useEffect(() => {
    AsyncStorage.getItem(MAX_HR_KEY).then((val) => {
      if (val) setMaxHRState(parseInt(val, 10));
    });
  }, []);

  // Auto-reconnect to last device on mount
  useEffect(() => {
    AsyncStorage.getItem(LAST_DEVICE_KEY).then((deviceId) => {
      if (deviceId) {
        connect(deviceId).catch(() => {});
      }
    });
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const setMaxHR = useCallback(async (hr: number) => {
    setMaxHRState(hr);
    await AsyncStorage.setItem(MAX_HR_KEY, String(hr));
  }, []);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setConnectionState("scanning");
    setDiscoveredDevices([]);
    try {
      const devices = await scanForHRDevices();
      setDiscoveredDevices(devices);
    } catch (err) {
      console.warn("BLE scan error:", err);
    } finally {
      setIsScanning(false);
      setConnectionState((s) => (s === "scanning" ? "disconnected" : s));
    }
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    const mgr = getBleManager();
    setConnectionState("connecting");

    try {
      let device = await mgr.connectToDevice(deviceId, {
        requestMTU: 512,
        timeout: 10000,
      });

      device = await device.discoverAllServicesAndCharacteristics();

      const name = device.name || device.localName || "HR Device";
      const bleDevice: BLEDevice = {
        id: device.id,
        name,
        rssi: device.rssi ?? -100,
      };

      bleDeviceRef.current = device;
      setConnectedDevice(bleDevice);
      setConnectionState("connected");

      // Save for auto-reconnect
      await AsyncStorage.setItem(LAST_DEVICE_KEY, deviceId);

      // Monitor disconnection for auto-reconnect
      device.onDisconnected((error, d) => {
        console.log("BLE device disconnected", error?.message);
        setConnectionState("disconnected");
        setConnectedDevice(null);
        setCurrentHR(0);
        bleDeviceRef.current = null;
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;

        // Auto-reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect(deviceId).catch(() => {});
        }, 3000);
      });
    } catch (err) {
      console.warn("BLE connect error:", err);
      setConnectionState("disconnected");
      throw err;
    }
  }, []);

  const startHRStream = useCallback(async () => {
    const device = bleDeviceRef.current;
    if (!device) throw new Error("No device connected");

    setConnectionState("streaming");

    const sub = device.monitorCharacteristicForService(
      HR_SERVICE_UUID,
      HR_MEASUREMENT_UUID,
      (error, characteristic) => {
        if (error) {
          console.warn("HR stream error:", error.message);
          return;
        }

        if (characteristic?.value) {
          // Decode base64 to byte array
          const raw = atob(characteristic.value);
          const bytes = Array.from(raw, (c) => c.charCodeAt(0));
          const data: HeartRateData = parseHeartRate(bytes);

          if (data.hr > 0) {
            const zone = getZoneForHR(data.hr, maxHR);
            const sample: HRSample = {
              hr: data.hr,
              timestamp: Date.now(),
              zone,
            };

            setCurrentHR(data.hr);
            setCurrentZone(zone);

            setHRHistory((prev) => {
              const cutoff = Date.now() - 60000;
              const filtered = prev.filter((s) => s.timestamp > cutoff);
              return [...filtered, sample];
            });

            setAllSamples((prev) => [...prev, sample]);
          }
        }
      }
    );

    subscriptionRef.current = sub;
  }, [maxHR]);

  const stopHRStream = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    if (connectionState === "streaming") {
      setConnectionState("connected");
    }
  }, [connectionState]);

  const disconnect = useCallback(async () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    stopHRStream();

    if (bleDeviceRef.current) {
      try {
        await bleDeviceRef.current.cancelConnection();
      } catch (err) {
        // Already disconnected
      }
      bleDeviceRef.current = null;
    }

    setConnectedDevice(null);
    setConnectionState("disconnected");
    setCurrentHR(0);
    setCurrentZone(1);
    await AsyncStorage.removeItem(LAST_DEVICE_KEY);
  }, [stopHRStream]);

  const clearSamples = useCallback(() => {
    setAllSamples([]);
    setHRHistory([]);
  }, []);

  return (
    <BLEContext.Provider
      value={{
        connectionState,
        connectedDevice,
        currentHR,
        currentZone,
        hrHistory,
        allSamples,
        isScanning,
        discoveredDevices,
        maxHR,
        startScan,
        connect,
        disconnect,
        startHRStream,
        stopHRStream,
        setMaxHR,
        clearSamples,
      }}
    >
      {children}
    </BLEContext.Provider>
  );
}

export function useBLE() {
  const ctx = useContext(BLEContext);
  if (!ctx) throw new Error("useBLE must be used within BLEProvider");
  return ctx;
}
