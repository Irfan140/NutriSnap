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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";
import FormInput from "@/src/components/FormInput";
import GoogleSignIn from "@/src/components/GoogSignIn";
import PrimaryButton from "@/src/components/PrimaryButton";
import { fieldErrorMessage, signInSchema } from "@/src/lib/validation";
import { cardShadow, colors, radius } from "@/src/theme";

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { isLoaded } = useAuth();

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
        // Finalize activates the new session, which flips the isSignedIn
        // guard in the layout and redirects away from this screen.
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

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to keep tracking your meals</Text>

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
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleSignIn />

          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account?"}</Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brand: {
    alignItems: "center",
    marginBottom: 28,
  },
  brandBadge: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.primaryDark,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 24,
    ...cardShadow,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,
  },
  footerText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  footerLink: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginLeft: 8,
  },
});
