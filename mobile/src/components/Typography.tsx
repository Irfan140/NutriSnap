import { Text as RNText, type TextProps, type TextStyle } from "react-native";
import { useTheme, typography, type TypographyPreset, type AppColors } from "@/src/theme/index";

// ── Typography component ────────────────────────────────────────

interface TypographyProps extends TextProps {
  preset?: TypographyPreset;
  color?: keyof AppColors | string;
  align?: "left" | "center" | "right";
  dim?: boolean;
}

export function Typography({
  preset = "body",
  color,
  align,
  dim,
  style,
  children,
  ...rest
}: TypographyProps) {
  const { colors } = useTheme();
  const presetStyle: TextStyle = typography[preset];

  const resolvedColor = color
    ? (colors[color as keyof AppColors] as string | undefined) ?? color
    : preset.startsWith("heading") || preset === "brand" || preset === "score"
      ? colors.textPrimary
      : dim
        ? colors.textMuted
        : preset === "subtitle"
          ? colors.textSecondary
          : colors.textSecondary;

  return (
    <RNText
      style={[
        presetStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
}

// ── Convenience wrappers ────────────────────────────────────────

export function H1(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="heading1" {...props} />;
}

export function H2(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="heading2" {...props} />;
}

export function H3(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="heading3" {...props} />;
}

export function Subtitle(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="subtitle" {...props} />;
}

export function Body(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="body" {...props} />;
}

export function BodySemibold(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="bodySemibold" {...props} />;
}

export function Caption(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="caption" {...props} />;
}

export function Brand(props: Omit<TypographyProps, "preset">) {
  return <Typography preset="brand" {...props} />;
}