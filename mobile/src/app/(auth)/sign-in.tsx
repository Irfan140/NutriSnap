import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import {
  GoogleSignin,
  isErrorWithCode,
  isCancelledResponse,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import React, { useCallback, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignInButton from "@/src/components/GoogleSignInButton";
import { H1, Subtitle, BodySemibold, Caption } from "@/src/components/Typography";
import { authClient } from "@/src/lib/auth";
import { env } from "@/src/config/env";
import { SERVER_URL } from "@/src/lib/server-url";
import { useTheme, radius } from "@/src/theme/index";

/** Native Google SDK is configured once, up-front (id-token only flow). */
const WEB_CLIENT_ID = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
if (WEB_CLIENT_ID) {
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
}

/** Maps a thrown native Google SDK error to user-facing copy. */
function googleFailureMessage(err: unknown): string {
  if (isErrorWithCode(err)) {
    if (err.code === statusCodes.IN_PROGRESS) {
      return "A Google sign-in is already in progress.";
    }
    if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return "Google Play Services is not available. Update it and try again.";
    }
  }
  return "Could not sign in with Google. Please try again.";
}

export default function SignInScreen() {
  const { colors, cardShadow } = useTheme();
  const [signingIn, setSigningIn] = useState(false);

  const handleGoogleSignIn = useCallback(async () => {
    if (signingIn) return;
    void Haptics.selectionAsync();

    if (!WEB_CLIENT_ID) {
      Alert.alert(
        "Setup required",
        "Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID and rebuild the app.",
      );
      return;
    }
    if (!SERVER_URL) {
      Alert.alert(
        "Setup required",
        "Server URL is missing. Set EXPO_PUBLIC_SERVER_URL and restart Expo.",
      );
      return;
    }

    setSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();

      // User closed the account chooser — keep the screen as-is.
      if (isCancelledResponse(response)) {
        return;
      }
      if (!isSuccessResponse(response)) {
        throw new Error("Unexpected Google sign-in response.");
      }
      const idToken = response.data.idToken;
      if (!idToken) {
        Alert.alert(
          "Sign In Failed",
          "Google did not return an ID token. Please try again.",
        );
        return;
      }

      const res = await authClient.signIn.social({
        provider: "google",
        idToken: { token: idToken },
      });
      if (res.error) {
        Alert.alert("Sign In Failed", res.error.message ?? "Could not sign in with Google");
        return;
      }
      // Session established — the (app) gate redirects to the app.
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign In Failed", googleFailureMessage(err));
    } finally {
      setSigningIn(false);
    }
  }, [signingIn]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="leaf" size={26} color={colors.textInverse} />
          </View>
          <BodySemibold style={{ color: colors.primary, fontSize: 18, letterSpacing: 0.5 }}>
            NutriSnap
          </BodySemibold>
        </View>

        <H1 align="center">Welcome back</H1>
        <Subtitle align="center" style={styles.subtitle}>
          Sign in to keep tracking your meals
        </Subtitle>

        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <GoogleSignInButton onPress={() => void handleGoogleSignIn()} loading={signingIn} />
          <Caption dim align="center" style={{ marginTop: 16 }}>
            Continue with your Google account. Your email stays private.
          </Caption>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brand: { alignItems: "center", marginBottom: 32 },
  brandBadge: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  subtitle: { marginTop: 8, marginBottom: 28 },
  card: { borderRadius: radius.lg, padding: 24 },
});
