import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { useWorkout } from "../../lib/hooks/useWorkout";
import { useWorkoutTimer } from "../../lib/hooks/useWorkoutTimer";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useBLE } from "../../lib/ble/BLEProvider";
import { ExerciseBlock } from "../../components/workout/ExerciseBlock";
import { HaidenBenchmark } from "../../components/workout/HaidenBenchmark";
import { DeviceStatus } from "../../components/hr/DeviceStatus";

export default function WorkoutDayScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day || "1", 10);
  const router = useRouter();
  const { user } = useAuth();
  const { workout, exercises, exercisesByBlock, loading } = useWorkout(dayNumber);
  const timer = useWorkoutTimer();
  const { connectionState, connectedDevice, currentHR, startHRStream, stopHRStream } = useBLE();

  const isConnected = connectionState === "connected" || connectionState === "streaming";
  const isStreaming = connectionState === "streaming";
  const [workoutStarted, setWorkoutStarted] = useState(false);

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    timer.start();
    // Auto-start HR if connected
    if (isConnected && !isStreaming) {
      startHRStream().catch(() => {});
    }
  };

  // Also auto-start HR streaming if device connects after workout started
  React.useEffect(() => {
    if (workoutStarted && connectionState === "connected") {
      startHRStream().catch(() => {});
    }
  }, [connectionState, workoutStarted]);

  const handleComplete = () => {
    Alert.alert("Complete Workout", "Mark this workout as done?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: async () => {
          timer.stop();
          stopHRStream();
          if (user && workout) {
            await supabase.from("progress").upsert({
              user_id: user.id,
              day_number: dayNumber,
              completed_at: new Date().toISOString(),
            });
          }
          Alert.alert(
            "🏁 Workout Complete!",
            `Day ${dayNumber} finished${timer.formattedTime ? ` in ${timer.formattedTime}` : ""}`,
            [{ text: "OK", onPress: () => router.back() }]
          );
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const blockOrder = ["cycling", "moto", "gym", "core", "grip", "hiit", "recovery", "race"];
  const sortedBlocks = Object.keys(exercisesByBlock).sort(
    (a, b) => blockOrder.indexOf(a) - blockOrder.indexOf(b)
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.dayLabel}>DAY {dayNumber}</Text>
          <Text style={styles.dayTitle} numberOfLines={1}>
            {workout?.title || "Training Day"}
          </Text>
        </View>

        <DeviceStatus
          connectionState={connectionState}
          deviceName={connectedDevice?.name}
          currentHR={currentHR}
          onPress={() => router.push("/connect-device")}
        />

        <View style={styles.navButtons}>
          {dayNumber > 1 && (
            <TouchableOpacity
              onPress={() => router.replace(`/workout/${dayNumber - 1}`)}
              style={styles.navBtn}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          {dayNumber < 30 && (
            <TouchableOpacity
              onPress={() => router.replace(`/workout/${dayNumber + 1}`)}
              style={styles.navBtn}
            >
              <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* START WORKOUT — top of the page */}
        {!workoutStarted ? (
          <View style={styles.startSection}>
            <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
              <Ionicons name="play" size={22} color="#000" />
              <Text style={styles.startBtnText}>START WORKOUT</Text>
            </TouchableOpacity>

            {!isConnected && (
              <TouchableOpacity
                style={styles.connectPrompt}
                onPress={() => router.push("/connect-device")}
              >
                <Ionicons name="watch-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.connectPromptText}>
                  Connect watch for live HR tracking
                </Text>
                <Ionicons name="chevron-forward" size={14} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* Timer bar when workout is active */
          <View style={styles.activeTimerBar}>
            <Ionicons name="timer-outline" size={18} color={COLORS.primary} />
            <Text style={styles.activeTimerText}>{timer.formattedTime || "0:00"}</Text>
            {isStreaming && currentHR > 0 && (
              <View style={styles.activeHRBadge}>
                <Ionicons name="heart" size={14} color={COLORS.danger} />
                <Text style={styles.activeHRText}>{currentHR}</Text>
              </View>
            )}
          </View>
        )}

        {workout?.description && (
          <Text style={styles.description}>{workout.description}</Text>
        )}

        <Text style={styles.exerciseCount}>
          {exercises.length} exercises across {sortedBlocks.length} block{sortedBlocks.length !== 1 ? "s" : ""}
        </Text>

        {/* Haiden's Benchmark Card */}
        {workout && <HaidenBenchmark workout={workout} />}

        {/* Exercise Blocks */}
        {sortedBlocks.map((block) => (
          <ExerciseBlock
            key={block}
            block={block}
            exercises={exercisesByBlock[block]}
          />
        ))}

        {/* MARK AS COMPLETE — bottom of the page */}
        <TouchableOpacity
          style={[styles.completeBtn, !workoutStarted && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={!workoutStarted}
        >
          <Ionicons name="checkmark-circle" size={22} color={workoutStarted ? "#000" : COLORS.textMuted} />
          <Text style={[styles.completeBtnText, !workoutStarted && styles.completeBtnTextDisabled]}>
            MARK AS COMPLETE
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 2,
  },
  navButtons: {
    flexDirection: "row",
    gap: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },

  // Start Workout section (top)
  startSection: {
    marginBottom: 20,
    gap: 10,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1.5,
  },
  connectPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  connectPromptText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },

  // Active timer bar (replaces start button when workout is running)
  activeTimerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary + "15",
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  activeTimerText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.primary,
    fontVariant: ["tabular-nums"],
    flex: 1,
  },
  activeHRBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.danger + "20",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeHRText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.danger,
    fontVariant: ["tabular-nums"],
  },

  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  exerciseCount: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 20,
  },

  // Mark as Complete (bottom)
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 18,
    marginTop: 24,
  },
  completeBtnDisabled: {
    backgroundColor: COLORS.surface,
  },
  completeBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
  completeBtnTextDisabled: {
    color: COLORS.textMuted,
  },
});
