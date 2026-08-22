import { Pressable, StyleSheet, View } from "react-native";
import PrimaryButton from "@/src/components/PrimaryButton";
import { Body, H3, Typography } from "@/src/components/Typography";
import { radius, spacing, useTheme } from "@/src/theme/index";
import { useOTAUpdate } from "@/src/hooks/useOTAUpdate";

export default function OTAUpdatePrompt({ children }: { children: React.ReactNode }) {
  const { colors, cardShadow } = useTheme();
  const { isUpdateReady, isReloading, dismissUpdate, reloadForUpdate } = useOTAUpdate();

  return (
    <View style={styles.root}>
      {children}
      {isUpdateReady ? (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View
            style={[
              styles.card,
              cardShadow,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <H3>New version available</H3>
            <Body style={styles.message}>
              An update is ready. Restart NutriSnap to apply it.
            </Body>
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                onPress={dismissUpdate}
                style={styles.later}
              >
                <Typography style={{ color: colors.textSecondary }}>Later</Typography>
              </Pressable>
              <PrimaryButton
                label="Update now"
                onPress={() => void reloadForUpdate()}
                loading={isReloading}
                style={styles.updateButton}
              />
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 96,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  message: {
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  later: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  updateButton: {
    minWidth: 132,
    height: 48,
  },
});
