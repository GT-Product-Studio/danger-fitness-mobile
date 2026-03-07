import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { ZoneBadge } from "../ui/ZoneBadge";
import type { Exercise } from "../../lib/hooks/useWorkout";

interface ExerciseCardProps {
  exercise: Exercise;
  isActive?: boolean;
}

export function ExerciseCard({ exercise, isActive }: ExerciseCardProps) {
  const [done, setDone] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = React.useRef(0);

  const toggleTimer = useCallback(() => {
    if (timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTimerRunning(false);
    } else {
      startRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
      setTimerRunning(true);
    }
  }, [timerRunning, elapsed]);

  const markDone = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTimerRunning(false);
    setDone(true);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const detail = exercise.sets
    ? `${exercise.sets} × ${exercise.reps || "—"}`
    : exercise.duration || "";

  return (
    <View
      style={[
        styles.card,
        isActive && styles.active,
        done && styles.done,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.name, done && styles.nameComplete]}>
            {exercise.name}
          </Text>
          {detail ? (
            <Text style={styles.detail}>{detail}</Text>
          ) : null}
        </View>
        {exercise.hr_zone ? (
          <ZoneBadge zone={exercise.hr_zone} compact />
        ) : null}
        {done && (
          <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
        )}
      </View>

      {exercise.notes ? (
        <Text style={styles.notes}>{exercise.notes}</Text>
      ) : null}

      <View style={styles.controls}>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <View style={styles.buttons}>
          {!done && (
            <TouchableOpacity
              style={[styles.timerBtn, timerRunning && styles.timerBtnActive]}
              onPress={toggleTimer}
            >
              <Ionicons
                name={timerRunning ? "pause" : "play"}
                size={16}
                color={timerRunning ? COLORS.warning : COLORS.primary}
              />
            </TouchableOpacity>
          )}
          {!done && (
            <TouchableOpacity style={styles.doneBtn} onPress={markDone}>
              <Ionicons name="checkmark" size={16} color="#000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  active: {
    borderColor: COLORS.primary,
  },
  done: {
    opacity: 0.6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  nameComplete: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  detail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
    fontStyle: "italic",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  timer: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  timerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  timerBtnActive: {
    backgroundColor: COLORS.warning + "33",
  },
  doneBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
