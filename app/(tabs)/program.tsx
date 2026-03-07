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
import { COLORS, BLOCK_CONFIG } from "../../lib/constants/brand";
import { useProfile } from "../../lib/hooks/useProfile";
import { useWorkoutCompletion } from "../../lib/hooks/useWorkout";
import { Card } from "../../components/ui/Card";

const WEEKS = [
  { label: "WEEK 1-2: FOUNDATION", days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { label: "WEEK 3: BUILD", days: [15, 16, 17, 18, 19, 20, 21] },
  { label: "WEEK 4: INTENSITY", days: [22, 23, 24, 25, 26, 27, 28] },
  { label: "DAYS 29-30: PEAK & TAPER", days: [29, 30] },
];

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
        <Text style={styles.subheader}>30-Day Training Program</Text>

        {WEEKS.map((week) => (
          <View key={week.label} style={styles.weekSection}>
            <Text style={styles.weekLabel}>{week.label}</Text>
            {week.days.map((day) => {
              const isCompleted = completedDays.includes(day);
              const isCurrent = day === currentDay;
              const isFuture = day > currentDay;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayCard,
                    isCurrent && styles.dayCardCurrent,
                    isCompleted && styles.dayCardCompleted,
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
                    <View>
                      <Text style={[styles.dayTitle, isFuture && styles.futureText]}>
                        Day {day}
                      </Text>
                      {isCurrent && (
                        <Text style={styles.currentLabel}>TODAY</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.dayRight}>
                    {isCompleted ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color={COLORS.primary}
                      />
                    ) : isFuture ? (
                      <Ionicons name="lock-closed" size={18} color={COLORS.textMuted} />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORS.textMuted}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
  dayLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  dayTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  futureText: {
    color: COLORS.textMuted,
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
});
