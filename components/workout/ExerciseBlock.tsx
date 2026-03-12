import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, BLOCK_CONFIG } from "../../lib/constants/brand";
import { ExerciseCard } from "./ExerciseCard";
import type { Exercise } from "../../lib/hooks/useWorkout";

interface ExerciseBlockProps {
  block: string;
  exercises: Exercise[];
  dayNumber?: number;
}

export function ExerciseBlock({ block, exercises, dayNumber }: ExerciseBlockProps) {
  const config = BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG] || {
    icon: "💪",
    color: "#808080",
    label: block,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.icon}>{config.icon}</Text>
        <Text style={[styles.label, { color: config.color }]}>
          {config.label}
        </Text>
        <View style={[styles.line, { backgroundColor: config.color + "33" }]} />
        <Text style={styles.count}>{exercises.length}</Text>
      </View>
      {exercises.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} dayNumber={dayNumber} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  line: {
    flex: 1,
    height: 1,
  },
  count: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
});
