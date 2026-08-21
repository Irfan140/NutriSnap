import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "@/src/theme/index";

// Landing screen for the OAuth redirect (nutrisnap://sso-callback).
// The route must exist so Expo Router doesn't show "Unmatched Route"
// when the auth browser deep-links back into the app. ClerkProvider
// handles WebBrowser.maybeCompleteAuthSession() internally and the SSO
// hook resolves the session from the URL params. Once the session is
// active, redirect into the app (guards handle signed-out users).
export default function SSOCallback() {
  const { isSignedIn } = useAuth();
  const { colors } = useTheme();

  if (!isSignedIn) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href="/" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
