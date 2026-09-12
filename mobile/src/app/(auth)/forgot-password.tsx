import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormInput from "@/src/components/FormInput";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, Subtitle, BodySemibold, Caption } from "@/src/components/Typography";
import {
  forgotPasswordEmailSchema,
  newPasswordSchema,
  verificationCodeSchema,
  type ForgotPasswordEmailInput,
  type NewPasswordInput,
  type VerificationCodeInput,
} from "@/src/lib/validation";
import { useTheme, radius } from "@/src/theme/index";

type Step = "email" | "code" | "newPassword";

export default function ForgotPasswordScreen() {
  const { signIn } = useSignIn();
  const { colors, cardShadow } = useTheme();
  const [step, setStep] = useState<Step>("email");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const si = signIn as any;

  const emailForm = useForm<ForgotPasswordEmailInput>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  const codeForm = useForm<VerificationCodeInput>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: { code: "" },
  });

  const passwordForm = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "" },
  });

  const onSendCode = async (data: ForgotPasswordEmailInput) => {
    if (!si) return;
    try {
      // Step 1: Initialize the sign-in with the identifier, then send the code
      await si.create({ identifier: data.email });
      await si.resetPasswordEmailCode.sendCode();
      setStep("code");
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Failed to send code.");
    }
  };

  const onVerifyCode = async (data: VerificationCodeInput) => {
    if (!si) return;
    try {
      // Step 2: Verify the code — correct method per Clerk docs
      await si.resetPasswordEmailCode.verifyCode({ code: data.code });
      setStep("newPassword");
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Invalid code.");
    }
  };
const onSubmitNewPassword = async (data: NewPasswordInput) => {
    if (!si) return;
    try {
      // Step 3: Submit new password — correct method per Clerk docs
      await si.resetPasswordEmailCode.submitPassword({ password: data.newPassword });
      if (si.status === "complete") {
        await si.finalize();
        Alert.alert("Success", "Your password has been reset successfully.", [
          { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Failed to reset password.");
    }
  };

  const submitEmail = () => void emailForm.handleSubmit(onSendCode)();
  const submitCode = () => void codeForm.handleSubmit(onVerifyCode)();
  const submitPassword = () => void passwordForm.handleSubmit(onSubmitNewPassword)();

  const onResendCode = async () => {
    if (!si) return;
    try {
      await si.resetPasswordEmailCode.sendCode();
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch { Alert.alert("Error", "Could not resend code."); }
  };
const Brand = () => (
    <View style={styles.brand}>
      <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
        <Ionicons name="leaf" size={26} color={colors.textInverse} />
      </View>
      <BodySemibold style={{ color: colors.primary, fontSize: 18, letterSpacing: 0.5 }}>
        NutriSnap
      </BodySemibold>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Brand />
          {step === "email" && (
            <>
              <H1 align="center">Forgot Password?</H1>
              <Subtitle align="center" style={styles.subtitle}>
                Enter your email and we will send you a reset code
              </Subtitle>
              <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
                <Controller
                  control={emailForm.control}
                  name="email"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <FormInput label="Email address" icon="mail-outline" value={value} onChangeText={onChange}
                      placeholder="you@example.com" keyboardType="email-address" returnKeyType="done"
                      textContentType="emailAddress" onSubmitEditing={submitEmail} error={error?.message} />
                  )}
                />
                <PrimaryButton label="Send Reset Code" icon="send-outline" onPress={submitEmail} loading={emailForm.formState.isSubmitting} />
              </View>
              <TouchableOpacity style={styles.footer} onPress={() => router.back()} activeOpacity={0.7}
                accessibilityRole="button" accessibilityLabel="Back to sign in" hitSlop={8}>
                <BodySemibold style={{ color: colors.primary }}>Back to Sign In</BodySemibold>
              </TouchableOpacity>
            </>
          )}
          {step === "code" && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="key-outline" size={30} color={colors.primary} />
              </View>
              <H1 align="center">Check your email</H1>
              <Subtitle align="center" style={styles.subtitle}>
                Enter the 6-digit code sent to{"\n"}
                <BodySemibold style={{ color: colors.textPrimary }}>{emailForm.getValues("email")}</BodySemibold>
              </Subtitle>
              <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
                <Controller
                  control={codeForm.control}
                  name="code"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <FormInput label="Reset Code" icon="lock-closed-outline" value={value} onChangeText={onChange}
                      placeholder="000000" keyboardType="number-pad" maxLength={6} centerText
                      returnKeyType="done" onSubmitEditing={submitCode} error={error?.message} />
                  )}
                />
                <PrimaryButton label="Verify Code" icon="checkmark-circle-outline" onPress={submitCode} loading={codeForm.formState.isSubmitting} />
              </View>
              <TouchableOpacity style={styles.footer} onPress={onResendCode} activeOpacity={0.7} disabled={codeForm.formState.isSubmitting}
                accessibilityRole="button" accessibilityLabel="Resend code" hitSlop={8}>
                <BodySemibold style={{ color: colors.primary }}>Resend code</BodySemibold>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footer, { marginTop: 4 }]} onPress={() => setStep("email")} activeOpacity={0.7}>
                <Caption dim>Change email</Caption>
              </TouchableOpacity>
            </>
          )}
          {step === "newPassword" && (
            <>
              <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="shield-checkmark-outline" size={30} color={colors.primary} />
              </View>
              <H1 align="center">Set new password</H1>
              <Subtitle align="center" style={styles.subtitle}>
                Choose a strong password for your account
              </Subtitle>
              <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
                <Controller
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field: { value, onChange }, fieldState: { error } }) => (
                    <FormInput label="New Password" icon="lock-closed-outline" value={value}
                      onChangeText={onChange} placeholder="Min. 8 characters" secureTextEntry
                      returnKeyType="done" textContentType="newPassword" onSubmitEditing={submitPassword}
                      error={error?.message} />
                  )}
                />
                <PrimaryButton label="Reset Password" icon="refresh-outline" onPress={submitPassword} loading={passwordForm.formState.isSubmitting} />
              </View>
              <TouchableOpacity style={[styles.footer, { marginTop: 4 }]} onPress={() => setStep("code")} activeOpacity={0.7}>
                <Caption dim>Go back</Caption>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 40 },
  brand: { alignItems: "center", marginBottom: 32 },
  brandBadge: {
    width: 60, height: 60, borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: "#059669", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 5,
  },
  iconCircle: {
    alignSelf: "center", width: 64, height: 64,
    borderRadius: radius.full, alignItems: "center",
    justifyContent: "center", marginBottom: 16,
  },
  subtitle: { marginTop: 8, marginBottom: 28 },
  card: { borderRadius: radius.lg, padding: 24 },
  footer: {
    alignSelf: "center",
    marginTop: 20,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
});