import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, H2, H3, Subtitle, Body, BodySemibold, Caption } from "@/src/components/Typography";
import { useTheme, radius } from "@/src/theme/index";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { colors, cardShadow } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
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

        {/* Quick Access */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>Quick Access</H3>
          <TouchableOpacity
            style={[styles.menuRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={() => router.push("/settings" as any)}
            accessibilityRole="button"
            accessibilityLabel="Open app settings"
            accessibilityHint="Go to appearance and app info settings"
            hitSlop={4}
          >
            <View style={[styles.menuIcon, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="settings-outline" size={20} color={colors.accent} />
            </View>
            <BodySemibold style={{ flex: 1 }}>App Settings</BodySemibold>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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