import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from "react-native";
import { useTheme, radius } from "@/src/theme/index";
import { Typography } from "@/src/components/Typography";

type Variant = "primary" | "danger" | "outline";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function PrimaryButton({
  label,
  onPress,
  icon,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}: PrimaryButtonProps) {
  const { colors, buttonShadow, isDark } = useTheme();
  const isDisabled = disabled || loading;

  const bgMap: Record<Variant, string> = {
    primary: colors.primary,
    danger: colors.danger,
    outline: "transparent",
  };

  const fgMap: Record<Variant, string> = {
    primary: colors.textInverse,
    danger: colors.textInverse,
    outline: colors.danger,
  };

  const foreground = fgMap[variant];
  const background = bgMap[variant];
  const isOutline = variant === "outline";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        {
          backgroundColor: background,
          borderColor: isOutline ? colors.danger : "transparent",
          opacity: isDisabled ? 0.55 : 1,
        },
        !isOutline && buttonShadow,
        isOutline && { borderWidth: 1.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {icon ? (
            <Ionicons name={icon} size={20} color={foreground} style={styles.icon} />
          ) : null}
          <Typography preset="button" style={{ color: foreground }}>
            {label}
          </Typography>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 54,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  icon: {
    marginRight: 8,
  },
});
