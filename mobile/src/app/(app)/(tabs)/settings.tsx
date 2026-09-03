import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Haptics from "expo-haptics";
import React, { useCallback } from "react";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { H1, H3, Subtitle, Body, BodySemibold, Caption } from "@/src/components/Typography";
import { useTheme, radius } from "@/src/theme/index";

export default function SettingsScreen() {
  const { colors, cardShadow, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelectTheme = useCallback(
    (mode: "system" | "light" | "dark") => {
      if (mode !== themeMode) {
        void Haptics.selectionAsync();
        setThemeMode(mode);
      }
    },
    [themeMode, setThemeMode],
  );

  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  const themeOptions: {
    label: string;
    value: "system" | "light" | "dark";
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { label: "System", value: "system", icon: "phone-portrait-outline" },
    { label: "Light", value: "light", icon: "sunny-outline" },
    { label: "Dark", value: "dark", icon: "moon-outline" },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 88 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <H1>Settings</H1>
          <Subtitle style={{ marginTop: 4 }}>Customize your experience</Subtitle>
        </View>

        {/* Appearance Section */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIcon, { backgroundColor: colors.primarySoft }]}
            >
              <Ionicons
                name="contrast-outline"
                size={18}
                color={colors.primaryDark}
              />
            </View>
            <View style={styles.sectionHeaderText}>
              <H3>Appearance</H3>
              <Caption dim>Applies instantly, no restart needed</Caption>
            </View>
          </View>
          <View style={styles.themeRow}>
            {themeOptions.map((opt) => {
              const isActive = themeMode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.7}
                  onPress={() => handleSelectTheme(opt.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isActive }}
                  accessibilityLabel={`${opt.label} theme`}
                  accessibilityHint={
                    isActive ? "Selected theme" : `Switch to ${opt.label} theme`
                  }
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
                  {isActive ? (
                    <View style={styles.themeCheck}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={colors.textInverse}
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* App Info */}
        <View style={[styles.card, { backgroundColor: colors.surface }, cardShadow]}>
          <View style={styles.sectionHeader}>
            <View
              style={[styles.sectionIcon, { backgroundColor: colors.accentSoft }]}
            >
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.accent}
              />
            </View>
            <View style={styles.sectionHeaderText}>
              <H3>App Info</H3>
              <Caption dim>Updates install automatically on restart</Caption>
            </View>
          </View>
          <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
            <View style={styles.infoLabel}>
              <Ionicons
                name="cube-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Body style={{ marginLeft: 10 }}>App Name</Body>
            </View>
            <BodySemibold>NutriSnap</BodySemibold>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
              <Ionicons
                name="git-branch-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Body style={{ marginLeft: 10 }}>Version</Body>
            </View>
            <BodySemibold>{`v${appVersion}`}</BodySemibold>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { marginBottom: 24 },
  card: {
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
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
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  themeCheck: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
});