import { useSignIn } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FormInput from "@/src/components/FormInput";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, Subtitle, BodySemibold, Caption } from "@/src/components/Typography";
import { useTheme, radius } from "@/src/theme/index";

type Step = "email" | "code" | "newPassword";

export default function ForgotPasswordScreen() {
  const { signIn } = useSignIn();
  const { colors, cardShadow } = useTheme();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const si = signIn as any;

  const onSendCode = async () => {
    if (!si || !email.trim()) {
      Alert.alert("Error", "Please enter your email address"); return;
    }
    setIsLoading(true);
    try {
      // Step 1: Initialize the sign-in with the identifier, then send the code
      await si.create({ identifier: email.trim() });
      await si.resetPasswordEmailCode.sendCode();
      setStep("code");
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Failed to send code.");
    } finally { setIsLoading(false); }
  };

  const onVerifyCode = async () => {
    if (!si || !code.trim() || code.trim().length !== 6) {
      Alert.alert("Error", "Please enter the 6-digit code"); return;
    }
    setIsLoading(true);
    try {
      // Step 2: Verify the code — correct method per Clerk docs
      await si.resetPasswordEmailCode.verifyCode({ code: code.trim() });
      setStep("newPassword");
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Invalid code.");
    } finally { setIsLoading(false); }
  };
const onSubmitNewPassword = async () => {
    if (!si || !newPassword.trim() || newPassword.trim().length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters"); return;
    }
    setIsLoading(true);
    try {
      // Step 3: Submit new password — correct method per Clerk docs
      await si.resetPasswordEmailCode.submitPassword({ password: newPassword.trim() });
      if (si.status === "complete") {
        await si.finalize();
        Alert.alert("Success", "Your password has been reset successfully.", [
          { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
        ]);
      }
    } catch (err: any) {
      Alert.alert("Error", err?.errors?.[0]?.message ?? "Failed to reset password.");
    } finally { setIsLoading(false); }
  };

  const onResendCode = async () => {
    if (!si) return;
    setIsLoading(true);
    try {
      await si.resetPasswordEmailCode.sendCode();
      Alert.alert("Sent", "A new code has been sent to your email.");
    } catch { Alert.alert("Error", "Could not resend code."); }
    finally { setIsLoading(false); }
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
                <FormInput label="Email address" icon="mail-outline" value={email} onChangeText={setEmail}
                  placeholder="you@example.com" keyboardType="email-address" returnKeyType="done"
                  textContentType="emailAddress" onSubmitEditing={onSendCode} />
                <PrimaryButton label="Send Reset Code" icon="send-outline" onPress={onSendCode} loading={isLoading} />
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
                <BodySemibold style={{ color: colors.textPrimary }}>{email}</BodySemibold>
              </Subtitle>
              <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
                <FormInput label="Reset Code" icon="lock-closed-outline" value={code} onChangeText={setCode}
                  placeholder="000000" keyboardType="number-pad" maxLength={6} centerText
                  returnKeyType="done" onSubmitEditing={onVerifyCode} />
                <PrimaryButton label="Verify Code" icon="checkmark-circle-outline" onPress={onVerifyCode} loading={isLoading} />
              </View>
              <TouchableOpacity style={styles.footer} onPress={onResendCode} activeOpacity={0.7} disabled={isLoading}
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
                <FormInput label="New Password" icon="lock-closed-outline" value={newPassword}
                  onChangeText={setNewPassword} placeholder="Min. 8 characters" secureTextEntry
                  returnKeyType="done" textContentType="newPassword" onSubmitEditing={onSubmitNewPassword} />
                <PrimaryButton label="Reset Password" icon="refresh-outline" onPress={onSubmitNewPassword} loading={isLoading} />
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