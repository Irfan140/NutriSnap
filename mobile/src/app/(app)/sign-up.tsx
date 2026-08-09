import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";
import FormInput from "@/src/components/FormInput";
import PrimaryButton from "@/src/components/PrimaryButton";
import {
  fieldErrorMessage,
  signUpSchema,
  verificationCodeSchema,
} from "@/src/lib/validation";
import { cardShadow, colors, radius } from "@/src/theme";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

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
      await signUp.create({
        emailAddress: parsed.data.email,
        password: parsed.data.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

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
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code: parsed.data.code,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
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
      <SafeAreaView style={styles.safeArea}>
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
              <Ionicons name="mail-open-outline" size={28} color={colors.primary} />
            </View>

            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>
              {"We've sent a 6-digit code to your inbox"}
            </Text>

            <View style={styles.card}>
              <FormInput
                label="Verification code"
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

            <View style={styles.footer}>
              <Text style={styles.footerText}>{"Didn't receive the code?"}</Text>
              <TouchableOpacity
                onPress={() => {
                  setCode("");
                  setFormError(null);
                  setPendingVerification(false);
                }}
              >
                <Text style={styles.footerLink}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <View style={styles.brandBadge}>
              <Ionicons name="leaf" size={26} color={colors.white} />
            </View>
            <Text style={styles.brandName}>NutriSnap</Text>
          </View>

          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Sign up to start analyzing your meals</Text>

          <View style={styles.card}>
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
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brand: { alignItems: "center", marginBottom: 24 },
  brandBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  verifyIconWrap: {
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    ...cardShadow,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: { fontSize: 15, color: colors.textSecondary },
  footerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 8,
  },
});
