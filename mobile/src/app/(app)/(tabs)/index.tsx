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
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import {
  analyzeResponseSchema,
  apiErrorSchema,
  extractJsonBlock,
  extractMarkdown,
  hasJsonBlock,
  parseNutritionData,
  type NutritionData,
} from "@/src/lib/nutrition";
import { cardShadow, colors, healthScoreColor, radius, scoreLabel } from "@/src/theme";

const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL?.replace(/\/$/, "");
const ANALYZE_URL = SERVER_URL ? `${SERVER_URL}/api/aifood` : undefined;
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024; // ~8 MB base64 (~6 MB raw image)

interface MacroRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
}

function MacroRow({ icon, tint, label, value }: MacroRowProps) {
  return (
    <View style={styles.macroRow}>
      <View style={[styles.macroIcon, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>{value}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const { getToken, signOut } = useAuth();
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

  const showFailure = (message: string) => {
    setErrorMessage(message);
    setMarkdown("");
    setNutrition(null);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Permission is required to access the photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
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
      showFailure("Server URL is missing. Set EXPO_PUBLIC_SERVER_URL in .env.local and restart Expo.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      if (base64Image.length > MAX_IMAGE_BASE64_LENGTH) {
        showFailure("This image is too large to analyze. Please choose a smaller or lower-resolution photo.");
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
        showFailure(`The server returned an unexpected response (${res.status}). Please try again.`);
        return;
      }

      if (!res.ok) {
        const parsedError = apiErrorSchema.safeParse(payload);
        showFailure(parsedError.success ? parsedError.data.error : "Error analyzing image");
        return;
      }

      const parsedResponse = analyzeResponseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        showFailure("The AI returned data in an unexpected format. Please try again with a clearer food image.");
        return;
      }

      const message = parsedResponse.data.message;
      const rawNutrition = extractJsonBlock(message);

      if (hasJsonBlock(message) && rawNutrition === null) {
        showFailure("The AI returned data in an unexpected format. Please try again with a clearer food image.");
        return;
      }

      if (rawNutrition !== null) {
        const parsedNutrition = parseNutritionData(rawNutrition);
        if (parsedNutrition === null) {
          showFailure("The AI returned data in an unexpected format. Please try again with a clearer food image.");
          return;
        }
        setNutrition(parsedNutrition);
      }

      setMarkdown(extractMarkdown(message));
    } catch (err) {
      console.error(err);
      showFailure(
        `Could not reach the analysis server at ${ANALYZE_URL}. Make sure the backend is running and your phone can reach that IP address.`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerBadge}>
            <Ionicons name="leaf" size={22} color={colors.white} />
          </View>
          <Text style={styles.title}>NutriSnap</Text>
          <Text style={styles.subtitle}>
            Snap a meal and get instant nutrition insights
          </Text>
        </View>

        {selectedImage ? (
          <View style={styles.previewCard}>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={pickImage}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={15} color={colors.white} />
              <Text style={styles.changePhotoText}>Change photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.pickerZone}
            onPress={pickImage}
            activeOpacity={0.85}
          >
            <View style={styles.pickerIconWrap}>
              <Ionicons name="camera-outline" size={30} color={colors.primary} />
            </View>
            <Text style={styles.pickerTitle}>Choose a meal photo</Text>
            <Text style={styles.pickerHint}>
              Pick a clear photo from your gallery to analyze
            </Text>
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
            <Text style={styles.loadingText}>Crunching the nutrition numbers…</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {nutrition ? (
          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Nutrition Summary</Text>

            <View style={styles.scoreWrap}>
              <AnimatedCircularProgress
                size={150}
                width={13}
                fill={nutrition.healthScore}
                tintColor={healthScoreColor(nutrition.healthScore)}
                backgroundColor={colors.border}
                lineCap="round"
              >
                {(fill: number) => (
                  <View style={styles.scoreInner}>
                    <Text style={styles.scoreValue}>{Math.round(fill)}</Text>
                    <Text style={styles.scoreCaption}>/ 100</Text>
                  </View>
                )}
              </AnimatedCircularProgress>
              <Text style={styles.scoreBadge}>{scoreLabel(nutrition.healthScore)}</Text>
              {nutrition.explanation !== "" ? (
                <Text style={styles.scoreExplanation}>{nutrition.explanation}</Text>
              ) : null}
            </View>

            <View style={styles.macroList}>
              <MacroRow icon="flame" tint="#F97316" label="Calories" value={`${nutrition.calories} kcal`} />
              <MacroRow icon="fitness" tint="#10B981" label="Protein" value={`${nutrition.protein} g`} />
              <MacroRow icon="pizza" tint="#EAB308" label="Carbohydrates" value={`${nutrition.carbohydrates} g`} />
              <MacroRow icon="egg-outline" tint="#EF4444" label="Fat" value={`${nutrition.fat} g`} />
              <MacroRow icon="leaf" tint="#22C55E" label="Fiber" value={`${nutrition.fiber} g`} />
            </View>

            {nutrition.vitamins.length > 0 ? (
              <>
                <Text style={styles.vitaminsTitle}>Vitamins & Minerals</Text>
                <View style={styles.vitaminChips}>
                  {nutrition.vitamins.map((vitamin, index) => (
                    <View key={`${vitamin}-${index}`} style={styles.vitaminChip}>
                      <Ionicons name="sparkles" size={12} color={colors.primaryDark} />
                      <Text style={styles.vitaminChipText}>{vitamin}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>
        ) : null}

        {markdown !== "" ? (
          <View style={styles.markdownCard}>
            <Markdown
              markdownit={MarkdownIt({ typographer: true, breaks: true, linkify: true })}
              style={markdownStyles}
            >
              {markdown}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  header: { alignItems: "center", marginBottom: 24 },
  headerBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  title: { fontSize: 28, fontWeight: "800", color: colors.textPrimary },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  previewCard: { marginBottom: 16 },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: radius.xl,
    backgroundColor: colors.border,
    ...cardShadow,
  },
  changePhotoButton: {
    position: "absolute",
    bottom: 14,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17, 24, 39, 0.75)",
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  changePhotoText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  pickerZone: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
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
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pickerTitle: { fontSize: 17, fontWeight: "700", color: colors.textPrimary },
  pickerHint: {
    fontSize: 13.5,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
  },
  analyzeButton: { marginBottom: 8 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 16,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 20,
    color: colors.dangerDark,
    fontWeight: "500",
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    marginTop: 16,
    ...cardShadow,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: 20,
  },
  scoreWrap: { alignItems: "center", marginBottom: 24 },
  scoreInner: { alignItems: "center" },
  scoreValue: { fontSize: 30, fontWeight: "800", color: colors.textPrimary },
  scoreCaption: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  scoreBadge: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  scoreExplanation: {
    marginTop: 6,
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 19,
  },
  macroList: { marginBottom: 8 },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  macroIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  macroLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textSecondary },
  macroValue: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  vitaminsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 10,
  },
  vitaminChips: { flexDirection: "row", flexWrap: "wrap" },
  vitaminChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    marginBottom: 8,
  },
  vitaminChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: colors.primaryDark,
    marginLeft: 5,
  },
  markdownCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: 24,
    marginTop: 16,
    ...cardShadow,
  },
});
