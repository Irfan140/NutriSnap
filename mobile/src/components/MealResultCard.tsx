import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
import { Body, BodySemibold, Caption, H3 } from "@/src/components/Typography";
import type { NutritionData } from "@/src/lib/nutrition";
import { healthScoreColor, radius, scoreLabel, useTheme } from "@/src/theme/index";

interface MacroRowProps {
  colors: ReturnType<typeof useTheme>["colors"];
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
}

function MacroRow({ colors, icon, tint, label, value }: MacroRowProps) {
  return (
    <View style={[styles.macroRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.macroIcon, { backgroundColor: `${tint}1F` }]}>
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <BodySemibold style={styles.macroLabel}>{label}</BodySemibold>
      <BodySemibold style={styles.macroValue}>{value}</BodySemibold>
    </View>
  );
}

export interface MealResultCardProps {
  readonly nutrition: NutritionData | null;
  readonly markdown: string;
}

/**
 * Renders a full analysis result: score circle, macro rows, vitamin chips
 * and the Markdown guidance. Shared by Home (fresh analysis) and the meal
 * detail screen (history).
 */
export default function MealResultCard({ nutrition, markdown }: MealResultCardProps) {
  const { colors, cardShadow } = useTheme();

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
    <>
      {nutrition ? (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface }, cardShadow]}>
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
              <Body align="center" style={{ marginTop: 6, fontSize: 13.5 }}>
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
              <BodySemibold style={{ marginTop: 16, marginBottom: 10 }}>
                Vitamins & Minerals
              </BodySemibold>
              <View style={styles.vitaminChips}>
                {nutrition.vitamins.map((vitamin, index) => (
                  <View
                    key={`${vitamin}-${index}`}
                    style={[styles.vitaminChip, { backgroundColor: colors.primarySoft }]}
                  >
                    <Ionicons name="sparkles" size={12} color={colors.primaryDark} />
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
        <View style={[styles.markdownCard, { backgroundColor: colors.surface }, cardShadow]}>
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
    </>
  );
}

const styles = StyleSheet.create({
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
});
