import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, BRAND, BLOCK_CONFIG } from "../../lib/constants/brand";
import { useChallenge } from "../../lib/hooks/useChallenge";
import { useAuth } from "../../lib/auth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";

const ACTIVITY_TYPES = [
  { key: "cycling", label: "Cycling Miles", icon: "🚴", unit: "mi", multiplier: BRAND.scoring.cyclingMultiplier },
  { key: "moto", label: "Moto Hours", icon: "🏍️", unit: "hr", multiplier: BRAND.scoring.motoMultiplier },
  { key: "gym", label: "Gym Hours", icon: "🏋️", unit: "hr", multiplier: BRAND.scoring.gymMultiplier },
];

export default function ChallengeScreen() {
  const { user } = useAuth();
  const {
    challenge,
    leaderboard,
    userScore,
    daysRemaining,
    haidenPct,
    loading,
    logActivity,
    refetch,
  } = useChallenge();

  const [selectedType, setSelectedType] = useState("cycling");
  const [value, setValue] = useState("");
  const [logging, setLogging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLog = async () => {
    const numVal = parseFloat(value);
    if (!numVal || numVal <= 0) return;
    setLogging(true);
    await logActivity(selectedType, numVal);
    setLogging(false);
    setValue("");
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  if (!challenge) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="trophy-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No active challenge</Text>
          <Text style={styles.emptySubtext}>Check back at the start of the month!</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Challenge Header */}
        <View style={styles.header}>
          <Text style={styles.monthLabel}>
            {challenge.month?.toUpperCase() || "MONTHLY"}
          </Text>
          <Text style={styles.title}>DANGER CHALLENGE</Text>
          <Text style={styles.daysLeft}>{daysRemaining} days remaining</Text>
        </View>

        {/* Your Progress */}
        <Card style={styles.progressCard}>
          <Text style={styles.sectionLabel}>YOUR PROGRESS</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>
              {userScore?.total_score || 0}
            </Text>
            <Text style={styles.scoreSuffix}>pts</Text>
          </View>

          <View style={styles.benchmarkRow}>
            <Text style={styles.benchmarkLabel}>vs Haiden's {BRAND.scoring.haidenBenchmark}</Text>
            <Text style={styles.benchmarkPct}>{Math.round(haidenPct * 100)}%</Text>
          </View>
          <ProgressBar progress={haidenPct} height={8} color={COLORS.warning} />

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownIcon}>🚴</Text>
              <Text style={styles.breakdownValue}>
                {userScore?.cycling_miles || 0}
              </Text>
              <Text style={styles.breakdownLabel}>miles</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownIcon}>🏍️</Text>
              <Text style={styles.breakdownValue}>
                {userScore?.moto_hours || 0}
              </Text>
              <Text style={styles.breakdownLabel}>moto hrs</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownIcon}>🏋️</Text>
              <Text style={styles.breakdownValue}>
                {userScore?.gym_hours || 0}
              </Text>
              <Text style={styles.breakdownLabel}>gym hrs</Text>
            </View>
          </View>
        </Card>

        {/* Activity Logger */}
        <Card style={styles.logCard}>
          <Text style={styles.sectionLabel}>LOG ACTIVITY</Text>

          <View style={styles.typeRow}>
            {ACTIVITY_TYPES.map((type) => (
              <Button
                key={type.key}
                title={`${type.icon} ${type.unit}`}
                onPress={() => setSelectedType(type.key)}
                variant={selectedType === type.key ? "primary" : "secondary"}
                size="small"
                style={styles.typeBtn}
              />
            ))}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={`Enter ${ACTIVITY_TYPES.find((t) => t.key === selectedType)?.unit || "value"}`}
              placeholderTextColor={COLORS.textMuted}
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
            />
            <Button
              title="LOG"
              onPress={handleLog}
              loading={logging}
              size="medium"
              style={styles.logBtn}
            />
          </View>
        </Card>

        {/* Leaderboard */}
        <Card style={styles.leaderboardCard}>
          <Text style={styles.sectionLabel}>LEADERBOARD</Text>

          {leaderboard.map((entry) => {
            const isUser = entry.user_id === user?.id;
            return (
              <View
                key={entry.user_id}
                style={[styles.lbRow, isUser && styles.lbRowUser]}
              >
                <View style={styles.lbLeft}>
                  <Text
                    style={[
                      styles.lbRank,
                      entry.rank === 1 && styles.lbRankGold,
                      entry.rank === 2 && styles.lbRankSilver,
                      entry.rank === 3 && styles.lbRankBronze,
                    ]}
                  >
                    #{entry.rank}
                  </Text>
                  <View style={styles.lbAvatar}>
                    <Text style={styles.lbAvatarText}>
                      {(entry.full_name || "?")[0].toUpperCase()}
                    </Text>
                  </View>
                  <Text
                    style={[styles.lbName, isUser && styles.lbNameUser]}
                    numberOfLines={1}
                  >
                    {entry.full_name || "Anonymous"}
                    {isUser ? " (you)" : ""}
                  </Text>
                </View>
                <Text style={[styles.lbScore, isUser && styles.lbScoreUser]}>
                  {entry.total_score}
                </Text>
              </View>
            );
          })}

          {leaderboard.length === 0 && (
            <Text style={styles.emptySubtext}>No entries yet. Be the first!</Text>
          )}
        </Card>
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  monthLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.warning,
    letterSpacing: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 2,
    marginTop: 4,
  },
  daysLeft: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  progressCard: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.text,
  },
  scoreSuffix: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  benchmarkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  benchmarkLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  benchmarkPct: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.warning,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownItem: {
    alignItems: "center",
    gap: 4,
  },
  breakdownIcon: {
    fontSize: 20,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },
  breakdownLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  logCard: {
    marginBottom: 16,
  },
  typeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 48,
  },
  logBtn: {
    width: 80,
  },
  leaderboardCard: {
    marginBottom: 16,
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lbRowUser: {
    backgroundColor: COLORS.primaryGlow,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  lbLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  lbRank: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
    width: 32,
  },
  lbRankGold: {
    color: COLORS.warning,
  },
  lbRankSilver: {
    color: "#C0C0C0",
  },
  lbRankBronze: {
    color: "#CD7F32",
  },
  lbAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  lbAvatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  lbName: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  lbNameUser: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  lbScore: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  lbScoreUser: {
    color: COLORS.primary,
  },
});
