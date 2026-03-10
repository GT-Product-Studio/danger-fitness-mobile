import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../lib/auth";
import { COLORS } from "../../lib/constants/brand";
import { Button } from "../../components/ui/Button";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await signIn(email, password);
    if (authError) {
      setLoading(false);
      setError(authError.message);
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>DANGER</Text>
          <Text style={styles.brandSub}>FITNESS</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />

          <Button
            title="SIGN IN"
            onPress={handleLogin}
            loading={loading}
            size="large"
            style={styles.button}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/reset-password")}
          >
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.link}>
              Don't have an account?{" "}
              <Text style={styles.linkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
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
  form: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    minHeight: 48,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  error: {
    color: COLORS.danger,
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  link: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: "700",
  },
});
