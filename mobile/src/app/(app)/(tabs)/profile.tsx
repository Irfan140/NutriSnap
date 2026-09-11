import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, H3, Subtitle, Body, BodySemibold, Caption } from "@/src/components/Typography";
import { fetchMealsStats, type MealStats } from "@/src/lib/meals-api";
import { healthScoreColor, useTheme, radius } from "@/src/theme/index";

import { env } from "@/src/config/env";

const SUPPORT_EMAIL = "irfanmehmud140@gmail.com";
const SERVER_URL = env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
const STATS_URL = SERVER_URL ? `${SERVER_URL}/api/aifood/stats` : undefined;
const FOCUS_REFETCH_AFTER_MS = 60_000;

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString();
}

interface StatTileProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
}

function StatTile({ icon, tint, label, value }: StatTileProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[styles.statTile, { backgroundColor: colors.background }]}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
    >
      <View style={[styles.statIcon, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <BodySemibold style={{ fontSize: 20, marginTop: 8 }}>{value}</BodySemibold>
      <Caption dim style={{ marginTop: 2 }}>
        {label}
      </Caption>
    </View>
  );
}

const Profile = () => {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const { colors, cardShadow } = useTheme();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<MealStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const mountedRef = useRef(true);
  const lastFetchedAtRef = useRef(0);

  // Same stability guard as history.tsx: Clerk callbacks change identity
  // across renders, so read them through a ref inside the loader.
  const authRef = useRef({ getToken, signOut });
  authRef.current = { getToken, signOut };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadStats = useCallback(async (silent: boolean) => {
    if (!STATS_URL || !mountedRef.current) {
      if (mountedRef.current) {
        setStatsLoading(false);
      }
      return;
    }
    if (!silent) {
      setStatsLoading(true);
    }
    try {
      const result = await fetchMealsStats(STATS_URL, authRef.current.getToken);
      if (!mountedRef.current) return;
      setStats(result);
      lastFetchedAtRef.current = Date.now();
    } catch (err) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.message === "AUTH_EXPIRED") {
        await authRef.current.signOut();
        return;
      }
    } finally {
      if (mountedRef.current) setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats(false);
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      if (Date.now() - lastFetchedAtRef.current > FOCUS_REFETCH_AFTER_MS) {
        void loadStats(true);
      }
    }, [loadStats]),
  );

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const openSupportEmail = useCallback(async (subject: string, body: string) => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    // Try the Gmail app first, fall back to the default mail app.
    const gmailUrl = `googlegmail://co?to=${SUPPORT_EMAIL}&subject=${encodedSubject}&body=${encodedBody}`;
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodedSubject}&body=${encodedBody}`;
    try {
      await Linking.openURL(gmailUrl);
    } catch {
      try {
        await Linking.openURL(mailtoUrl);
      } catch {
        Alert.alert("Error", "Could not open an email app");
      }
    }
  }, []);

  const handleReportBug = useCallback(() => {
    void Haptics.selectionAsync();
    void openSupportEmail(
      `NutriSnap Bug Report (App version: v${appVersion})`,
      `Describe the issue:\n\n`,
    );
  }, [appVersion, openSupportEmail]);

  const handleSendFeedback = useCallback(() => {
    void Haptics.selectionAsync();
    void openSupportEmail(
      `NutriSnap Feedback (App version: v${appVersion})`,
      `Your feedback:\n\n`,
    );
  }, [appVersion, openSupportEmail]);

  const avatarUri = user?.imageUrl ?? null;
  const displayName = user?.fullName ?? user?.firstName ?? "NutriSnap User";
  const email = user?.primaryEmailAddress?.emailAddress ?? "No email available";

  const memberSince = (() => {
    if (!user?.createdAt) return null;
    const date = new Date(user.createdAt);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  })();

  const initials = (() => {
    const source = user?.fullName ?? user?.firstName ?? email;
    const letters = source
      .split(" ")
      .map((part) => part.charAt(0))
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
    return letters !== "" ? letters : "N";
  })();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <H1>Profile</H1>
          <Subtitle style={{ marginTop: 4 }}>Manage your account details</Subtitle>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <View style={[styles.avatarRing, { backgroundColor: colors.primarySoft }]}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View
                style={[
                  styles.avatar,
                  styles.avatarFallback,
                  { backgroundColor: colors.primary },
                ]}
              >
                <H3 style={{ color: colors.textInverse }}>{initials}</H3>
              </View>
            )}
          </View>
          <H3 align="center" style={{ marginBottom: 4 }}>
            {displayName}
          </H3>
          <Body align="center">{email}</Body>
          {memberSince ? (
            <View style={[styles.memberChip, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="calendar-outline" size={13} color={colors.primaryDark} />
              <Caption
                style={{
                  color: colors.primaryDark,
                  marginLeft: 6,
                  fontWeight: "600",
                }}
              >
                {`Member since ${memberSince}`}
              </Caption>
            </View>
          ) : null}
        </View>

        {/* Stats */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>Your stats</H3>
          {statsLoading && !stats ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
          ) : stats ? (
            <>
              <View style={styles.statsGrid}>
                <StatTile
                  icon="nutrition-outline"
                  tint={colors.primary}
                  label="Meals analyzed"
                  value={String(stats.total)}
                />
                <StatTile
                  icon="speedometer-outline"
                  tint={
                    stats.averageHealthScore !== null
                      ? healthScoreColor(stats.averageHealthScore, colors)
                      : colors.textSecondary
                  }
                  label="Avg. score"
                  value={stats.averageHealthScore !== null ? String(stats.averageHealthScore) : "—"}
                />
                <StatTile
                  icon="flame-outline"
                  tint="#F97316"
                  label="Day streak"
                  value={`${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`}
                />
                <StatTile
                  icon="trophy-outline"
                  tint="#EAB308"
                  label="Best streak"
                  value={`${stats.bestStreak} ${stats.bestStreak === 1 ? "day" : "days"}`}
                />
              </View>
              <Caption dim align="center" style={{ marginTop: 4 }}>
                {stats.lastAnalyzedAt
                  ? `Last analyzed ${formatDateTime(stats.lastAnalyzedAt)}`
                  : stats.total === 0
                    ? "Analyze your first meal from Home to start your streak."
                    : "Finish an analysis to start your streak."}
              </Caption>
            </>
          ) : (
            <TouchableOpacity
              onPress={() => void loadStats(false)}
              accessibilityRole="button"
              accessibilityLabel="Retry loading stats"
              hitSlop={4}
            >
              <Caption dim>Couldn&apos;t load stats — tap to retry</Caption>
            </TouchableOpacity>
          )}
        </View>

        {/* Account Info */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>Account Details</H3>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoLabel}>
              <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
              <Body style={{ marginLeft: 10 }}>Email</Body>
            </View>
            <BodySemibold style={styles.infoValue} numberOfLines={1}>{email}</BodySemibold>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoLabel}>
              <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
              <Body style={{ marginLeft: 10 }}>Name</Body>
            </View>
            <BodySemibold style={styles.infoValue}>{displayName}</BodySemibold>
          </View>
          {memberSince ? (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
                <Body style={{ marginLeft: 10 }}>Member since</Body>
              </View>
              <BodySemibold style={styles.infoValue}>{memberSince}</BodySemibold>
            </View>
          ) : null}
        </View>

        {/* Support */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>Support</H3>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handleSendFeedback}
            accessibilityRole="button"
            accessibilityLabel="Send feedback"
            accessibilityHint="Opens Gmail to send feedback"
            hitSlop={4}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <BodySemibold>Send Feedback</BodySemibold>
              <Caption dim>Share ideas or suggestions</Caption>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            activeOpacity={0.7}
            onPress={handleReportBug}
            accessibilityRole="button"
            accessibilityLabel="Report a bug"
            accessibilityHint="Opens Gmail to send a bug report"
            hitSlop={4}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons name="bug-outline" size={20} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <BodySemibold>Report a Bug</BodySemibold>
              <Caption dim>Found an issue? Let us know</Caption>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <PrimaryButton
          label="Sign Out"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  card: {
    borderRadius: radius.xl,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  avatarRing: {
    padding: 5,
    borderRadius: radius.full,
    marginBottom: 16,
  },
  avatar: { width: 96, height: 96, borderRadius: radius.full },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 14,
  },
  sectionTitle: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
  },
  statTile: {
    width: "48%",
    borderRadius: radius.md,
    padding: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  signOutButton: { marginBottom: 24 },
});