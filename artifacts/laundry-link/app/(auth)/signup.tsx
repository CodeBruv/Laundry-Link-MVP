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

import { RoleSelector } from "@/components/RoleSelector";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { UserRole } from "@/types";

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setIsLoading(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const { error: authError } = await signUp(
      email.trim(),
      password,
      fullName.trim(),
      selectedRole,
    );
    if (authError) {
      setError(authError);
    }
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
      <View style={styles.logoSection}>
        <View
          style={[
            styles.logoIcon,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Feather name="droplet" size={28} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.appName, { color: colors.primary }]}>
          LaundryLink
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={[styles.formTitle, { color: colors.foreground }]}>
          Create Account
        </Text>
        <Text style={[styles.formSubtitle, { color: colors.mutedForeground }]}>
          Choose your role to get started
        </Text>

        {!!error && (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "12",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="alert-circle" size={14} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            I am a...
          </Text>
          <RoleSelector selectedRole={selectedRole} onSelect={setSelectedRole} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>
            Full Name
          </Text>
          <View
            style={[
              styles.inputWrap,
              { borderColor: colors.input, borderRadius: colors.radius },
            ]}
          >
            <Feather name="user" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Enter your full name"
              placeholderTextColor={colors.mutedForeground}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
          <View
            style={[
              styles.inputWrap,
              { borderColor: colors.input, borderRadius: colors.radius },
            ]}
          >
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
          <Text style={[styles.label, { color: colors.foreground }]}>
            Password
          </Text>
          <View
            style={[
              styles.inputWrap,
              { borderColor: colors.input, borderRadius: colors.radius },
            ]}
          >
            <Feather name="lock" size={18} color={colors.mutedForeground} />
            <TextInput
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color={colors.mutedForeground}
              />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleSignup}
          disabled={isLoading}
          style={[
            styles.btn,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: isLoading ? 0.7 : 1,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
              Create Account
            </Text>
          )}
        </Pressable>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            Already have an account?{" "}
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={[styles.linkText, { color: colors.accent }]}>
                Sign In
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  form: {
    gap: 14,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  formSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
