import { useSSO } from "@clerk/expo";
import React, { useCallback } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { Path, Svg } from "react-native-svg";
import { cardShadow, colors, radius } from "@/src/theme";

// Google Logo Component
const GoogleIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export default function GoogleSignIn() {
  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      // The redirect URL is handled by Clerk (defaults to makeRedirectUri({ path: 'sso-callback' }))
      // and ClerkProvider already calls WebBrowser.maybeCompleteAuthSession() internally
      const { createdSessionId, setActive, signUp } = await startSSOFlow({
        strategy: "oauth_google",
      });

      // If sign in was successful, set the active session.
      // Route protection in (app)/_layout.tsx handles navigation automatically
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      } else if (!createdSessionId && signUp?.status === "missing_requirements") {
        // Instance requires fields the provider didn't supply (e.g. username)
        Alert.alert(
          "Additional Info Required",
          "Please sign up with email to complete the required fields"
        );
      }
      // No createdSessionId and no missing requirements → user cancelled; do nothing
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign In Failed", "Could not sign in with Google");
    }
  }, [startSSOFlow]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.button}>
      <GoogleIcon />
      <Text style={styles.label}>Sign in with Google</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 52,
    paddingHorizontal: 24,
    ...cardShadow,
  },
  label: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
});
