import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MealResultCard from "@/src/components/MealResultCard";
import { Body, BodySemibold, H3 } from "@/src/components/Typography";
import { useDeleteMeal } from "@/src/hooks/useDeleteMeal";
import { useMealDetail } from "@/src/hooks/useMealDetail";
import { parseResultMessage } from "@/src/lib/nutrition";
import { isAuthExpired } from "@/src/lib/query-client";
import { radius, useTheme } from "@/src/theme/index";

function DetailErrorCard({
  title,
  message,
  onRetry,
  onDelete,
  deleting,
}: {
  readonly title: string;
  readonly message: string;
  readonly onRetry: () => void;
  readonly onDelete?: () => void;
  readonly deleting?: boolean;
}) {
  const { colors, cardShadow } = useTheme();
  return (
    <View style={[styles.stateCard, { backgroundColor: colors.surface }, cardShadow]}>
      <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
      <H3 align="center" style={{ marginTop: 12 }}>
        {title}
      </H3>
      <Body align="center" dim style={{ marginTop: 6 }}>
        {message}
      </Body>
      <TouchableOpacity
        style={[styles.retryButton, { backgroundColor: colors.primary }]}
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading analysis"
        hitSlop={4}
      >
        <BodySemibold style={{ color: colors.textInverse }}>Try Again</BodySemibold>
      </TouchableOpacity>
      {onDelete ? (
        <DeleteAnalysisButton onPress={onDelete} deleting={deleting ?? false} />
      ) : null}
    </View>
  );
}

function DeleteAnalysisButton({
  onPress,
  deleting,
}: {
  readonly onPress: () => void;
  readonly deleting: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.deleteButton, { borderColor: colors.danger }]}
      onPress={onPress}
      disabled={deleting}
      accessibilityRole="button"
      accessibilityLabel="Delete this analysis"
      accessibilityHint="Permanently removes the photo and report"
      hitSlop={4}
    >
      <Ionicons name="trash-outline" size={18} color={colors.danger} style={{ marginRight: 8 }} />
      <BodySemibold style={{ color: colors.danger }}>
        {deleting ? "Deleting…" : "Delete analysis"}
      </BodySemibold>
    </TouchableOpacity>
  );
}

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken, signOut } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [imgHidden, setImgHidden] = useState(false);
  const validId = typeof id === "string" && id !== "" ? id : undefined;
  const detail = useMealDetail(validId);
  const deleteMeal = useDeleteMeal();

  const signOutRef = useRef(signOut);
  signOutRef.current = signOut;
  useEffect(() => {
    if (detail.error && isAuthExpired(detail.error)) {
      void signOutRef.current();
    }
  }, [detail.error]);

  const confirmDelete = useCallback(() => {
    if (!validId) return;
    Alert.alert(
      "Delete this analysis?",
      "The photo and its nutrition report will be permanently removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteMeal.mutate(
              { id: validId, getToken },
              {
                onSuccess: () => router.back(),
                onError: (err) => {
                  if (isAuthExpired(err)) {
                    void signOutRef.current();
                    return;
                  }
                  Alert.alert(
                    "Delete failed",
                    err instanceof Error ? err.message : "Could not delete this analysis.",
                  );
                },
              },
            ),
        },
      ],
    );
  }, [validId, getToken, deleteMeal]);

  const { refetch: refetchDetail } = detail;

  const refetch = useCallback(() => {
    void refetchDetail();
  }, [refetchDetail]);

  const payload = detail.data ?? null;
  const status = payload?.status ?? null;
  const transportError =
    !validId || (!payload && detail.error && !isAuthExpired(detail.error))
      ? !validId
        ? "Could not open this analysis."
        : "Could not load this analysis."
      : null;
  const failedError = status === "FAILED" ? (payload?.error ?? "Analysis failed.") : null;
  const stillRunning = status !== null && status !== "SUCCEEDED" && status !== "FAILED";
  const parsed = status === "SUCCEEDED" ? parseResultMessage(payload?.message ?? "") : undefined;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {detail.isPending ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Body dim style={{ marginTop: 12 }}>
              Loading analysis…
            </Body>
          </View>
        ) : transportError ? (
          <DetailErrorCard title="Something went wrong" message={transportError} onRetry={refetch} />
        ) : failedError ? (
          <DetailErrorCard
            title="Something went wrong"
            message={failedError}
            onRetry={refetch}
            onDelete={confirmDelete}
            deleting={deleteMeal.isPending}
          />
        ) : stillRunning ? (
          <DetailErrorCard
            title="Still analyzing"
            message="This analysis is still running. Please try again shortly."
            onRetry={refetch}
          />
        ) : !parsed ? (
          <DetailErrorCard
            title="Something went wrong"
            message="The AI returned data in an unexpected format."
            onRetry={refetch}
          />
        ) : (
          <>
            {payload?.imageUrl && !imgHidden ? (
              <Image
                source={{ uri: payload.imageUrl }}
                style={[styles.photo, { backgroundColor: colors.border }]}
                contentFit="cover"
                onError={() => setImgHidden(true)}
                accessibilityRole="image"
                accessibilityLabel="Analyzed meal photo"
              />
            ) : null}
            <MealResultCard nutrition={parsed.nutrition} markdown={parsed.markdown} />
            <DeleteAnalysisButton onPress={confirmDelete} deleting={deleteMeal.isPending} />
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
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
  },
  photo: {
    width: "100%",
    height: 240,
    borderRadius: radius.xl,
    marginBottom: 4,
  },
});
