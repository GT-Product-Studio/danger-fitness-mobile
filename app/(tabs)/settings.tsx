import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, BRAND } from "../../lib/constants/brand";
import { useAuth } from "../../lib/auth";
import { useProfile } from "../../lib/hooks/useProfile";
import { useBLE } from "../../lib/ble/BLEProvider";
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
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { connectionState, connectedDevice, maxHR, setMaxHR, disconnect } = useBLE();
  const [editingMaxHR, setEditingMaxHR] = useState(false);
  const [maxHRInput, setMaxHRInput] = useState(String(maxHR));

  const isConnected = connectionState === "connected" || connectionState === "streaming";

  const handleSaveMaxHR = () => {
    const val = parseInt(maxHRInput, 10);
    if (val >= 100 && val <= 250) {
      setMaxHR(val);
      setEditingMaxHR(false);
    } else {
      Alert.alert("Invalid", "Max HR must be between 100 and 250 BPM.");
    }
  };

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
          label={isConnected ? connectedDevice?.name || "Connected" : "Connect Device"}
          value={isConnected ? "Connected" : "Not Connected"}
          onPress={() => router.push("/connect-device")}
        />
        {isConnected && (
          <SettingsRow
            icon="close-circle"
            label="Disconnect Device"
            onPress={() => {
              Alert.alert("Disconnect", "Disconnect from heart rate monitor?", [
                { text: "Cancel", style: "cancel" },
                { text: "Disconnect", style: "destructive", onPress: disconnect },
              ]);
            }}
          />
        )}
        {editingMaxHR ? (
          <Card style={styles.row}>
            <View style={styles.rowContent}>
              <View style={styles.rowLeft}>
                <Ionicons name="heart" size={20} color={COLORS.primary} />
                <Text style={styles.rowLabel}>Max HR</Text>
              </View>
              <View style={styles.maxHREdit}>
                <TextInput
                  style={styles.maxHRInput}
                  value={maxHRInput}
                  onChangeText={setMaxHRInput}
                  keyboardType="number-pad"
                  maxLength={3}
                  autoFocus
                />
                <Button title="Save" onPress={handleSaveMaxHR} size="small" />
              </View>
            </View>
          </Card>
        ) : (
          <SettingsRow
            icon="heart"
            label="Max Heart Rate"
            value={`${maxHR} BPM`}
            onPress={() => {
              setMaxHRInput(String(maxHR));
              setEditingMaxHR(true);
            }}
          />
        )}

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
  maxHREdit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  maxHRInput: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    width: 70,
    textAlign: "center",
  },
  signOutBtn: {
    marginTop: 32,
  },
});
