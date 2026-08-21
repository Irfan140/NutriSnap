import { useAuth, useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import { cardShadow, colors, radius } from "@/src/theme";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

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

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your account details</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarRing}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          {memberSince ? (
            <View style={styles.memberChip}>
              <Ionicons name="calendar-outline" size={13} color={colors.primaryDark} />
              <Text style={styles.memberChipText}>{`Member since ${memberSince}`}</Text>
            </View>
          ) : null}
        </View>

        <PrimaryButton
          label="Sign Out"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <Text style={styles.version}>{`NutriSnap v${appVersion}`}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  title: { fontSize: 30, fontWeight: "800", color: colors.textPrimary },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 28,
    alignItems: "center",
    ...cardShadow,
    marginBottom: 24,
  },
  avatarRing: {
    padding: 5,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    marginBottom: 16,
  },
  avatar: { width: 96, height: 96, borderRadius: radius.full },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 32, fontWeight: "800", color: colors.white },
  name: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: "center",
  },
  email: { fontSize: 15, color: colors.textSecondary, textAlign: "center" },
  memberChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 14,
  },
  memberChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.primaryDark,
    marginLeft: 6,
  },
  signOutButton: { marginBottom: 24 },
  version: { textAlign: "center", fontSize: 13, color: colors.textMuted },
});
