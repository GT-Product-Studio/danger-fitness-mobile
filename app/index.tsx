import { useEffect } from "react";
import { ActivityIndicator, View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { COLORS } from "../lib/constants/brand";

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>DANGER</Text>
      <Text style={styles.brandSub}>FITNESS</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.primary}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: {
    fontSize: 48,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: 8,
  },
  brandSub: {
    fontSize: 24,
    fontWeight: "300",
    color: COLORS.text,
    letterSpacing: 12,
    marginTop: 4,
  },
  spinner: {
    marginTop: 32,
  },
});
