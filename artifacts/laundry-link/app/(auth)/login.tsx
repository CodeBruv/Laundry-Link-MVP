import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/types";

const DEMO_ROLES: {
  role: UserRole;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}[] = [
  { role: "CUSTOMER",   label: "Customer",   icon: "user",   color: "#3b82f6" },
  { role: "BUSINESS",   label: "Business",   icon: "home",   color: "#8b5cf6" },
  { role: "DISPATCHER", label: "Dispatcher", icon: "truck",  color: "#f97316" },
  { role: "ADMIN",      label: "Admin",      icon: "shield", color: "#ef4444" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router  = useRouter();
  const { signIn, signInDemo, signInAsOwner, isDemo, connectionStatus } = useAuth();

  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [demoLoading,  setDemoLoading]  = useState<UserRole | null>(null);

  // Track long-press progress for the hidden trigger
  const signUpPressCount = useRef(0);
  const signUpOpacity    = useRef(new Animated.Value(1)).current;

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

  const handleDemoRole = async (role: UserRole, label: string) => {
    setDemoLoading(role);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signInDemo(`${label} (Demo)`, role);
    setDemoLoading(null);
  };

  // ── Hidden owner quick-access ────────────────────────────────────────────
  // Triggered by long-pressing the "Sign Up" text. The gesture is the auth
  // factor — no password is shown or entered. The session is persisted in
  // AsyncStorage so the owner stays logged in across restarts.
  const handleSignUpLongPress = async () => {
    if (ownerLoading) return;
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    // Brief opacity pulse — only visible if you're looking for it
    Animated.sequence([
      Animated.timing(signUpOpacity, { toValue: 0.3, duration: 80, useNativeDriver: false }),
      Animated.timing(signUpOpacity, { toValue: 1,   duration: 80, useNativeDriver: false }),
    ]).start();

    setOwnerLoading(true);
    setError("");
    // Small deliberate delay — feels intentional, prevents accidental double-fire
    await new Promise((r) => setTimeout(r, 400));
    await signInAsOwner();
    setOwnerLoading(false);
  };

  const showDemoSection = isDemo || connectionStatus === "unreachable" || connectionStatus === "unconfigured";

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

      {/* Demo mode quick-access */}
      {showDemoSection && (
        <View style={[styles.demoCard, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <View style={styles.demoHeader}>
            <Feather name="zap" size={15} color={colors.primary} />
            <Text style={[styles.demoTitle, { color: colors.foreground }]}>Quick Demo Access</Text>
          </View>
          <Text style={[styles.demoSub, { color: colors.mutedForeground }]}>
            Tap a role to explore the app instantly — no account needed.
          </Text>
          <View style={styles.demoGrid}>
            {DEMO_ROLES.map(({ role, label, icon, color }) => (
              <Pressable
                key={role}
                onPress={() => handleDemoRole(role, label)}
                disabled={demoLoading !== null}
                style={[styles.demoBtn, { borderColor: color + "40", backgroundColor: color + "10", borderRadius: colors.radius }]}
              >
                {demoLoading === role ? (
                  <ActivityIndicator size="small" color={color} />
                ) : (
                  <Feather name={icon} size={18} color={color} />
                )}
                <Text style={[styles.demoBtnText, { color }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
          {showDemoSection ? "or sign in with your account" : "sign in"}
        </Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
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
              Supabase is unreachable — sign in will use local demo mode. Your Supabase project may be paused.
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

        {/* Footer row — "Sign Up" carries the hidden long-press trigger */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account? </Text>

          {ownerLoading ? (
            // While owner session is activating, show a subtle spinner in-place
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Animated.View style={{ opacity: signUpOpacity }}>
              <Pressable
                onPress={() => router.push("/(auth)/signup")}
                onLongPress={handleSignUpLongPress}
                delayLongPress={600}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={[styles.linkText, { color: colors.accent }]}>Sign Up</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  logoSection: { alignItems: "center", marginBottom: 28 },
  logoIcon: { width: 64, height: 64, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  demoCard: { borderWidth: 1, padding: 16, gap: 10, marginBottom: 20 },
  demoHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  demoTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  demoSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  demoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  demoBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, paddingVertical: 11, paddingHorizontal: 14, minWidth: "46%" },
  demoBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
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
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 12 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
