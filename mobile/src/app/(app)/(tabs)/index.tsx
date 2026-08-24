import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import {
  H1,
  H3,
  Body,
  BodySemibold,
  Caption,
} from "@/src/components/Typography";
import {
  analyzeResponseSchema,
  apiErrorSchema,
  extractJsonBlock,
  extractMarkdown,
  hasJsonBlock,
  parseNutritionData,
  type NutritionData,
} from "@/src/lib/nutrition";
import { useTheme, radius, healthScoreColor, scoreLabel } from "@/src/theme/index";
import { env } from "@/src/config/env";

const SERVER_URL = env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
const ANALYZE_URL = SERVER_URL ? `${SERVER_URL}/api/aifood` : undefined;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024;

interface MacroRowProps {
  colors: ReturnType<typeof useTheme>["colors"];
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
}

function MacroRow({ colors, icon, tint, label, value }: MacroRowProps) {
  return (
    <View
      style={[
        styles.macroRow,
        { borderBottomColor: colors.border },
      ]}
    >
      <View
        style={[
          styles.macroIcon,
          { backgroundColor: `${tint}1F` },
        ]}
      >
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <BodySemibold style={styles.macroLabel}>{label}</BodySemibold>
      <BodySemibold style={styles.macroValue}>{value}</BodySemibold>
    </View>
  );
}

