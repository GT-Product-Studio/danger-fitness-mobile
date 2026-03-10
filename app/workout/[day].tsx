import React from "react";
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
import { WorkoutTimer } from "../../components/workout/WorkoutTimer";
import { DeviceStatus } from "../../components/hr/DeviceStatus";

export default function WorkoutDayScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const dayNumber = parseInt(day || "1", 10);
  const router = useRouter();
  const { user } = useAuth();
  const { workout, exercises, exercisesByBlock, loading } = useWorkout(dayNumber);
  const timer = useWorkoutTimer();
  const { connectionState, connectedDevice, currentHR } = useBLE();

  const isConnected = connectionState === "connected" || connectionState === "streaming";

  const handleStartLive = () => {
    if (!isConnected) {
      Alert.alert(
        "No HR Monitor",
        "Connect a heart rate monitor for live HR tracking, or start without it.",
        [
          { text: "Connect", onPress: () => router.push("/connect-device") },
          {
            text: "Start Without",
            onPress: () => navigateToLive(),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } else {
      navigateToLive();
    }
  };

  const navigateToLive = async () => {
    // Create a workout session
    let sessionId: string | undefined;
    if (user) {
      const { data } = await supabase
        .from("workout_sessions")
        .insert({
          user_id: user.id,
          day_number: dayNumber,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      sessionId = data?.id;
    }

    router.push({
      pathname: "/workout/live",
      params: {
        exercises: JSON.stringify(
          exercises.map((e) => ({
            id: e.id,
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            duration: e.duration,
            block: e.block,
          }))
        ),
        dayNumber: String(dayNumber),
        sessionId: sessionId || "",
        workoutTitle: workout?.title || `Day ${dayNumber}`,
      },
    });
  };

  const handleFinish = () => {
    Alert.alert("Finish Workout", "Mark this workout as complete?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: async () => {
          timer.stop();
          if (user && workout) {
            await supabase.from("progress").upsert({
              user_id: user.id,
              day_number: dayNumber,
              completed_at: new Date().toISOString(),
            });
          }
          Alert.alert("Workout Complete!", `Day ${dayNumber} finished in ${timer.formattedTime}`, [
            { text: "OK", onPress: () => router.back() },
          ]);
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

      {/* Exercise List */}
      <ScrollView contentContainerStyle={styles.scroll}>
        {workout?.description && (
          <Text style={styles.description}>{workout.description}</Text>
        )}

        <Text style={styles.exerciseCount}>
          {exercises.length} exercises across {sortedBlocks.length} block{sortedBlocks.length !== 1 ? "s" : ""}
        </Text>

        {/* Haiden's Benchmark Card */}
        {workout && <HaidenBenchmark workout={workout} />}

        {sortedBlocks.map((block) => (
          <ExerciseBlock
            key={block}
            block={block}
            exercises={exercisesByBlock[block]}
          />
        ))}

        {/* Start Live Workout */}
        <TouchableOpacity style={styles.startLiveBtn} onPress={handleStartLive}>
          <Ionicons name="heart" size={20} color="#000" />
          <Text style={styles.startLiveText}>
            {isConnected ? "START WORKOUT" : "START WORKOUT — Connect Watch"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Timer Bar */}
      <WorkoutTimer
        elapsed={timer.elapsed}
        isRunning={timer.isRunning}
        formattedTime={timer.formattedTime}
        onStart={timer.start}
        onStop={timer.stop}
        onFinish={handleFinish}
      />
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
    paddingBottom: 16,
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
  startLiveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 18,
    marginTop: 20,
  },
  startLiveText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#000",
    letterSpacing: 1,
  },
});
