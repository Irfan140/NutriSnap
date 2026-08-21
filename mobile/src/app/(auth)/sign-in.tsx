import { useAuth, useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";
import FormInput from "@/src/components/FormInput";
import GoogleSignIn from "@/src/components/GoogSignIn";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, Subtitle, Body, BodySemibold, Caption } from "@/src/components/Typography";
import { fieldErrorMessage, signInSchema } from "@/src/lib/validation";
import { useTheme, radius } from "@/src/theme/index";

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { isLoaded } = useAuth();
  const { colors, cardShadow } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<z.ZodError | null>(null);

  const onSignInPress = async () => {
    if (!isLoaded) return;

    const parsed = signInSchema.safeParse({ email, password });

    if (!parsed.success) {
      setFormError(parsed.error);
      return;
    }

    setFormError(null);
    setIsLoading(true);

    try {
      const attempt = await signIn.password({
        identifier: parsed.data.email,
        password: parsed.data.password,
      });

      if (attempt.error) {
        Alert.alert("Sign In Failed", "Please check your credentials");
      } else if (signIn.status === "complete") {
        await signIn.finalize();
      } else {
        Alert.alert("Sign In Failed", "Please check your credentials");
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign In Failed", "Please check your email and password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <FormInput
              label="Email address"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              error={fieldErrorMessage(formError, "email")}
            />
            <FormInput
              label="Password"
              icon="lock-closed-outline"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              error={fieldErrorMessage(formError, "password")}
            />
            <PrimaryButton
              label="Sign In"
              icon="log-in-outline"
              onPress={onSignInPress}
              loading={isLoading}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Caption dim style={{ marginHorizontal: 12 }}>
              or continue with
            </Caption>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <GoogleSignIn />

          <View style={styles.footer}>
            <Body>Don't have an account?</Body>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <BodySemibold style={{ color: colors.primary, marginLeft: 8 }}>
                  Sign Up
                </BodySemibold>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
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
    shadowColor: "#15803D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  subtitle: { marginTop: 8, marginBottom: 28 },
  card: { borderRadius: radius.lg, padding: 24 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: { flex: 1, height: 1 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,
  },
});