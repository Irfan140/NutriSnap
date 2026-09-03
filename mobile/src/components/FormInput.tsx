import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type ReturnKeyTypeOptions,
  type TextInputProps,
} from "react-native";
import { useTheme } from "@/src/theme/index";
import { radius } from "@/src/theme/index";
import { Typography, Caption } from "@/src/components/Typography";

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
  centerText?: boolean;
  returnKeyType?: ReturnKeyTypeOptions;
  textContentType?: TextInputProps["textContentType"];
  autoCorrect?: boolean;
  editable?: boolean;
  onSubmitEditing?: () => void;
}

export default function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  secureTextEntry = false,
  keyboardType,
  autoCapitalize = "none",
  maxLength,
  centerText = false,
  returnKeyType,
  textContentType,
  autoCorrect = false,
  editable = true,
  onSubmitEditing,
}: FormInputProps) {
  const { colors, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const inputBg = focused ? colors.surface : colors.inputBg;
  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.container}>
      <Caption style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
        {label}
      </Caption>
      <View
        style={[
          styles.inputShell,
          { backgroundColor: inputBg, borderColor },
        ]}
      >
        {icon && !centerText ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? colors.primary : colors.textMuted}
            style={styles.icon}
          />
        ) : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          autoCorrect={autoCorrect}
          editable={editable}
          onSubmitEditing={onSubmitEditing}
          selectionColor={colors.primary}
          accessible
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            { color: colors.textPrimary },
            centerText && styles.inputCentered,
          ]}
        />
      </View>
      {error ? (
        <Typography
          preset="caption"
          color="danger"
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500",
  },
  inputCentered: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 6,
  },
  error: {
    marginTop: 6,
  },
});
