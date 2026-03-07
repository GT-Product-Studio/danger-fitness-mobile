import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../lib/constants/brand";
import { useBLE } from "../lib/ble/BLEProvider";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

function RSSIBars({ rssi }: { rssi: number }) {
  // Convert RSSI to 1-4 bars
  const bars = rssi > -60 ? 4 : rssi > -70 ? 3 : rssi > -80 ? 2 : 1;
  return (
    <View style={rssiStyles.container}>
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            rssiStyles.bar,
            { height: 4 + i * 3 },
            i <= bars ? rssiStyles.barActive : rssiStyles.barInactive,
          ]}
        />
      ))}
    </View>
  );
}

const rssiStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar: { width: 4, borderRadius: 1 },
  barActive: { backgroundColor: COLORS.primary },
  barInactive: { backgroundColor: COLORS.border },
});

export default function ConnectDeviceScreen() {
  const router = useRouter();
  const {
    connectionState,
    connectedDevice,
    isScanning,
    discoveredDevices,
    startScan,
    connect,
    disconnect,
  } = useBLE();

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning]);

  const handleConnect = async (deviceId: string) => {
    try {
      await connect(deviceId);
      Alert.alert("Connected!", "Heart rate monitor connected successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert("Connection Failed", "Could not connect to device. Please try again.");
    }
  };

  const isConnected =
    connectionState === "connected" || connectionState === "streaming";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connect Device</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Connected Device */}
        {isConnected && connectedDevice && (
          <Card style={styles.connectedCard} highlighted>
            <View style={styles.connectedRow}>
              <View style={styles.connectedInfo}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                <View>
                  <Text style={styles.connectedName}>{connectedDevice.name}</Text>
                  <Text style={styles.connectedLabel}>Connected</Text>
                </View>
              </View>
              <Button
                title="Disconnect"
                onPress={disconnect}
                variant="outline"
                size="small"
              />
            </View>
          </Card>
        )}

        {/* Scan Button */}
        {!isConnected && (
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Button
              title={isScanning ? "Scanning..." : "Scan for Devices"}
              onPress={startScan}
              loading={isScanning}
              disabled={isScanning}
              size="large"
              style={styles.scanBtn}
            />
          </Animated.View>
        )}

        {/* Scanning Indicator */}
        {isScanning && (
          <View style={styles.scanningRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.scanningText}>
              Looking for heart rate monitors...
            </Text>
          </View>
        )}

        {/* Discovered Devices */}
        {discoveredDevices.length > 0 && !isConnected && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FOUND DEVICES</Text>
            {discoveredDevices
              .sort((a, b) => b.rssi - a.rssi)
              .map((device) => (
                <Card key={device.id} style={styles.deviceCard}>
                  <TouchableOpacity
                    style={styles.deviceRow}
                    onPress={() => handleConnect(device.id)}
                    activeOpacity={0.7}
                    disabled={connectionState === "connecting"}
                  >
                    <Ionicons name="watch-outline" size={28} color={COLORS.primary} />
                    <View style={styles.deviceInfo}>
                      <Text style={styles.deviceName}>{device.name}</Text>
                      <Text style={styles.deviceId}>
                        {device.id.substring(0, 17)}...
                      </Text>
                    </View>
                    <RSSIBars rssi={device.rssi} />
                    {connectionState === "connecting" ? (
                      <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    )}
                  </TouchableOpacity>
                </Card>
              ))}
          </View>
        )}

        {/* No Devices Found */}
        {!isScanning && discoveredDevices.length === 0 && !isConnected && (
          <View style={styles.emptyState}>
            <Ionicons name="bluetooth-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Devices Found</Text>
            <Text style={styles.emptyText}>
              Make sure your heart rate monitor is turned on and broadcasting.
            </Text>
          </View>
        )}

        {/* Skip */}
        {!isConnected && (
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}

        {/* Supported Devices */}
        <Card style={styles.supportedCard}>
          <Text style={styles.supportedTitle}>Supported Devices</Text>
          <Text style={styles.supportedText}>
            Works with any Bluetooth heart rate monitor including:
          </Text>
          {[
            "Polar H10, H9, OH1, Verity Sense",
            "Garmin HRM-Pro, HRM-Dual",
            "Wahoo TICKR, TICKR X, TICKR FIT",
            "Apple Watch (with HR broadcast)",
            "Any BLE heart rate chest strap",
          ].map((device) => (
            <View key={device} style={styles.supportedRow}>
              <Ionicons name="checkmark" size={16} color={COLORS.primary} />
              <Text style={styles.supportedDevice}>{device}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  connectedCard: {
    marginBottom: 20,
  },
  connectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectedName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  connectedLabel: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
  scanBtn: {
    width: "100%",
    marginBottom: 16,
  },
  scanningRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  scanningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  deviceCard: {
    marginBottom: 8,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  deviceId: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 16,
    marginBottom: 20,
  },
  skipText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
  supportedCard: {
    marginTop: 8,
  },
  supportedTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
  },
  supportedText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  supportedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  supportedDevice: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});
