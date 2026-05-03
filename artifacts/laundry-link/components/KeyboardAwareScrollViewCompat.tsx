/**
 * Keyboard-aware scroll view using only React Native built-ins.
 *
 * react-native-keyboard-controller requires compiled native modules that are
 * NOT available in Expo Go. This component uses KeyboardAvoidingView +
 * ScrollView which work in every Expo environment (Expo Go, dev builds, prod).
 */
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from "react-native";

interface Props extends ScrollViewProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

export function KeyboardAwareScrollViewCompat({
  children,
  style,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
  ...rest
}: Props) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        showsVerticalScrollIndicator={false}
        {...rest}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
