import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { ConnectionState } from "../../lib/ble/BLEProvider";

interface DeviceStatusProps {
  connectionState: ConnectionState;
  deviceName?: string;
  currentHR?: number;
  onPress?: () => void;
}

export function DeviceStatus({
  connectionState,
  deviceName,
  currentHR,
  onPress,
}: DeviceStatusProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (connectionState === "connecting" || connectionState === "streaming") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [connectionState]);

  const dotColor =
    connectionState === "disconnected" || connectionState === "scanning"
      ? COLORS.textMuted
      : connectionState === "connecting"
        ? COLORS.warning
        : COLORS.primary;

  const statusText =
    connectionState === "disconnected"
      ? "Not Connected"
      : connectionState === "scanning"
        ? "Scanning..."
        : connectionState === "connecting"
          ? "Connecting..."
          : connectionState === "streaming" && currentHR
            ? `${currentHR} BPM`
            : deviceName || "Connected";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="bluetooth" size={14} color={dotColor} />
      <Animated.View
        style={[styles.dot, { backgroundColor: dotColor, opacity: pulseAnim }]}
      />
      <Text style={[styles.text, { color: dotColor }]} numberOfLines={1}>
        {statusText}
      </Text>
      {onPress && (
        <Ionicons name="chevron-forward" size={12} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    maxWidth: 120,
  },
});
