import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MealResultCard from "@/src/components/MealResultCard";
import { Body, BodySemibold, H3 } from "@/src/components/Typography";
import { env } from "@/src/config/env";
import { analysisStatusResponseSchema } from "@/src/lib/meals-api";
import {
  apiErrorSchema,
  parseResultMessage,
  type NutritionData,
} from "@/src/lib/nutrition";
import { radius, useTheme } from "@/src/theme/index";

const SERVER_URL = env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
const ANALYZE_URL = SERVER_URL ? `${SERVER_URL}/api/aifood` : undefined;

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, signOut } = useAuth();
  const { colors, cardShadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [imgHidden, setImgHidden] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Same stability guard as history.tsx: Clerk callbacks change identity
  // across renders, so read them through a ref to keep `load` (and its
  // mount effect) from refetching in a loop.
  const authRef = useRef({ getToken, signOut });
  authRef.current = { getToken, signOut };

  const load = useCallback(async () => {
    const { getToken, signOut } = authRef.current;
    if (!ANALYZE_URL || typeof id !== "string" || id === "") {
      setErrorMessage("Could not open this analysis.");
      setLoading(false);
      return;
    }
    if (mountedRef.current) {
      setLoading(true);
      setErrorMessage(null);
    }
    try {
      const token = await getToken();
      if (!token) {
        await signOut();
        return;
      }
      const res = await fetch(`${ANALYZE_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await signOut();
        return;
      }
      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        throw new Error(`Unexpected server response (${res.status}).`);
      }
      if (!res.ok && res.status !== 422) {
        const parsedError = apiErrorSchema.safeParse(payload);
        throw new Error(
          parsedError.success ? parsedError.data.error : `Request failed (${res.status}).`,
        );
      }
      const parsed = analysisStatusResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Unexpected server response.");
      }
      if (!mountedRef.current) return;
      setStatus(parsed.data.status);
      setImageUrl(parsed.data.imageUrl);
      if (parsed.data.status === "FAILED") {
        setErrorMessage(parsed.data.error ?? "Analysis failed.");
        return;
      }
      if (parsed.data.status !== "SUCCEEDED") {
        setErrorMessage("This analysis is still running. Please try again shortly.");
        return;
      }
      const result = parseResultMessage(parsed.data.message ?? "");
      if (!result) {
        setErrorMessage("The AI returned data in an unexpected format.");
        return;
      }
      setNutrition(result.nutrition);
      setMarkdown(result.markdown);
    } catch (err) {
      if (!mountedRef.current) return;
      setErrorMessage(err instanceof Error ? err.message : "Could not load this analysis.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Body dim style={{ marginTop: 12 }}>
              Loading analysis…
            </Body>
          </View>
        ) : errorMessage ? (
          <View style={[styles.stateCard, { backgroundColor: colors.surface }, cardShadow]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
            <H3 align="center" style={{ marginTop: 12 }}>
              {status && status !== "SUCCEEDED" && status !== "FAILED"
                ? "Still analyzing"
                : "Something went wrong"}
            </H3>
            <Body align="center" dim style={{ marginTop: 6 }}>
              {errorMessage}
            </Body>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => void load()}
              accessibilityRole="button"
              accessibilityLabel="Retry loading analysis"
              hitSlop={4}
            >
              <BodySemibold style={{ color: colors.textInverse }}>Try Again</BodySemibold>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {imageUrl && !imgHidden ? (
              <Image
                source={{ uri: imageUrl }}
                style={[styles.photo, { backgroundColor: colors.border }]}
                contentFit="cover"
                onError={() => setImgHidden(true)}
                accessibilityRole="image"
                accessibilityLabel="Analyzed meal photo"
              />
            ) : null}
            <MealResultCard nutrition={nutrition} markdown={markdown} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 },
  stateCard: {
    borderRadius: 16,
    padding: 28,
    marginTop: 24,
    alignItems: "center",
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  photo: {
    width: "100%",
    height: 240,
    borderRadius: radius.xl,
    marginBottom: 4,
  },
});
