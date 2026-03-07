import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { COLORS } from "../../lib/constants/brand";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? COLORS.primary : "#000"}
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`text_${size}`],
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  danger: {
    backgroundColor: COLORS.danger,
  },
  size_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  size_medium: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    minHeight: 48,
  },
  size_large: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "700",
    letterSpacing: 1,
  },
  text_primary: {
    color: "#000",
  },
  text_secondary: {
    color: COLORS.text,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text_danger: {
    color: "#FFF",
  },
  text_small: {
    fontSize: 13,
  },
  text_medium: {
    fontSize: 16,
  },
  text_large: {
    fontSize: 18,
    letterSpacing: 2,
  },
});
