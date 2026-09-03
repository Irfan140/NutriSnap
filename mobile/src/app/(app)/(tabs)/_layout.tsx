import AntDesign from "@expo/vector-icons/AntDesign";
import { Tabs } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/theme/index";

const Layout = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          void Haptics.selectionAsync();
        },
      }}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: colors.textInverse,
        tabBarInactiveTintColor: isDark ? "#94A3B8" : colors.textMuted,
        tabBarActiveBackgroundColor: colors.primary,
        // The library paints the active background on its inner button as a
        // square — these styles sit on the outer item and clip it into a
        // floating rounded capsule. Icons are returned bare (no wrapper View)
        // because wrappers prevent glyphs from painting in this slot.
        tabBarItemStyle: {
          borderRadius: 999,
          marginHorizontal: 6,
          overflow: "hidden",
        },
        tabBarStyle: {
          position: "absolute",
          bottom: insets.bottom + 10,
          left: 16,
          right: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 36,
          elevation: 12,
          shadowColor: isDark ? "#000" : colors.primaryDark,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 16,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="setting" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
};

export default Layout;
