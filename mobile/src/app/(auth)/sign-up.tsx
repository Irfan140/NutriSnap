import { useAuth, useSignUp } from "@clerk/expo";
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
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, H2, Subtitle, Body, BodySemibold } from "@/src/components/Typography";
import {
  fieldErrorMessage,
  signUpSchema,
  verificationCodeSchema,
} from "@/src/lib/validation";
import { useTheme, radius } from "@/src/theme/index";

export default function SignUpScreen() {
  const { signUp } = useSignUp();
  const { isLoaded } = useAuth();
  const { colors, cardShadow } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<z.ZodError | null>(null);

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFormError(parsed.error);
      return;
    }

    setFormError(null);
    setIsLoading(true);

    try {
      const createResult = await signUp.create({
        emailAddress: parsed.data.email,
        password: parsed.data.password,
      });

      if (createResult.error) {
        throw createResult.error;
      }

      await signUp.verifications.sendEmailCode();

      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign Up Failed", "Please check your email and try again");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    const parsed = verificationCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setFormError(parsed.error);
      return;
    }

    setFormError(null);
    setIsLoading(true);

    try {
      const verifyResult = await signUp.verifications.verifyEmailCode({
        code: parsed.data.code,
      });

      if (verifyResult.error) {
        throw verifyResult.error;
      }

      if (signUp.status === "complete") {
        await signUp.finalize();
      } else {
        Alert.alert("Verification Failed", "Please check your code and try again");
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Verification Failed", "Please check your code and try again");
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
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
            <View style={styles.verifyIconWrap}>
              <Ionicons name="mail-unread-outline" size={28} color={colors.primary} />
            </View>
            <H2 align="center">Check your email</H2>
            <Subtitle align="center" style={{ marginTop: 8, marginBottom: 24 }}>
              We've sent a verification code to {email}
            </Subtitle>

            <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
              <FormInput
                label="Verification code"
                icon="key-outline"
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
                centerText
                error={fieldErrorMessage(formError, "code")}
              />
              <PrimaryButton
                label="Verify Email"
                icon="checkmark-circle-outline"
                onPress={onVerifyPress}
                loading={isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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

          <H1 align="center">Create account</H1>
          <Subtitle align="center" style={styles.subtitle}>
            Sign up to start analyzing your meals
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
              placeholder="Create a password (min. 8 characters)"
              secureTextEntry
              error={fieldErrorMessage(formError, "password")}
            />
            <PrimaryButton
              label="Create Account"
              icon="person-add-outline"
              onPress={onSignUpPress}
              loading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <Body>Already have an account?</Body>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <BodySemibold style={{ color: colors.primary, marginLeft: 8 }}>
                  Sign In
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
    paddingVertical: 32,
  },
  brand: { alignItems: "center", marginBottom: 28 },
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
  verifyIconWrap: {
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  subtitle: { marginTop: 8, marginBottom: 28 },
  card: { borderRadius: radius.lg, padding: 24 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
});