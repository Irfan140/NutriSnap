import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Body, BodySemibold, Caption, H1, H3 } from "@/src/components/Typography";
import { env } from "@/src/config/env";
import {
  fetchMealsPage,
  type MealHistoryItem,
} from "@/src/lib/meals-api";
import { healthScoreColor, scoreLabel, useTheme } from "@/src/theme/index";

const SERVER_URL = env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
const LIST_URL = SERVER_URL ? `${SERVER_URL}/api/aifood` : undefined;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
}

function HistoryRow({ item, onPress }: { item: MealHistoryItem; onPress: () => void }) {
  const { colors, cardShadow } = useTheme();
  const [imgHidden, setImgHidden] = useState(false);
  const succeeded = item.status === "SUCCEEDED";
  const failed = item.status === "FAILED";
  const tint = succeeded && item.healthScore !== null
    ? healthScoreColor(item.healthScore, colors)
    : failed
      ? colors.danger
      : colors.warning;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, cardShadow]}
      activeOpacity={0.8}
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Open analysis from ${formatDate(item.createdAt)}`}
      accessibilityHint="Shows the full nutrition breakdown"
    >
      {item.imageUrl && !imgHidden ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={[styles.thumb, { backgroundColor: colors.border }]}
          contentFit="cover"
          onError={() => setImgHidden(true)}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="nutrition-outline" size={24} color={colors.primaryDark} />
        </View>
      )}
      <View style={styles.rowText}>
        <BodySemibold numberOfLines={2}>
          {succeeded
            ? (item.summary ?? "Meal analysis")
            : failed
              ? (item.error ?? "Analysis failed")
              : "Analyzing your meal…"}
        </BodySemibold>
        <Caption dim style={{ marginTop: 4 }}>
          {formatDate(item.createdAt)}
          {succeeded && item.healthScore !== null ? ` · ${scoreLabel(item.healthScore)}` : ""}
        </Caption>
      </View>
      <View style={[styles.scoreChip, { backgroundColor: `${tint}1F` }]}>
        {succeeded && item.healthScore !== null ? (
          <BodySemibold style={{ color: tint }}>{item.healthScore}</BodySemibold>
        ) : (
          <Ionicons
            name={failed ? "alert-circle-outline" : "time-outline"}
            size={20}
            color={tint}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { getToken, signOut } = useAuth();
  const { colors, cardShadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<readonly MealHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreFailed, setLoadMoreFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Clerk's getToken/signOut identities are not stable across renders.
  // Reading them through a ref keeps the callbacks below referentially
  // stable, so mount/focus effects fire once instead of refetching in a loop.
  const authRef = useRef({ getToken, signOut });
  authRef.current = { getToken, signOut };
  const inflightRef = useRef(false);

  const loadPage = useCallback(
    async (targetPage: number, opts?: { readonly append?: boolean; readonly silent?: boolean }) => {
      if (inflightRef.current) return;
      if (!LIST_URL) {
        if (mountedRef.current) {
          setErrorMessage(
            "Server URL is missing. Set EXPO_PUBLIC_SERVER_URL in your environment and restart Expo.",
          );
          setLoading(false);
        }
        return;
      }
      const append = opts?.append ?? false;
      const silent = opts?.silent ?? false;
      if (mountedRef.current) {
        if (append) {
          setLoadingMore(true);
          setLoadMoreFailed(false);
        } else if (!silent) {
          setLoading(true);
          setErrorMessage(null);
        }
      }
      inflightRef.current = true;
      const { getToken, signOut } = authRef.current;
      try {
        const result = await fetchMealsPage(LIST_URL, targetPage, getToken);
        if (!mountedRef.current) return;
        setItems((prev) => (append ? [...prev, ...result.items] : result.items));
        setTotal(result.total);
        setPage(result.page);
        setErrorMessage(null);
      } catch (err) {
        if (!mountedRef.current) return;
        if (err instanceof Error && err.message === "AUTH_EXPIRED") {
          await signOut();
          return;
        }
        const message = err instanceof Error ? err.message : "Could not load history.";
        if (append) {
          setLoadMoreFailed(true);
        } else if (!silent) {
          setErrorMessage(message);
        }
      } finally {
        inflightRef.current = false;
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  // Always refetch on focus: cheap (one page), keeps presigned thumbnails
  // fresh, and reflects deletions made on the detail screen. Overlap with
  // mount/paging loads is blocked by inflightRef inside loadPage.
  useFocusEffect(
    useCallback(() => {
      void loadPage(1, { silent: true });
    }, [loadPage]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadPage(1);
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing || loadMoreFailed) return;
    if (items.length >= total) return;
    void loadPage(page + 1, { append: true });
  }, [loading, loadingMore, refreshing, loadMoreFailed, items.length, total, page, loadPage]);

  const openDetail = useCallback((id: string) => {
    router.push({ pathname: "/(app)/meal/[id]", params: { id } });
  }, []);

  if (loading && items.length === 0 && !errorMessage) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Body dim style={{ marginTop: 12 }}>
            Loading your meals…
          </Body>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120, flexGrow: items.length === 0 ? 1 : undefined },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <H1>History</H1>
            <Body align="center" style={{ marginTop: 6 }}>
              Your past meal analyses
            </Body>
          </View>
        }
        ListEmptyComponent={
          errorMessage ? (
            <View style={[styles.stateCard, { backgroundColor: colors.surface }, cardShadow]}>
              <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
              <H3 align="center" style={{ marginTop: 12 }}>
                Couldn&apos;t load history
              </H3>
              <Body align="center" dim style={{ marginTop: 6 }}>
                {errorMessage}
              </Body>
              <TouchableOpacity
                style={[styles.retryButton, { backgroundColor: colors.primary }]}
                onPress={() => void loadPage(1)}
                accessibilityRole="button"
                accessibilityLabel="Retry loading history"
                hitSlop={4}
              >
                <BodySemibold style={{ color: colors.textInverse }}>Try Again</BodySemibold>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.stateCard, { backgroundColor: colors.surface }, cardShadow]}>
              <Ionicons name="nutrition-outline" size={32} color={colors.primary} />
              <H3 align="center" style={{ marginTop: 12 }}>
                No meals yet
              </H3>
              <Body align="center" dim style={{ marginTop: 6 }}>
                Analyze your first meal from the Home tab and it will show up here.
              </Body>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ marginVertical: 16 }}
            />
          ) : loadMoreFailed ? (
            <TouchableOpacity
              style={styles.footerRetry}
              onPress={() => void loadPage(page + 1, { append: true })}
              accessibilityRole="button"
              accessibilityLabel="Retry loading more meals"
              hitSlop={4}
            >
              <BodySemibold style={{ color: colors.primary }}>
                Couldn&apos;t load more — tap to retry
              </BodySemibold>
            </TouchableOpacity>
          ) : null
        }
        renderItem={({ item }) => (
          <HistoryRow item={item} onPress={() => openDetail(item.id)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 20 },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  thumb: { width: 64, height: 64, borderRadius: 12 },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, marginHorizontal: 12 },
  scoreChip: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRetry: { alignItems: "center", paddingVertical: 16 },
});
