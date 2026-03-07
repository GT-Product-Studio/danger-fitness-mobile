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

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await resetPassword(email);
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
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
          <Text style={styles.title}>Reset Password</Text>

          {sent ? (
            <View>
              <Text style={styles.success}>
                Check your email for a password reset link.
              </Text>
              <Button
                title="BACK TO SIGN IN"
                onPress={() => router.back()}
                variant="outline"
                size="large"
                style={styles.button}
              />
            </View>
          ) : (
            <>
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.subtitle}>
                Enter your email and we'll send you a link to reset your
                password.
              </Text>

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

              <Button
                title="SEND RESET LINK"
                onPress={handleReset}
                loading={loading}
                size="large"
                style={styles.button}
              />

              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Back to Sign In</Text>
              </TouchableOpacity>
            </>
          )}
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
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
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
  success: {
    color: COLORS.primary,
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  link: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
});
