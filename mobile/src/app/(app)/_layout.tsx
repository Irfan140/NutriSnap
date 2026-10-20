import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { authClient } from "@/src/lib/auth";
import { useTheme } from "@/src/theme/index";

const Layout = () => {
  const { data: session, isPending } = authClient.useSession();
  const { colors } = useTheme();

  if (isPending) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="meal/[id]"
        options={{
          title: "Meal details",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.textPrimary },
        }}
      />
    </Stack>
  );
};

export default Layout;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
