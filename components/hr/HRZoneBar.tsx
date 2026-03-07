import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../lib/constants/brand";
import { ZONE_COLORS, ZoneTime } from "../../lib/ble/hr-zones";

interface HRZoneBarProps {
  zoneTime: ZoneTime;
  showLabels?: boolean;
  height?: number;
}

export function HRZoneBar({ zoneTime, showLabels = true, height = 24 }: HRZoneBarProps) {
  const total = zoneTime.z1 + zoneTime.z2 + zoneTime.z3 + zoneTime.z4 + zoneTime.z5;

  if (total === 0) {
    return (
      <View style={[styles.bar, { height }]}>
        <View style={[styles.segment, { flex: 1, backgroundColor: COLORS.border }]} />
      </View>
    );
  }

  const zones = [
    { key: "z1", seconds: zoneTime.z1, color: ZONE_COLORS[1], label: "Z1" },
    { key: "z2", seconds: zoneTime.z2, color: ZONE_COLORS[2], label: "Z2" },
    { key: "z3", seconds: zoneTime.z3, color: ZONE_COLORS[3], label: "Z3" },
    { key: "z4", seconds: zoneTime.z4, color: ZONE_COLORS[4], label: "Z4" },
    { key: "z5", seconds: zoneTime.z5, color: ZONE_COLORS[5], label: "Z5" },
  ].filter((z) => z.seconds > 0);

  return (
    <View>
      <View style={[styles.bar, { height }]}>
        {zones.map((z) => (
          <View
            key={z.key}
            style={[
              styles.segment,
              {
                flex: z.seconds / total,
                backgroundColor: z.color,
              },
            ]}
          />
        ))}
      </View>
      {showLabels && (
        <View style={styles.labelRow}>
          {zones.map((z) => {
            const pct = Math.round((z.seconds / total) * 100);
            const mins = Math.floor(z.seconds / 60);
            const secs = Math.round(z.seconds % 60);
            return (
              <View key={z.key} style={[styles.labelItem, { flex: z.seconds / total }]}>
                <View style={[styles.labelDot, { backgroundColor: z.color }]} />
                <Text style={styles.labelText}>
                  {z.label} {pct}%{mins > 0 ? ` (${mins}:${secs.toString().padStart(2, "0")})` : ""}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderRadius: 6,
    overflow: "hidden",
  },
  segment: {
    minWidth: 2,
  },
  labelRow: {
    flexDirection: "row",
    marginTop: 8,
    flexWrap: "wrap",
    gap: 4,
  },
  labelItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 50,
  },
  labelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  labelText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
});
