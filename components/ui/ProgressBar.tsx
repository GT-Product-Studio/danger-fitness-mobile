import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../lib/constants/brand";

interface ProgressBarProps {
  progress: number; // 0-1
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = COLORS.primary,
  height = 8,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <View style={[styles.track, { height }, style]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: COLORS.border,
    borderRadius: 100,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    borderRadius: 100,
  },
});
