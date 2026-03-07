import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, BRAND } from "../../lib/constants/brand";
import { useAuth } from "../../lib/auth";
import { useProfile } from "../../lib/hooks/useProfile";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";

function SettingsRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <Card onPress={onPress} style={styles.row}>
      <View style={styles.rowContent}>
        <View style={styles.rowLeft}>
          <Ionicons name={icon} size={20} color={COLORS.primary} />
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <View style={styles.rowRight}>
          {value && <Text style={styles.rowValue}>{value}</Text>}
          {onPress && (
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          )}
        </View>
      </View>
    </Card>
  );
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.header}>Settings</Text>

        {/* Profile */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(profile?.full_name || "?")[0].toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.profileName}>
                {profile?.full_name || "User"}
              </Text>
              <Text style={styles.profileEmail}>{user?.email || ""}</Text>
            </View>
          </View>
        </Card>

        {/* Heart Rate Monitor */}
        <Text style={styles.sectionLabel}>HEART RATE MONITOR</Text>
        <SettingsRow
          icon="bluetooth"
          label="Connect Device"
          value="Not Connected"
          onPress={() =>
            Alert.alert("Coming Soon", "BLE device pairing will be available in Phase 2.")
          }
        />
        <SettingsRow
          icon="heart"
          label="Max Heart Rate"
          value={`${profile?.max_hr || 190} BPM`}
          onPress={() =>
            Alert.alert("Max HR", "Max heart rate customization coming in Phase 2.")
          }
        />

        {/* Subscription */}
        <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
        <SettingsRow
          icon="card"
          label="Manage Subscription"
          value={`${BRAND.subscription.price}/${BRAND.subscription.period}`}
          onPress={() =>
            Alert.alert(
              "Subscription",
              "Subscription management via RevenueCat coming in Phase 4."
            )
          }
        />

        {/* App */}
        <Text style={styles.sectionLabel}>APP</Text>
        <SettingsRow
          icon="notifications"
          label="Notifications"
          onPress={() =>
            Alert.alert("Coming Soon", "Push notifications coming in Phase 4.")
          }
        />
        <SettingsRow icon="information-circle" label="Version" value="1.0.0" />

        {/* Sign Out */}
        <Button
          title="SIGN OUT"
          onPress={handleSignOut}
          variant="danger"
          size="large"
          style={styles.signOutBtn}
        />
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
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textMuted,
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 10,
  },
  profileCard: {
    marginBottom: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#000",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  row: {
    marginBottom: 4,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowLabel: {
    fontSize: 15,
    color: COLORS.text,
  },
  rowValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  signOutBtn: {
    marginTop: 32,
  },
});
