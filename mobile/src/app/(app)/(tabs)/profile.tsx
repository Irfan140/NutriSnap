import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useCallback } from "react";
import {
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import { H1, H2, H3, Subtitle, Body, BodySemibold, Caption } from "@/src/components/Typography";
import { useTheme, radius } from "@/src/theme/index";

const DEVELOPER = {
  name: "Irfan Mehmud",
  github: "Irfan140",
  email: "irfanmehmud140@gmail.com",
  githubUrl: "https://github.com/Irfan140",
};

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const { colors, cardShadow, themeMode, setThemeMode } = useTheme();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleOpenGitHub = useCallback(() => {
    Linking.openURL(DEVELOPER.githubUrl).catch(() =>
      Alert.alert("Error", "Could not open GitHub"),
    );
  }, []);

  const handleOpenEmail = useCallback(() => {
    Linking.openURL(`mailto:${DEVELOPER.email}`).catch(() =>
      Alert.alert("Error", "Could not open email client"),
    );
  }, []);

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

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const themeOptions: Array<{ label: string; value: "system" | "light" | "dark"; icon: keyof typeof Ionicons.glyphMap }> = [
    { label: "System", value: "system", icon: "phone-portrait-outline" },
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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

        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>Appearance</H3>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const isActive = themeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => setThemeMode(opt.value)}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surfaceAlt,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={opt.icon}
                    size={20}
                    color={isActive ? colors.textInverse : colors.textSecondary}
                  />
                  <Caption
                    style={{
                      marginTop: 6,
                      color: isActive ? colors.textInverse : colors.textSecondary,
                      fontWeight: isActive ? "700" : "500",
                    }}
                  >
                    {opt.label}
                  </Caption>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <H3 style={styles.sectionTitle}>About Developer</H3>

          <TouchableOpacity
            style={[styles.devRow, { borderBottomColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handleOpenGitHub}
          >
            <View style={[styles.devIcon, { backgroundColor: "#24292E" }]}>
              <Ionicons name="logo-github" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.devInfo}>
              <BodySemibold>{DEVELOPER.name}</BodySemibold>
              <Caption dim>@{DEVELOPER.github}</Caption>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.devRow}
            activeOpacity={0.7}
            onPress={handleOpenEmail}
          >
            <View style={[styles.devIcon, { backgroundColor: colors.primary }]}>
              <Ionicons name="mail-outline" size={20} color={colors.textInverse} />
            </View>
            <View style={styles.devInfo}>
              <BodySemibold>Email</BodySemibold>
              <Caption dim>{DEVELOPER.email}</Caption>
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

        <Caption align="center" dim>
          {`NutriSnap v${appVersion}`}
        </Caption>
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
  themeRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  themeOption: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  devIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  devInfo: {
    flex: 1,
  },
  signOutButton: { marginBottom: 24 },
});