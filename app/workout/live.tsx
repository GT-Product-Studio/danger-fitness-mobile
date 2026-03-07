import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { useAuth } from "../../lib/auth";
import { supabase } from "../../lib/supabase";
import { useBLE } from "../../lib/ble/BLEProvider";
import { getZoneColor, getZoneLabel, getTimeInZones, HRSample } from "../../lib/ble/hr-zones";
import { HeartRateDisplay } from "../../components/hr/HeartRateDisplay";
import { LiveHRGraph } from "../../components/hr/LiveHRGraph";
import { HRZoneBar } from "../../components/hr/HRZoneBar";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

const SCREEN_WIDTH = Dimensions.get("window").width;

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: string;
  duration?: string;
  block: string;
}

export default function LiveWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    exercises?: string;
    dayNumber?: string;
    sessionId?: string;
    workoutTitle?: string;
  }>();
  const { user } = useAuth();
  const {
    connectionState,
    currentHR,
    currentZone,
    hrHistory,
    allSamples,
    maxHR,
    startHRStream,
    stopHRStream,
    clearSamples,
    connectedDevice,
  } = useBLE();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [exerciseStartTimes, setExerciseStartTimes] = useState<Record<number, number>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  // Parse exercises from params
  useEffect(() => {
    if (params.exercises) {
      try {
        setExercises(JSON.parse(params.exercises));
      } catch {
        setExercises([]);
      }
    }
  }, [params.exercises]);

  // Start HR stream and timer
  useEffect(() => {
    clearSamples();

    if (connectionState === "connected" || connectionState === "streaming") {
      startHRStream().catch(console.warn);
    }

    startTimeRef.current = Date.now();
    setExerciseStartTimes({ 0: Date.now() });

    timerRef.current = setInterval(() => {
      if (!isPaused) {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopHRStream();
    };
  }, []);

  // Handle pause
  useEffect(() => {
    if (isPaused && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    } else if (!isPaused && !timerRef.current && !isFinished) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
  }, [isPaused, isFinished]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentExercise = exercises[currentExerciseIndex];

  const goToExercise = useCallback((index: number) => {
    if (index >= 0 && index < exercises.length) {
      setCurrentExerciseIndex(index);
      setExerciseStartTimes((prev) => ({ ...prev, [index]: Date.now() }));
    }
  }, [exercises.length]);

  const handleFinish = useCallback(() => {
    Alert.alert("Finish Workout", "End this workout and see your summary?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: async () => {
          setIsFinished(true);
          if (timerRef.current) clearInterval(timerRef.current);
          stopHRStream();

          // Batch insert HR samples to Supabase
          if (user && allSamples.length > 0 && params.sessionId) {
            const batchSize = 100;
            for (let i = 0; i < allSamples.length; i += batchSize) {
              const batch = allSamples.slice(i, i + batchSize).map((s) => ({
                user_id: user.id,
                session_id: params.sessionId,
                exercise_id: currentExercise?.id || null,
                timestamp: new Date(s.timestamp).toISOString(),
                heart_rate: s.hr,
                hr_zone: s.zone,
                device_name: connectedDevice?.name,
                device_id: connectedDevice?.id,
              }));

              await supabase.from("ble_hr_samples").insert(batch);
            }

            // Compute per-exercise HR summaries
            const exerciseSamples: Record<number, HRSample[]> = {};
            let exIdx = 0;
            for (const sample of allSamples) {
              const nextStart = exerciseStartTimes[exIdx + 1];
              if (nextStart && sample.timestamp >= nextStart) {
                exIdx++;
              }
              if (!exerciseSamples[exIdx]) exerciseSamples[exIdx] = [];
              exerciseSamples[exIdx].push(sample);
            }

            for (const [idx, samples] of Object.entries(exerciseSamples)) {
              const ex = exercises[parseInt(idx)];
              if (!ex || samples.length === 0) continue;

              const hrs = samples.map((s) => s.hr);
              const zoneTime = getTimeInZones(samples);
              const duration = samples.length > 1
                ? Math.round((samples[samples.length - 1].timestamp - samples[0].timestamp) / 1000)
                : 0;

              await supabase.from("exercise_hr_summary").upsert({
                user_id: user.id,
                session_id: params.sessionId,
                exercise_id: ex.id,
                hr_avg: Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length),
                hr_max: Math.max(...hrs),
                hr_min: Math.min(...hrs),
                hr_zone_minutes: {
                  z1: Math.round(zoneTime.z1 / 6) / 10,
                  z2: Math.round(zoneTime.z2 / 6) / 10,
                  z3: Math.round(zoneTime.z3 / 6) / 10,
                  z4: Math.round(zoneTime.z4 / 6) / 10,
                  z5: Math.round(zoneTime.z5 / 6) / 10,
                },
                duration_seconds: duration,
              });
            }
          }

          // Mark progress
          if (user && params.dayNumber) {
            await supabase.from("progress").upsert({
              user_id: user.id,
              day_number: parseInt(params.dayNumber, 10),
              completed_at: new Date().toISOString(),
            });
          }
        },
      },
    ]);
  }, [user, allSamples, exercises, exerciseStartTimes, params, connectedDevice]);

  // Post-workout summary
  if (isFinished) {
    const hrs = allSamples.map((s) => s.hr).filter((h) => h > 0);
    const avgHR = hrs.length > 0 ? Math.round(hrs.reduce((a, b) => a + b, 0) / hrs.length) : 0;
    const maxHRVal = hrs.length > 0 ? Math.max(...hrs) : 0;
    const zoneTime = getTimeInZones(allSamples);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.summaryScroll}>
          <Text style={styles.summaryTitle}>Workout Complete!</Text>
          <Text style={styles.summarySubtitle}>
            {params.workoutTitle || `Day ${params.dayNumber}`}
          </Text>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{formatTime(elapsed)}</Text>
              <Text style={styles.summaryStatLabel}>Duration</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{avgHR || "--"}</Text>
              <Text style={styles.summaryStatLabel}>Avg HR</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{maxHRVal || "--"}</Text>
              <Text style={styles.summaryStatLabel}>Max HR</Text>
            </View>
          </View>

          {hrs.length > 0 && (
            <Card style={styles.zoneCard}>
              <Text style={styles.zoneCardTitle}>Zone Breakdown</Text>
              <HRZoneBar zoneTime={zoneTime} height={32} />
            </Card>
          )}

          <Button
            title="DONE"
            onPress={() => router.back()}
            size="large"
            style={styles.doneBtn}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const zoneColor = getZoneColor(currentZone);
  const isStreaming = connectionState === "streaming";
  const isConnected = connectionState === "connected" || isStreaming;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeft}>
          <Text style={styles.elapsedTime}>{formatTime(elapsed)}</Text>
          <Text style={styles.elapsedLabel}>ELAPSED</Text>
        </View>
        <View style={styles.topRight}>
          <Text style={styles.exerciseCount}>
            {exercises.length > 0
              ? `${currentExerciseIndex + 1} of ${exercises.length}`
              : ""}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.liveScroll}>
        {/* Heart Rate Display */}
        <HeartRateDisplay
          hr={currentHR}
          zone={currentZone}
          connected={isConnected}
          streaming={isStreaming}
          onConnectPress={() => router.push("/connect-device")}
        />

        {/* Live HR Graph */}
        {isStreaming && hrHistory.length > 1 && (
          <View style={styles.graphContainer}>
            <LiveHRGraph
              samples={hrHistory}
              maxHR={maxHR}
              width={SCREEN_WIDTH - 40}
              height={140}
            />
          </View>
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <Card style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{currentExercise.name}</Text>
            <Text style={styles.exerciseDetail}>
              {currentExercise.sets && currentExercise.reps
                ? `${currentExercise.sets} x ${currentExercise.reps}`
                : currentExercise.duration || ""}
            </Text>
          </Card>
        )}

        {/* Exercise Navigation */}
        {exercises.length > 0 && (
          <View style={styles.exerciseNav}>
            <TouchableOpacity
              style={[styles.exNavBtn, currentExerciseIndex === 0 && styles.exNavDisabled]}
              onPress={() => goToExercise(currentExerciseIndex - 1)}
              disabled={currentExerciseIndex === 0}
            >
              <Ionicons name="chevron-back" size={20} color={COLORS.text} />
              <Text style={styles.exNavText}>PREV</Text>
            </TouchableOpacity>

            {/* Progress dots */}
            <View style={styles.dotRow}>
              {exercises.slice(
                Math.max(0, currentExerciseIndex - 3),
                Math.min(exercises.length, currentExerciseIndex + 4)
              ).map((_, i) => {
                const actualIdx = Math.max(0, currentExerciseIndex - 3) + i;
                return (
                  <View
                    key={actualIdx}
                    style={[
                      styles.progressDot,
                      actualIdx === currentExerciseIndex && styles.progressDotActive,
                      actualIdx < currentExerciseIndex && styles.progressDotDone,
                    ]}
                  />
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.exNavBtn, currentExerciseIndex >= exercises.length - 1 && styles.exNavDisabled]}
              onPress={() => goToExercise(currentExerciseIndex + 1)}
              disabled={currentExerciseIndex >= exercises.length - 1}
            >
              <Text style={styles.exNavText}>NEXT</Text>
              <Ionicons name="chevron-forward" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.pauseBtn}
          onPress={() => setIsPaused(!isPaused)}
        >
          <Ionicons
            name={isPaused ? "play" : "pause"}
            size={24}
            color={COLORS.text}
          />
          <Text style={styles.pauseText}>{isPaused ? "RESUME" : "PAUSE"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.finishBtn}
          onPress={handleFinish}
        >
          <Text style={styles.finishText}>FINISH WORKOUT</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topLeft: {
    alignItems: "flex-start",
  },
  topRight: {
    alignItems: "flex-end",
  },
  elapsedTime: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  elapsedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  exerciseCount: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  liveScroll: {
    padding: 20,
    paddingBottom: 16,
    gap: 16,
  },
  graphContainer: {
    alignItems: "center",
  },
  exerciseCard: {
    alignItems: "center",
    paddingVertical: 20,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  exerciseDetail: {
    fontSize: 15,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  exerciseNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exNavDisabled: {
    opacity: 0.3,
  },
  exNavText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 1,
  },
  dotRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotDone: {
    backgroundColor: COLORS.textMuted,
  },
  bottomBar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  pauseBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: 1,
  },
  finishBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: COLORS.danger,
    borderRadius: 12,
  },
  finishText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: 1,
  },
  // Summary styles
  summaryScroll: {
    padding: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.primary,
    marginTop: 40,
    marginBottom: 8,
  },
  summarySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  summaryStatsRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  summaryStat: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryStatValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    fontVariant: ["tabular-nums"],
  },
  summaryStatLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.textMuted,
    letterSpacing: 1,
    marginTop: 4,
  },
  zoneCard: {
    width: "100%",
    marginBottom: 24,
  },
  zoneCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  doneBtn: {
    width: "100%",
  },
});
