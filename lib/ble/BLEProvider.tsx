import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Device, Subscription, BleError } from "react-native-ble-plx";
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
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 2000; // 2s, 4s, 8s, 16s, 32s

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
  connectionError: string | null;
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
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const bleDeviceRef = useRef<Device | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectCountRef = useRef(0);
  const isDisconnectingRef = useRef(false);
  const maxHRRef = useRef(190);

  // Keep maxHR ref in sync
  useEffect(() => {
    maxHRRef.current = maxHR;
  }, [maxHR]);

  // Load saved maxHR on mount
  useEffect(() => {
    AsyncStorage.getItem(MAX_HR_KEY).then((val) => {
      if (val) {
        const parsed = parseInt(val, 10);
        setMaxHRState(parsed);
        maxHRRef.current = parsed;
      }
    });
  }, []);

  // Auto-reconnect to last device on mount (one attempt only)
  useEffect(() => {
    AsyncStorage.getItem(LAST_DEVICE_KEY).then((deviceId) => {
      if (deviceId) {
        connectInternal(deviceId, false).catch(() => {
          // Silent fail on auto-reconnect — don't annoy user
        });
      }
    });
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  const setMaxHR = useCallback(async (hr: number) => {
    setMaxHRState(hr);
    maxHRRef.current = hr;
    await AsyncStorage.setItem(MAX_HR_KEY, String(hr));
  }, []);

  const startScan = useCallback(async () => {
    setIsScanning(true);
    setConnectionState("scanning");
    setDiscoveredDevices([]);
    setConnectionError(null);
    try {
      const devices = await scanForHRDevices();
      setDiscoveredDevices(devices);
    } catch (err: any) {
      console.warn("BLE scan error:", err);
      setConnectionError(err?.message || "Scan failed");
    } finally {
      setIsScanning(false);
      setConnectionState((s) => (s === "scanning" ? "disconnected" : s));
    }
  }, []);

  const connectInternal = useCallback(async (deviceId: string, userInitiated: boolean) => {
    const mgr = getBleManager();
    setConnectionState("connecting");
    setConnectionError(null);

    try {
      // Cancel any existing connection first
      try {
        await mgr.cancelDeviceConnection(deviceId);
      } catch {
        // Not connected — that's fine
      }

      let device = await mgr.connectToDevice(deviceId, {
        requestMTU: 512,
        timeout: 15000,
      });

      device = await device.discoverAllServicesAndCharacteristics();

      // Verify the device actually has HR service before declaring success
      const services = await device.services();
      const hasHRService = services.some(
        (s) => s.uuid.toLowerCase().includes("180d")
      );

      const name = device.name || device.localName || "HR Device";
      const bleDevice: BLEDevice = {
        id: device.id,
        name,
        rssi: device.rssi ?? -100,
        isHRDevice: hasHRService,
      };

      bleDeviceRef.current = device;
      setConnectedDevice(bleDevice);
      setConnectionState("connected");
      reconnectCountRef.current = 0; // Reset on successful connection

      // Save for auto-reconnect
      await AsyncStorage.setItem(LAST_DEVICE_KEY, deviceId);

      if (!hasHRService) {
        setConnectionError("Connected but no HR service found — try broadcasting HR from watch");
      }

      // Monitor disconnection
      device.onDisconnected((_error, _d) => {
        if (isDisconnectingRef.current) return; // User-initiated disconnect

        console.log("BLE device disconnected unexpectedly");
        setConnectionState("disconnected");
        setCurrentHR(0);
        bleDeviceRef.current = null;
        subscriptionRef.current?.remove();
        subscriptionRef.current = null;

        // Auto-reconnect with exponential backoff
        if (reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = RECONNECT_BASE_DELAY * Math.pow(2, reconnectCountRef.current);
          reconnectCountRef.current += 1;
          setConnectionError(`Reconnecting (attempt ${reconnectCountRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            connectInternal(deviceId, false).catch(() => {
              if (reconnectCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
                setConnectionError("Connection lost — tap to reconnect");
                setConnectionState("disconnected");
              }
            });
          }, delay);
        } else {
          setConnectionError("Connection lost — tap to reconnect");
          setConnectionState("disconnected");
          setConnectedDevice(null);
        }
      });
    } catch (err: any) {
      console.warn("BLE connect error:", err);
      const msg = err?.message || "Connection failed";
      if (userInitiated) {
        setConnectionError(msg);
      }
      setConnectionState("disconnected");
      throw err;
    }
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    reconnectCountRef.current = 0;
    await connectInternal(deviceId, true);
  }, [connectInternal]);

  const startHRStream = useCallback(async () => {
    const device = bleDeviceRef.current;
    if (!device) throw new Error("No device connected");

    // Clean up any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }

    setConnectionState("streaming");
    setConnectionError(null);

    const sub = device.monitorCharacteristicForService(
      HR_SERVICE_UUID,
      HR_MEASUREMENT_UUID,
      (error: BleError | null, characteristic) => {
        if (error) {
          console.warn("HR stream error:", error.message);
          // Don't crash — just log. The disconnect handler will catch real disconnects.
          return;
        }

        if (characteristic?.value) {
          try {
            const raw = atob(characteristic.value);
            const bytes = Array.from(raw, (c) => c.charCodeAt(0));
            const data: HeartRateData = parseHeartRate(bytes);

            if (data.hr > 0 && data.hr < 250) { // Sanity check
              const zone = getZoneForHR(data.hr, maxHRRef.current);
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
          } catch (parseErr) {
            console.warn("HR parse error:", parseErr);
          }
        }
      }
    );

    subscriptionRef.current = sub;
  }, []);

  const stopHRStream = useCallback(() => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setConnectionState((s) => (s === "streaming" ? "connected" : s));
  }, []);

  const disconnect = useCallback(async () => {
    isDisconnectingRef.current = true;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    reconnectCountRef.current = 0;

    // Stop streaming first
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;

    if (bleDeviceRef.current) {
      try {
        await bleDeviceRef.current.cancelConnection();
      } catch {
        // Already disconnected
      }
      bleDeviceRef.current = null;
    }

    setConnectedDevice(null);
    setConnectionState("disconnected");
    setCurrentHR(0);
    setCurrentZone(1);
    setConnectionError(null);
    await AsyncStorage.removeItem(LAST_DEVICE_KEY);

    // Reset flag after a tick
    setTimeout(() => {
      isDisconnectingRef.current = false;
    }, 100);
  }, []);

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
        connectionError,
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
