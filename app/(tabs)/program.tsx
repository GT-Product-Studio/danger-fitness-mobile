import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../lib/constants/brand";
import { useProfile } from "../../lib/hooks/useProfile";
import { useWorkoutCompletion } from "../../lib/hooks/useWorkout";

// Day-of-week pattern matching the seed script
function getDayInfo(dayNum: number) {
  const dayInWeek = (dayNum - 1) % 7; // 0=Mon..6=Sun
  const weekNum = Math.floor((dayNum - 1) / 7) + 1;
  const dayNames = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const types = ["training", "training", "training", "training", "travel", "race", "recovery"];
  const icons = ["🏋️", "🏋️", "🏋️", "🏋️", "🧘", "🏁", "🔄"];
  const labels = [
    "Ride + Moto + Gym",
    "Ride + Moto + Gym",
    "Ride + Moto + Gym",
    "Ride + Moto + Gym",
    "Travel / Mobility",
    "RACE DAY",
    "Recovery",
  ];

  return {
    weekDay: dayNames[dayInWeek],
    type: types[dayInWeek],
    icon: icons[dayInWeek],
    label: labels[dayInWeek],
    weekNum,
  };
}

const WEEKS = [
  { num: 1, label: "WEEK 1 — FOUNDATION", days: [1, 2, 3, 4, 5, 6, 7] },
  { num: 2, label: "WEEK 2 — BUILD", days: [8, 9, 10, 11, 12, 13, 14] },
  { num: 3, label: "WEEK 3 — INTENSITY", days: [15, 16, 17, 18, 19, 20, 21] },
  { num: 4, label: "WEEK 4 — PEAK & TAPER", days: [22, 23, 24, 25, 26, 27, 28] },
  { num: 5, label: "CHAMPIONSHIP", days: [29, 30] },
];

function getTypeColor(type: string): string {
  switch (type) {
    case "training": return COLORS.primary;
    case "travel": return "#A855F7";
    case "race": return COLORS.danger;
    case "recovery": return COLORS.textMuted;
    default: return COLORS.textSecondary;
  }
}

export default function ProgramScreen() {
  const router = useRouter();
  const { currentDay, loading: profileLoading } = useProfile();
  const { completedDays, loading: completionLoading } = useWorkoutCompletion();

  if (profileLoading || completionLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>THE REGIMENT</Text>
        <Text style={styles.subheader}>
          30 Days • Haiden's Race Week Cycle
        </Text>

        {WEEKS.map((week) => (
          <View key={week.num} style={styles.weekSection}>
            <Text style={styles.weekLabel}>{week.label}</Text>
            {week.days.map((day) => {
              const info = getDayInfo(day);
              const isCompleted = completedDays.includes(day);
              const isCurrent = day === currentDay;
              const isFuture = day > currentDay;
              const typeColor = getTypeColor(info.type);

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCard,
                    isCurrent && styles.dayCardCurrent,
                    isCompleted && styles.dayCardCompleted,
                    info.type === "race" && styles.dayCardRace,
                  ]}
                  onPress={() => router.push(`/workout/${day}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.dayLeft}>
                    <View
                      style={[
                        styles.dayBadge,
                        isCurrent && styles.dayBadgeCurrent,
                        isCompleted && styles.dayBadgeCompleted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayBadgeText,
                          (isCurrent || isCompleted) && styles.dayBadgeTextActive,
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                    <View style={styles.dayMeta}>
                      <View style={styles.dayTopRow}>
                        <Text style={styles.weekDayLabel}>{info.weekDay}</Text>
                        <Text style={[styles.typeTag, { color: typeColor }]}>
                          {info.icon} {info.label}
                        </Text>
                      </View>
                      {isCurrent && (
                        <Text style={styles.currentLabel}>TODAY</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.dayRight}>
                    {isCompleted ? (
                      <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    ) : isFuture ? (
                      <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />
                    ) : (
                      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>WEEKLY CYCLE</Text>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.legendText}>Mon–Thu: Ride + Moto + Gym</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: "#A855F7" }]} />
            <Text style={styles.legendText}>Friday: Travel / Mobility</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Saturday: Race Day</Text>
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.textMuted }]} />
            <Text style={styles.legendText}>Sunday: Recovery</Text>
          </View>
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
  header: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.text,
    letterSpacing: 4,
  },
  subheader: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 24,
  },
  weekSection: {
    marginBottom: 24,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 2,
    marginBottom: 12,
  },
  dayCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayCardCurrent: {
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dayCardCompleted: {
    borderColor: COLORS.primary + "44",
  },
  dayCardRace: {
    borderColor: "rgba(255, 68, 68, 0.2)",
    backgroundColor: "rgba(255, 68, 68, 0.05)",
  },
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  dayBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayBadgeCurrent: {
    backgroundColor: COLORS.primary,
  },
  dayBadgeCompleted: {
    backgroundColor: COLORS.primary + "33",
  },
  dayBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.textSecondary,
  },
  dayBadgeTextActive: {
    color: "#000",
  },
  dayMeta: {
    flex: 1,
  },
  dayTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  weekDayLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
    width: 32,
  },
  typeTag: {
    fontSize: 12,
    fontWeight: "600",
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.primary,
    letterSpacing: 2,
    marginTop: 2,
  },
  dayRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legend: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
});
