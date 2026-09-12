import { useAuth } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "@/src/components/PrimaryButton";
import MealResultCard from "@/src/components/MealResultCard";
import {
  H1,
  H3,
  Body,
  BodySemibold,
  Caption,
} from "@/src/components/Typography";
import {
  extractJsonBlock,
  extractMarkdown,
  hasJsonBlock,
  parseNutritionData,
  type NutritionData,
} from "@/src/lib/nutrition";
import { useTheme, radius } from "@/src/theme/index";
import { useAnalyzeMeal } from "@/src/hooks/useAnalyzeMeal";
import { UserFacingError } from "@/src/lib/meals-api";
import { isAuthExpired } from "@/src/lib/query-client";

const LOADING_MESSAGES = [
  "Uploading your photo…",
  "AI is analyzing your meal…",
  "Plating up your results…",
];

interface HowToStepProps {
  colors: ReturnType<typeof useTheme>["colors"];
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  description: string;
  isLast?: boolean;
}

function HowToStep({ colors, icon, tint, title, description, isLast = false }: HowToStepProps) {
  return (
    <View
      style={[
        styles.howToRow,
        !isLast && {
          borderBottomColor: colors.border,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={[styles.howToIcon, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={styles.howToText}>
        <BodySemibold>{title}</BodySemibold>
        <Caption dim>{description}</Caption>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const { colors, cardShadow, buttonShadow, isDark, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const attemptRef = useRef(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const errorModalAnim = useRef(new Animated.Value(0)).current;
  const [markdown, setMarkdown] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nutrition, setNutrition] = useState<NutritionData | null>(null);

  const analyzeMeal = useAnalyzeMeal();
  const loading = analyzeMeal.isPending;

  const resetResults = () => {
    setMarkdown("");
    setErrorMessage(null);
    setNutrition(null);
  };

  const handleReset = () => {
    void Haptics.selectionAsync();
    attemptRef.current += 1;
    setSelectedImage(null);
    setImageDims(null);
    resetResults();
  };

  const showFailure = (message: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setErrorMessage(message);
    setMarkdown("");
    setNutrition(null);
  };

  const dismissError = () => {
    setErrorMessage(null);
  };

  useEffect(() => {
    if (errorMessage === null) {
      return;
    }
    errorModalAnim.setValue(0);
    const enter = Animated.spring(errorModalAnim, {
      toValue: 1,
      friction: 8,
      tension: 90,
      useNativeDriver: true,
    });
    enter.start();
    return () => {
      enter.stop();
    };
  }, [errorMessage, errorModalAnim]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    pulseAnim.setValue(1);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    const id = setInterval(() => {
      setLoadingStep((s) => (s + 1) % LOADING_MESSAGES.length);
    }, 2600);
    return () => {
      clearInterval(id);
      pulse.stop();
    };
  }, [loading, pulseAnim]);

  const acceptPickedAsset = (asset: ImagePicker.ImagePickerAsset) => {
    attemptRef.current += 1;
    setSelectedImage(asset.uri);
    setImageDims(
      typeof asset.width === "number" && typeof asset.height === "number"
        ? { width: asset.width, height: asset.height }
        : null
    );
    resetResults();
    void Haptics.selectionAsync();
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
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      acceptPickedAsset(result.assets[0]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera access needed",
        "Allow camera access in Settings to snap meal photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: true,
    });

    if (!result.canceled) {
      acceptPickedAsset(result.assets[0]);
    }
  };

  const showSourceChooser = () => {
    if (loading) return;
    Alert.alert("Add meal photo", "Take a fresh photo or choose one from your gallery.", [
      { text: "Take photo", onPress: () => void takePhoto() },
      { text: "Choose from gallery", onPress: () => void pickImage() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadToServer = () => {
    if (!selectedImage) return;

    const attempt = attemptRef.current + 1;
    attemptRef.current = attempt;
    setErrorMessage(null);

    analyzeMeal.mutate(
      { uri: selectedImage, width: imageDims?.width, height: imageDims?.height },
      {
        onSuccess: (data) => {
          if (attemptRef.current !== attempt) return;
          const rawNutrition = extractJsonBlock(data.message);

          if (hasJsonBlock(data.message) && rawNutrition === null) {
            showFailure(
              "The AI returned data in an unexpected format. Please try again with a clearer food image.",
            );
            return;
          }

          if (rawNutrition !== null) {
            const parsedNutrition = parseNutritionData(rawNutrition);
            if (parsedNutrition === null) {
              showFailure(
                "The AI returned data in an unexpected format. Please try again with a clearer food image.",
              );
              return;
            }
            setNutrition(parsedNutrition);
          }

          setMarkdown(extractMarkdown(data.message));
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (err) => {
          if (attemptRef.current !== attempt) return;
          if (isAuthExpired(err)) {
            showFailure("Your session has expired. Please sign in again.");
            void signOut();
            return;
          }
          // Expected, user-facing failures (bad photo, timeouts) are shown
          // in the modal, not logged — only unexpected errors reach console.
          if (!(err instanceof UserFacingError)) {
            console.error(err);
          }
          showFailure(err instanceof Error ? err.message : "Error analyzing image. Please try again.");
        },
      },
    );
  };

  const handleRetryAnalysis = () => {
    setErrorMessage(null);
    void uploadToServer();
  };

  const modalCardScale = errorModalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              accessibilityRole="image"
              accessibilityLabel="Selected meal photo"
              style={[
                styles.previewImage,
                { backgroundColor: colors.border },
                cardShadow,
              ]}
            />
            <TouchableOpacity
              style={[styles.changePhotoButton, loading && { opacity: 0.6 }]}
              onPress={showSourceChooser}
              disabled={loading}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Change photo"
              accessibilityHint="Pick a different meal photo from your gallery"
              accessibilityState={{ disabled: loading }}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={15} color="#FFFFFF" />
              <Caption style={{ color: "#FFFFFF", marginLeft: 6 }}>
                Change photo
              </Caption>
            </TouchableOpacity>
          </View>
        ) : (
          <View
            style={[
              styles.howToCard,
              { backgroundColor: colors.surface },
              cardShadow,
            ]}
          >
            <H3 style={{ marginBottom: 4 }}>How it works</H3>
            <Caption dim style={{ marginBottom: 8 }}>
              Get nutrition insights in three quick steps
            </Caption>
            <HowToStep
              colors={colors}
              icon="camera-outline"
              tint="#0EA5E9"
              title="Add a meal photo"
              description="Tap the camera button below to snap a photo or pick one from your gallery"
            />
            <HowToStep
              colors={colors}
              icon="sparkles-outline"
              tint="#8B5CF6"
              title="Analyze it"
              description="Tap Analyze meal and let the AI do the rest"
            />
            <HowToStep
              colors={colors}
              icon="nutrition-outline"
              tint="#10B981"
              title="See your results"
              description="Calories, macros, vitamins and a health score"
              isLast
            />
          </View>
        )}

        {selectedImage ? (
          <PrimaryButton
            label={loading ? "Analyzing..." : "Analyze meal"}
            icon={loading ? undefined : "sparkles-outline"}
            onPress={uploadToServer}
            disabled={loading}
            accessibilityHint="Analyze the selected meal photo"
            style={styles.analyzeButton}
          />
        ) : null}

        {loading ? (
          <View
            accessibilityLiveRegion="polite"
            style={[
              styles.loadingCard,
              { backgroundColor: colors.surface },
              cardShadow,
            ]}
          >
            <Animated.View
              style={[
                styles.loadingPulse,
                {
                  backgroundColor: colors.primarySoft,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <ActivityIndicator size="large" color={colors.primary} />
            </Animated.View>
            <BodySemibold style={{ marginTop: 14 }}>
              {LOADING_MESSAGES[loadingStep]}
            </BodySemibold>
            <Caption dim align="center" style={{ marginTop: 4 }}>
              This usually takes a few seconds
            </Caption>
          </View>
        ) : null}

        <Modal
          visible={errorMessage !== null}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={dismissError}
        >
          <View
            style={[
              styles.errorBackdrop,
              {
                backgroundColor: isDark
                  ? "rgba(0, 0, 0, 0.65)"
                  : "rgba(15, 23, 42, 0.55)",
              },
            ]}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={dismissError}
              accessibilityRole="button"
              accessibilityLabel="Dismiss error"
            />
            <Animated.View
              accessibilityRole="alert"
              style={[
                styles.errorCard,
                { backgroundColor: colors.surface },
                cardShadow,
                {
                  opacity: errorModalAnim,
                  transform: [{ scale: modalCardScale }],
                },
              ]}
            >
              <View
                style={[
                  styles.errorIcon,
                  { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={28}
                  color={colors.danger}
                />
              </View>
              <H3 align="center" style={{ marginTop: 14 }}>
                Something went wrong
              </H3>
              <Body align="center" selectable style={{ marginTop: 8 }}>
                {errorMessage ?? ""}
              </Body>
              <View style={styles.errorActions}>
                <TouchableOpacity
                  style={[
                    styles.errorCloseButton,
                    { borderColor: colors.border },
                  ]}
                  activeOpacity={0.7}
                  onPress={dismissError}
                  accessibilityRole="button"
                  accessibilityLabel="Close error"
                  hitSlop={4}
                >
                  <BodySemibold>Close</BodySemibold>
                </TouchableOpacity>
                <PrimaryButton
                  label="Try Again"
                  icon="refresh-outline"
                  onPress={handleRetryAnalysis}
                  accessibilityHint="Retry analyzing the selected meal photo"
                  style={styles.errorRetryButton}
                />
              </View>
            </Animated.View>
          </View>
        </Modal>

        <MealResultCard nutrition={nutrition} markdown={markdown} />

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
            accessibilityRole="button"
            accessibilityLabel="Start a new scan"
            accessibilityHint="Clears the current result and photo"
            hitSlop={4}
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
        onPress={() => {
          void Haptics.selectionAsync();
          setThemeMode(isDark ? "light" : "dark");
        }}
        accessibilityRole="button"
        accessibilityLabel={isDark ? "Switch to light theme" : "Switch to dark theme"}
        hitSlop={8}
      >
        <Ionicons
          name={isDark ? "sunny-outline" : "moon-outline"}
          size={22}
          color={isDark ? "#FBBF24" : colors.primaryDark}
        />
      </TouchableOpacity>

      {/* Photo picker FAB — floats above the tab bar */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: insets.bottom + 104,
            opacity: loading ? 0.6 : 1,
          },
          buttonShadow,
        ]}
        onPress={showSourceChooser}
        disabled={loading}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={selectedImage ? "Change photo" : "Add meal photo"}
        accessibilityHint="Lets you take a fresh photo or pick one from your gallery"
        accessibilityState={{ disabled: loading }}
        hitSlop={4}
      >
        <Ionicons name="camera" size={26} color={colors.textInverse} />
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
  howToCard: {
    borderRadius: radius.xl,
    padding: 24,
    marginBottom: 16,
  },
  howToRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  howToIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  howToText: {
    flex: 1,
    gap: 2,
  },
  analyzeButton: { marginBottom: 8 },
  loadingCard: {
    alignItems: "center",
    borderRadius: radius.xl,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  loadingPulse: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  errorCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: radius.xl,
    padding: 24,
    alignItems: "center",
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  errorActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    width: "100%",
  },
  errorCloseButton: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  errorRetryButton: {
    flex: 1,
    height: 50,
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
  fab: {
    position: "absolute",
    right: 20,
    width: 60,
    height: 60,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});