import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { Workout } from "../../lib/hooks/useWorkout";

interface HaidenBenchmarkProps {
  workout: Workout;
  compact?: boolean;
}

interface StatRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  haidenValue: string;
  iconColor?: string;
}

function StatRow({ icon, label, haidenValue, iconColor = COLORS.primary }: StatRowProps) {
  return (
    <View style={styles.statRow}>
      <View style={styles.statLeft}>
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <View style={styles.statRight}>
        <Text style={styles.haidenValue}>{haidenValue}</Text>
      </View>
    </View>
  );
}

export function HaidenBenchmark({ workout, compact }: HaidenBenchmarkProps) {
  const { haiden_distance_mi, haiden_duration_min, haiden_avg_hr, haiden_max_hr, haiden_calories } = workout;

  // Don't show if no benchmarks
  if (!haiden_avg_hr && !haiden_calories) return null;

  const formatDuration = (min: number) => {
    if (min >= 60) {
      const hrs = Math.floor(min / 60);
      const mins = min % 60;
      return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    }
    return `${min}m`;
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactIcon}>🏍️</Text>
          <Text style={styles.compactTitle}>HAIDEN'S BENCHMARK</Text>
        </View>
        <View style={styles.compactStats}>
          {haiden_avg_hr ? (
            <View style={styles.compactStat}>
              <Text style={styles.compactValue}>{haiden_avg_hr}</Text>
              <Text style={styles.compactLabel}>AVG HR</Text>
            </View>
          ) : null}
          {haiden_calories ? (
            <View style={styles.compactStat}>
              <Text style={styles.compactValue}>{haiden_calories.toLocaleString()}</Text>
              <Text style={styles.compactLabel}>CAL</Text>
            </View>
          ) : null}
          {haiden_duration_min ? (
            <View style={styles.compactStat}>
              <Text style={styles.compactValue}>{formatDuration(haiden_duration_min)}</Text>
              <Text style={styles.compactLabel}>TIME</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>⚡</Text>
          <View>
            <Text style={styles.headerTitle}>HAIDEN'S NUMBERS</Text>
            <Text style={styles.headerSub}>Can you keep up?</Text>
          </View>
        </View>
        <View style={styles.maxHRBadge}>
          <Text style={styles.maxHRValue}>{haiden_max_hr || 210}</Text>
          <Text style={styles.maxHRLabel}>MAX HR</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Stats */}
      <View style={styles.stats}>
        {haiden_distance_mi && haiden_distance_mi > 0 ? (
          <StatRow
            icon="bicycle"
            label="Distance"
            haidenValue={`${haiden_distance_mi} mi`}
            iconColor={COLORS.primary}
          />
        ) : null}
        {haiden_duration_min ? (
          <StatRow
            icon="time"
            label="Total Time"
            haidenValue={formatDuration(haiden_duration_min)}
            iconColor={COLORS.warning}
          />
        ) : null}
        {haiden_avg_hr ? (
          <StatRow
            icon="heart"
            label="Avg Heart Rate"
            haidenValue={`${haiden_avg_hr} bpm`}
            iconColor={COLORS.danger}
          />
        ) : null}
        {haiden_calories ? (
          <StatRow
            icon="flame"
            label="Calories Burned"
            haidenValue={`${haiden_calories.toLocaleString()} cal`}
            iconColor={COLORS.orange}
          />
        ) : null}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="trophy" size={14} color={COLORS.warning} />
        <Text style={styles.footerText}>
          Match Haiden's numbers to earn bonus challenge points
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
    overflow: "hidden",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  maxHRBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 68, 68, 0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.3)",
  },
  maxHRValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.danger,
  },
  maxHRLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: COLORS.danger,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  stats: {
    padding: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  statRight: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  haidenValue: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(41, 240, 0, 0.05)",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: "500",
    flex: 1,
  },
  // Compact styles (for home screen)
  compactContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryMuted,
    padding: 14,
    marginBottom: 12,
  },
  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  compactIcon: {
    fontSize: 14,
  },
  compactTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.primary,
    letterSpacing: 2,
  },
  compactStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  compactStat: {
    alignItems: "center",
    gap: 2,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: "900",
    color: COLORS.text,
  },
  compactLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
});
