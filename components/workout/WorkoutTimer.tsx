import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";

interface WorkoutTimerProps {
  elapsed: number;
  isRunning: boolean;
  formattedTime: string;
  onStart: () => void;
  onStop: () => void;
  onFinish: () => void;
}

export function WorkoutTimer({
  isRunning,
  formattedTime,
  onStart,
  onStop,
  onFinish,
}: WorkoutTimerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <Text style={styles.time}>{formattedTime}</Text>
        {isRunning ? (
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.pauseBtn} onPress={onStop}>
              <Ionicons name="pause" size={20} color={COLORS.warning} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={onFinish}>
              <Text style={styles.finishText}>FINISH</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.startBtn} onPress={onStart}>
            <Ionicons name="play" size={18} color="#000" />
            <Text style={styles.startText}>START WORKOUT</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  time: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  pauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.warning + "22",
    alignItems: "center",
    justifyContent: "center",
  },
  finishBtn: {
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  finishText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    gap: 8,
  },
  startText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
});
