import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, connectionStatus } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    setIsLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { error: authError } = await signIn(email.trim(), password);
    if (authError) setError(authError);
    setIsLoading(false);
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={[styles.logoIcon, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
          <Feather name="droplet" size={32} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>LaundryLink</Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          The operating system for laundry businesses
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>Welcome Back</Text>

        {!!error && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "12", borderRadius: colors.radius }]}>
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
          </View>
        )}

        {connectionStatus === "unreachable" && (
          <View style={[styles.warningBox, { backgroundColor: "#f59e0b18", borderRadius: colors.radius, borderColor: "#f59e0b40" }]}>
            <Feather name="wifi-off" size={14} color="#f59e0b" />
            <Text style={[styles.warningText, { color: "#92400e" }]}>
              Connection issue — sign in may fail. Check your internet or try again shortly.
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <View style={[styles.inputWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter your email"
              placeholderTextColor={colors.mutedForeground}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
          <View style={[styles.inputWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={isLoading}
          style={[styles.btn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: isLoading ? 0.7 : 1 }]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Sign In</Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={[styles.linkText, { color: colors.accent }]}>Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24, justifyContent: "center" },
  logoSection: { alignItems: "center", marginBottom: 40 },
  logoIcon: { width: 72, height: 72, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  appName: { fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 6 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  form: { gap: 16 },
  formTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  warningBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  btn: { paddingVertical: 16, alignItems: "center", marginTop: 8 },
  btnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
