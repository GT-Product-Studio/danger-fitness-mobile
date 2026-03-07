import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { getHRZoneColor, getHRZoneLabel } from "../../lib/constants/brand";

interface ZoneBadgeProps {
  zone: number;
  compact?: boolean;
}

export function ZoneBadge({ zone, compact = false }: ZoneBadgeProps) {
  const color = getHRZoneColor(zone);
  const label = getHRZoneLabel(zone);

  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {!compact && (
        <Text style={[styles.text, { color }]}>
          Z{zone} {label}
        </Text>
      )}
      {compact && (
        <Text style={[styles.text, { color }]}>Z{zone}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
