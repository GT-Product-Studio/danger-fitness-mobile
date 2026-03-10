import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, BRAND, BLOCK_CONFIG } from "../../lib/constants/brand";
import { useProfile } from "../../lib/hooks/useProfile";
import { useWorkout } from "../../lib/hooks/useWorkout";
import { useChallenge } from "../../lib/hooks/useChallenge";
import { useBLE } from "../../lib/ble/BLEProvider";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { DeviceStatus } from "../../components/hr/DeviceStatus";
import { HaidenBenchmark } from "../../components/workout/HaidenBenchmark";

export default function HomeScreen() {
  const router = useRouter();
  const { profile, currentDay, loading: profileLoading } = useProfile();
  const { workout, exercises, loading: workoutLoading } = useWorkout(currentDay);
  const { challenge, userScore, daysRemaining, haidenPct, leaderboard } = useChallenge();
  const { connectionState, connectedDevice, currentHR } = useBLE();

  if (profileLoading || workoutLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const blocks = exercises.reduce<Record<string, number>>((acc, ex) => {
    acc[ex.block] = (acc[ex.block] || 0) + 1;
    return acc;
  }, {});

  const userRank = leaderboard.find((e) => e.user_id === profile?.id)?.rank;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>
              {profile?.full_name ? `Hey, ${profile.full_name.split(" ")[0]}` : "Welcome"}
            </Text>
            <Text style={styles.tagline}>{BRAND.tagline}</Text>
          </View>
          <DeviceStatus
            connectionState={connectionState}
            deviceName={connectedDevice?.name}
            currentHR={currentHR}
            onPress={() => router.push("/connect-device")}
          />
        </View>

        {/* Day Progress */}
        <Card style={styles.dayCard}>
          <View style={styles.dayRow}>
            <View style={styles.dayCircle}>
              <Text style={styles.dayNumber}>{currentDay}</Text>
              <Text style={styles.dayLabel}>DAY</Text>
            </View>
            <View style={styles.dayInfo}>
              <Text style={styles.dayTitle}>Day {currentDay} of 30</Text>
              <ProgressBar progress={currentDay / 30} height={6} />
              <Text style={styles.daySubtitle}>
                {workout?.week_day ? `${workout.week_day} — ` : ""}{workout?.day_type === "race" ? "🏁 Race Day" : workout?.day_type === "recovery" ? "🔄 Recovery" : workout?.day_type === "travel" ? "🧘 Travel / Mobility" : "🏋️ Training Day"}
              </Text>
            </View>
          </View>
        </Card>

        {/* Today's Workout */}
        <Card
          style={styles.workoutCard}
          highlighted
          onPress={() => router.push(`/workout/${currentDay}`)}
        >
          <Text style={styles.sectionLabel}>TODAY'S WORKOUT</Text>
          <Text style={styles.workoutTitle}>{workout?.title || "Rest Day"}</Text>

          <View style={styles.blockRow}>
            {Object.entries(blocks).map(([block, count]) => {
              const config = BLOCK_CONFIG[block as keyof typeof BLOCK_CONFIG];
              return config ? (
                <View key={block} style={styles.blockChip}>
                  <Text style={styles.blockIcon}>{config.icon}</Text>
                  <Text style={[styles.blockText, { color: config.color }]}>
                    {count}
                  </Text>
                </View>
              ) : null;
            })}
          </View>

          <Button
            title="START WORKOUT"
            onPress={() => router.push(`/workout/${currentDay}`)}
            size="large"
            style={styles.startBtn}
          />
        </Card>

        {/* Haiden's Benchmark — compact view */}
        {workout && <HaidenBenchmark workout={workout} compact />}

        {/* Challenge Card */}
        {challenge && (
          <Card
            style={styles.challengeCard}
            onPress={() => router.push("/(tabs)/challenge")}
          >
            <View style={styles.challengeHeader}>
              <Text style={styles.sectionLabel}>
                <Ionicons name="trophy" size={14} color={COLORS.warning} /> DANGER CHALLENGE
              </Text>
              <Text style={styles.daysLeft}>{daysRemaining}d left</Text>
            </View>

            <View style={styles.scoreRow}>
              <Text style={styles.scoreValue}>
                {userScore?.total_score || 0}
              </Text>
              <Text style={styles.scoreLabel}>
                / {BRAND.scoring.haidenBenchmark} pts
              </Text>
            </View>
            <ProgressBar progress={haidenPct} height={6} color={COLORS.warning} />

            {userRank && (
              <Text style={styles.rankText}>
                #{userRank} on leaderboard
              </Text>
            )}
          </Card>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Ionicons name="fitness" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{currentDay - 1}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
            <Text style={styles.statValue}>{30 - currentDay + 1}</Text>
            <Text style={styles.statLabel}>Remaining</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="heart" size={20} color={COLORS.danger} />
            <Text style={styles.statValue}>
              {connectionState === "streaming" && currentHR > 0 ? currentHR : "--"}
            </Text>
            <Text style={styles.statLabel}>{connectionState === "streaming" ? "Live HR" : "Avg HR"}</Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.text,
  },
  tagline: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    letterSpacing: 2,
    marginTop: 2,
  },
  dayCard: {
    marginBottom: 16,
  },
  dayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  dayCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
  },
  dayInfo: {
    flex: 1,
    gap: 6,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  daySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: "capitalize",
  },
  workoutCard: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 8,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  blockRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  blockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  blockIcon: {
    fontSize: 16,
  },
  blockText: {
    fontSize: 13,
    fontWeight: "600",
  },
  startBtn: {
    width: "100%",
  },
  challengeCard: {
    marginBottom: 16,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  daysLeft: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.warning,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
    gap: 4,
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
  },
  scoreLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  rankText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: "600",
  },
});
