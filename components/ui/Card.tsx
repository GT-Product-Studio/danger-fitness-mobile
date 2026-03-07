import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { COLORS } from "../../lib/constants/brand";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  highlighted?: boolean;
}

export function Card({ children, style, onPress, highlighted }: CardProps) {
  const content = (
    <View
      style={[
        styles.card,
        highlighted && styles.highlighted,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  highlighted: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
