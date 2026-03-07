import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { getZoneColor, getZoneLabel } from "../../lib/ble/hr-zones";

interface HeartRateDisplayProps {
  hr: number;
  zone: number;
  connected: boolean;
  streaming: boolean;
  onConnectPress?: () => void;
}

export function HeartRateDisplay({
  hr,
  zone,
  connected,
  streaming,
  onConnectPress,
}: HeartRateDisplayProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (streaming && hr > 0) {
      // Heart pulse animation
      const interval = hr > 0 ? 60000 / hr : 1000;
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: Math.min(interval * 0.3, 200),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: Math.min(interval * 0.7, 500),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Background glow
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();

      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [streaming, hr]);

  const zoneColor = getZoneColor(zone);
  const zoneLabel = getZoneLabel(zone);

  const bgColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(0,0,0,0)", `${zoneColor}15`],
  });

  if (!connected) {
    return (
      <Animated.View style={[styles.container, { backgroundColor: COLORS.surface }]}>
        <Text style={styles.hrNumber}>--</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
        <Text style={[styles.connectPrompt, onConnectPress && styles.connectLink]}
          onPress={onConnectPress}
        >
          Connect Watch
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }]}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Ionicons name="heart" size={28} color={zoneColor} />
      </Animated.View>

      <Text style={[styles.hrNumber, { color: streaming ? zoneColor : COLORS.textMuted }]}>
        {streaming && hr > 0 ? hr : "--"}
      </Text>
      <Text style={styles.bpmLabel}>BPM</Text>

      {streaming && hr > 0 && (
        <Text style={[styles.zoneLabel, { color: zoneColor }]}>
          ZONE {zone} — {zoneLabel.toUpperCase()}
        </Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hrNumber: {
    fontSize: 64,
    fontWeight: "900",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
    lineHeight: 72,
  },
  bpmLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 3,
    marginTop: -4,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2,
    marginTop: 12,
  },
  connectPrompt: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 12,
  },
  connectLink: {
    color: COLORS.primary,
    textDecorationLine: "underline",
  },
});
