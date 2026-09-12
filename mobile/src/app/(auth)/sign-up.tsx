import { useAuth, useSignUp } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
import FormInput from "@/src/components/FormInput";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, H2, Subtitle, Body, BodySemibold } from "@/src/components/Typography";
import {
  signUpSchema,
  verificationCodeSchema,
  type SignUpInput,
  type VerificationCodeInput,
} from "@/src/lib/validation";
import { useTheme, radius } from "@/src/theme/index";

export default function SignUpScreen() {
  const { signUp } = useSignUp();
  const { isLoaded } = useAuth();
  const { colors, cardShadow } = useTheme();

  const [pendingVerification, setPendingVerification] = useState(false);

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  });

  const codeForm = useForm<VerificationCodeInput>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: { code: "" },
  });

  const onSignUpPress = async (data: SignUpInput) => {
    if (!isLoaded) return;

    try {
      const createResult = await signUp.create({
        emailAddress: data.email,
        password: data.password,
      });

      if (createResult.error) {
        throw createResult.error;
      }

      await signUp.verifications.sendEmailCode();

      setPendingVerification(true);
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign Up Failed", "Please check your email and try again");
    }
  };

  const onVerifyPress = async (data: VerificationCodeInput) => {
    if (!isLoaded) return;

    try {
      const verifyResult = await signUp.verifications.verifyEmailCode({
        code: data.code,
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
    }
  };

  const submitSignUp = () => void signUpForm.handleSubmit(onSignUpPress)();
  const submitCode = () => void codeForm.handleSubmit(onVerifyPress)();

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
              {"We've sent a verification code to"} {signUpForm.getValues("email")}
            </Subtitle>

            <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
              <Controller
                control={codeForm.control}
                name="code"
                render={({ field: { value, onChange }, fieldState: { error } }) => (
                  <FormInput
                    label="Verification code"
                    icon="key-outline"
                    value={value}
                    onChangeText={onChange}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    centerText
                    error={error?.message}
                  />
                )}
              />
              <PrimaryButton
                label="Verify Email"
                icon="checkmark-circle-outline"
                onPress={submitCode}
                loading={codeForm.formState.isSubmitting}
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
            <Controller
              control={signUpForm.control}
              name="email"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <FormInput
                  label="Email address"
                  icon="mail-outline"
                  value={value}
                  onChangeText={onChange}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  error={error?.message}
                />
              )}
            />
            <Controller
              control={signUpForm.control}
              name="password"
              render={({ field: { value, onChange }, fieldState: { error } }) => (
                <FormInput
                  label="Password"
                  icon="lock-closed-outline"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Create a password (min. 8 characters)"
                  secureTextEntry
                  returnKeyType="done"
                  textContentType="newPassword"
                  onSubmitEditing={submitSignUp}
                  error={error?.message}
                />
              )}
            />
            <PrimaryButton
              label="Create Account"
              icon="person-add-outline"
              onPress={submitSignUp}
              loading={signUpForm.formState.isSubmitting}
            />
          </View>

          <View style={styles.footer}>
            <Body>Already have an account?</Body>
            <Link href="/sign-in" asChild>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go to sign in"
                hitSlop={8}
                style={styles.footerLink}
              >
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
  footerLink: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});