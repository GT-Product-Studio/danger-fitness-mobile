import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { BLOCK_CONFIG } from "../../lib/constants/brand";

interface BlockIconProps {
  block: string;
  size?: number;
  showLabel?: boolean;
}

export function BlockIcon({ block, size = 20, showLabel = false }: BlockIconProps) {
  const config = BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG] || {
    icon: "💪",
    color: "#808080",
    label: block,
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: size }}>{config.icon}</Text>
      {showLabel && (
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
});