export default function HomeScreen() {
  const { getToken, signOut } = useAuth();
  const { colors, cardShadow, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);

  const resetResults = () => {
    setMarkdown("");
    setErrorMessage(null);
    setNutrition(null);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setBase64Image(null);
    resetResults();
  };

  const showFailure = (message: string) => {
    setErrorMessage(message);
    setMarkdown("");
    setNutrition(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Permission is required to access the photo library."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.25,
      allowsEditing: true,
      base64: true,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
      resetResults();
    }
  };

  const uploadToServer = async () => {
    if (!base64Image) return;
    if (!ANALYZE_URL) {
      showFailure(
        "Server URL is missing. Set EXPO_PUBLIC_SERVER_URL in your environment and restart Expo."
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      if (base64Image.length > MAX_IMAGE_BASE64_LENGTH) {
        showFailure(
          "This image is too large to analyze. Please choose a smaller or lower-resolution photo."
        );
        return;
      }

      const token = await getToken();
      if (!token) {
        showFailure("Your session has expired. Please sign in again.");
        await signOut();
        return;
      }

      const res = await fetch(ANALYZE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (res.status === 401) {
        showFailure("Your session has expired. Please sign in again.");
        await signOut();
        return;
      }

      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        showFailure(
          `The server returned an unexpected response (${res.status}). Please try again.`
        );
        return;
      }

      if (!res.ok) {
        const parsedError = apiErrorSchema.safeParse(payload);
        showFailure(
          parsedError.success ? parsedError.data.error : "Error analyzing image"
        );
        return;
      }

      const parsedResponse = analyzeResponseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        showFailure(
          "The AI returned data in an unexpected format. Please try again with a clearer food image."
        );
        return;
      }

      const message = parsedResponse.data.message;
      const rawNutrition = extractJsonBlock(message);

      if (hasJsonBlock(message) && rawNutrition === null) {
        showFailure(
          "The AI returned data in an unexpected format. Please try again with a clearer food image."
        );
        return;
      }

      if (rawNutrition !== null) {
        const parsedNutrition = parseNutritionData(rawNutrition);
        if (parsedNutrition === null) {
          showFailure(
            "The AI returned data in an unexpected format. Please try again with a clearer food image."
          );
          return;
        }
        setNutrition(parsedNutrition);
      }

      setMarkdown(extractMarkdown(message));
    } catch (err) {
      console.error(err);
      showFailure(
        `Could not reach the analysis server at ${ANALYZE_URL}. Make sure the backend is running and your phone can reach that IP address.`
      );
    } finally {
      setLoading(false);
    }
  };

  const markdownStyles = StyleSheet.create({
    body: { fontSize: 15, lineHeight: 24, color: colors.textSecondary },
    heading1: {
      fontSize: 22,
      fontWeight: "bold",
      marginTop: 20,
      color: colors.textPrimary,
    },
    heading2: {
      fontSize: 20,
      fontWeight: "600",
      marginTop: 16,
      color: colors.textPrimary,
    },
    strong: { fontWeight: "700", color: colors.textPrimary },
    list_item: { marginBottom: 8 },
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: colors.primary },
            ]}
          >
            <Ionicons name="leaf" size={22} color={colors.textInverse} />
          </View>
          <H1>NutriSnap</H1>
          <Body align="center" style={{ marginTop: 6 }}>
            Snap a meal and get instant nutrition insights
          </Body>
        </View>

        {selectedImage ? (
          <View style={styles.previewCard}>
            <Image
              source={{ uri: selectedImage }}
              style={[
                styles.previewImage,
                { backgroundColor: colors.border },
                cardShadow,
              ]}
            />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={15} color="#FFFFFF" />
              <Caption style={{ color: "#FFFFFF", marginLeft: 6 }}>
                Change photo
              </Caption>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.pickerZone,
              {
                backgroundColor: colors.surface,
                borderColor: colors.primarySoft,
              },
            ]}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.pickerIconWrap,
                { backgroundColor: colors.primarySoft },
              ]}
            >
              <Ionicons name="camera-outline" size={30} color={colors.primary} />
            </View>
            <H3 style={{ marginBottom: 6 }}>Choose a meal photo</H3>
            <Caption align="center" dim>
              Pick a clear photo from your gallery to analyze
            </Caption>
          </TouchableOpacity>
        )}

        <PrimaryButton
          label={loading ? "Analyzing..." : "Analyze meal"}
          icon={loading ? undefined : "sparkles-outline"}
          onPress={uploadToServer}
          disabled={!base64Image || loading}
          loading={loading}
          style={styles.analyzeButton}
        />

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <BodySemibold style={{ marginLeft: 10 }}>
              Crunching the nutrition numbers...
            </BodySemibold>
          </View>
        ) : null}

        {errorMessage ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.dangerSoft,
                borderColor: colors.dangerDark + "20",
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={colors.danger}
            />
            <Caption
              style={{ flex: 1, marginLeft: 10, color: colors.dangerDark }}
            >
              {errorMessage}
            </Caption>
          </View>
        ) : null}

        {nutrition ? (
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.surface },
              cardShadow,
            ]}
          >
            <H3 style={{ marginBottom: 20 }}>Nutrition Summary</H3>

            <View style={styles.scoreWrap}>
              <AnimatedCircularProgress
                size={150}
                width={13}
                fill={nutrition.healthScore}
                tintColor={healthScoreColor(nutrition.healthScore, colors)}
                backgroundColor={colors.border}
                lineCap="round"
              >
                {(fill: number) => (
                  <View style={styles.scoreInner}>
                    <BodySemibold
                      style={{
                        fontSize: 30,
                        fontWeight: "800",
                        color: colors.textPrimary,
                      }}
                    >
                      {Math.round(fill)}
                    </BodySemibold>
                    <Caption dim>/ 100</Caption>
                  </View>
                )}
              </AnimatedCircularProgress>
              <BodySemibold
                style={{
                  marginTop: 14,
                  color: colors.primaryDark,
                }}
              >
                {scoreLabel(nutrition.healthScore)}
              </BodySemibold>
              {nutrition.explanation !== "" ? (
                <Body
                  align="center"
                  style={{ marginTop: 6, fontSize: 13.5 }}
                >
                  {nutrition.explanation}
                </Body>
              ) : null}
            </View>

            <View style={styles.macroList}>
              <MacroRow
                colors={colors}
                icon="flame"
                tint="#F97316"
                label="Calories"
                value={`${nutrition.calories} kcal`}
              />
              <MacroRow
                colors={colors}
                icon="fitness"
                tint="#10B981"
                label="Protein"
                value={`${nutrition.protein} g`}
              />
              <MacroRow
                colors={colors}
                icon="pizza"
                tint="#EAB308"
                label="Carbohydrates"
                value={`${nutrition.carbohydrates} g`}
              />
              <MacroRow
                colors={colors}
                icon="egg-outline"
                tint="#EF4444"
                label="Fat"
                value={`${nutrition.fat} g`}
              />
              <MacroRow
                colors={colors}
                icon="leaf"
                tint="#22C55E"
                label="Fiber"
                value={`${nutrition.fiber} g`}
              />
            </View>

            {nutrition.vitamins.length > 0 ? (
              <>
                <BodySemibold
                  style={{ marginTop: 16, marginBottom: 10 }}
                >
                  Vitamins & Minerals
                </BodySemibold>
                <View style={styles.vitaminChips}>
                  {nutrition.vitamins.map((vitamin, index) => (
                    <View
                      key={`${vitamin}-${index}`}
                      style={[
                        styles.vitaminChip,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Ionicons
                        name="sparkles"
                        size={12}
                        color={colors.primaryDark}
                      />
                      <Caption
                        style={{
                          fontWeight: "600",
                          color: colors.primaryDark,
                          marginLeft: 5,
                        }}
                      >
                        {vitamin}
                      </Caption>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {markdown !== "" ? (
          <View
            style={[
              styles.markdownCard,
              { backgroundColor: colors.surface },
              cardShadow,
            ]}
          >
            <Markdown
              markdownit={MarkdownIt({
                typographer: true,
                breaks: true,
                linkify: true,
              })}
              style={markdownStyles}
            >
              {markdown}
            </Markdown>
          </View>
        ) : null}

        {nutrition || markdown !== "" ? (
          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                borderColor: colors.primary,
                backgroundColor: isDark ? "transparent" : colors.primaryMuted,
              },
            ]}
            activeOpacity={0.7}
            onPress={handleReset}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <BodySemibold style={{ color: colors.primary }}>New Scan</BodySemibold>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* Theme toggle button */}
      <TouchableOpacity
        style={[
          styles.themeToggle,
          { backgroundColor: colors.surface },
          cardShadow,
        ]}
        activeOpacity={0.7}
        onPress={() => setThemeMode(isDark ? "light" : "dark")}
      >
        <Ionicons
          name={isDark ? "sunny-outline" : "moon-outline"}
          size={22}
          color={isDark ? "#FBBF24" : colors.primaryDark}
        />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  headerBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#059669",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 5,
  },
  previewCard: { marginBottom: 16 },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: radius.xl,
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  pickerZone: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  pickerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  analyzeButton: { marginBottom: 8 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  summaryCard: {
    borderRadius: radius.xl,
    padding: 24,
    marginTop: 16,
  },
  scoreWrap: { alignItems: "center", marginBottom: 24 },
  scoreInner: { alignItems: "center" },
  macroList: { marginBottom: 8 },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  macroIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  macroLabel: { flex: 1 },
  macroValue: {},
  vitaminChips: { flexDirection: "row", flexWrap: "wrap" },
  vitaminChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  markdownCard: {
    borderRadius: radius.xl,
    padding: 24,
    marginTop: 16,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
    marginTop: 20,
  },
  themeToggle: {
    position: "absolute",
    top: 60,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});