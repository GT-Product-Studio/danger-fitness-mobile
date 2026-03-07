import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { COLORS } from "../../lib/constants/brand";

interface BadgeProps {
  text: string;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ text, color = COLORS.primary, style }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22" }, style]}>
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
