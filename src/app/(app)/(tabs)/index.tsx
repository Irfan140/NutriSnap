import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Markdown, { MarkdownIt } from "react-native-markdown-display";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { Ionicons } from "@expo/vector-icons";

type NutritionData = {
  Calories: number;
  Protein: number;
  Carbohydrates: number;
  Fat: number;
  Fiber: number;
  Explanation: string;
  "Health Score": number;
  "Key vitamins & minerals": string[];
};

export default function Index() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [jsonData, setjsonData] = useState<NutritionData | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access the photo library.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      base64: true,
    });

    if (!result.canceled) {
      console.log("first");
      setSelectedImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
      setResult("");
      setjsonData(null);
    }
  };

  function normalizeJsonData(data: any) {
    if (!data) return null;

    let vitamins: string[] = [];

    if (Array.isArray(data["Key vitamins & minerals"])) {
      vitamins = data["Key vitamins & minerals"];
    } else if (typeof data["Key vitamins & minerals"] === "object") {
      vitamins = Object.entries(data["Key vitamins & minerals"]).map(
        ([k, v]) => `${k}: ${v}`,
      );
    }

    return {
      ...data,
      "Key vitamins & minerals": vitamins,
    };
  }

  const uploadToServer = async () => {
    if (!base64Image) return;

    try {
      setLoading(true);

      const res = await fetch("/api/aifood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image }),
      });

      const data = await res.json();

      const jsonMatch = data.message.match(/```json([\s\S]*?)```/);
      console.log("jsonMatch:", jsonMatch);
      let resJson: NutritionData | null = null;

      if (jsonMatch) {
        let rawJson = jsonMatch[1].trim();

        // Remove redundant content
        rawJson = rawJson.replace(/\/\/.*$/gm, "");
        console.log("rawJson:", rawJson);
        try {
          resJson = JSON.parse(rawJson);
          console.log("resJson:", resJson);

          if (resJson) {
            const normalized = normalizeJsonData(resJson);
            console.log("normalized", normalized);
            setjsonData(normalized);
          }

          // setjsonData(resJson);
        } catch (err) {
          console.error("JSON parse error:", err);
        }
      }

      const markdown = data.message
        .replace(/```json[\s\S]*?```/, "") // remove JSON code block
        .replace(/^### 1\..*$/m, "") // remove "### 1. Nutrition Breakdown JSON"
        .replace(/^### 2\..*$/m, "") // remove "### 2. Structured Report"
        .trim();

      setResult(markdown);
    } catch (err) {
      console.error(err);
      setResult("Error analyzing image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1 px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6 items-center">
          <Text className="text-3xl font-bold text-gray-800 mb-2">
            🍽 AI Meal Analyzer
          </Text>
          <Text className="text-gray-600 text-center">
            Upload your meal and let AI give you insights
          </Text>
        </View>

        {/* Show image */}
        {selectedImage && (
          <View className="items-center mb-6">
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-72 rounded-3xl shadow-lg shadow-gray-300"
            />
          </View>
        )}

        <View className="flex-row justify-between items-center space-x-2">
          {/* Select image button */}
          <TouchableOpacity
            onPress={pickImage}
            className="flex-row items-center justify-center  px-4 py-4 w-48 bg-blue-500  rounded-2xl shadow-md shadow-blue-200 "
          >
            <Ionicons name="image-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-lg ml-2">
              Select Image
            </Text>
          </TouchableOpacity>

          {/* Analyze button */}
          <TouchableOpacity
            onPress={uploadToServer}
            disabled={!base64Image || loading}
            className={`flex-row items-center justify-center px-4 py-4 w-48 rounded-2xl shadow-md  ${
              base64Image ? "bg-green-500 shadow-green-200" : "bg-gray-300"
            }`}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "analytics-outline"}
              size={20}
              color="white"
            />
            <Text className="text-white font-semibold text-lg ml-2">
              {loading ? "Analyzing..." : "AI Analyze"}
            </Text>
          </TouchableOpacity>
        </View>
        {/* Loading */}
        {loading && (
          <ActivityIndicator size="large" color="#3B82F6" className="mb-6" />
        )}

        {/* Nutrition summary */}
        {jsonData && (
          <View className="bg-white rounded-3xl shadow-lg shadow-gray-200 p-6 mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Nutrition Summary
            </Text>

            {/* Health Score */}
            <View className="items-center mb-6">
              <AnimatedCircularProgress
                size={160}
                width={14}
                fill={jsonData["Health Score"]}
                tintColor={
                  jsonData["Health Score"] >= 75
                    ? "#22C55E"
                    : jsonData["Health Score"] >= 50
                      ? "#FACC15"
                      : "#EF4444"
                }
                backgroundColor="#E5E7EB"
              >
                {(fill: any) => (
                  <Text className="text-2xl font-bold text-gray-800">
                    {Math.round(fill)}/100
                  </Text>
                )}
              </AnimatedCircularProgress>
            </View>

            {/* Nutrition facts */}
            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="flame-outline" size={18} color="#F97316" />
                <Text className="ml-2 text-gray-700">
                  Calories: {jsonData.Calories} kcal
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="fitness-outline" size={18} color="#10B981" />
                <Text className="ml-2 text-gray-700">
                  Protein: {jsonData.Protein} g
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="pizza-outline" size={18} color="#EAB308" />
                <Text className="ml-2 text-gray-700">
                  Carbs: {jsonData.Carbohydrates} g
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="egg-outline" size={18} color="#EF4444" />
                <Text className="ml-2 text-gray-700">
                  Fat: {jsonData.Fat} g
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="leaf-outline" size={18} color="#22C55E" />
                <Text className="ml-2 text-gray-700">
                  Fiber: {jsonData.Fiber} g
                </Text>
              </View>
            </View>

            {/* Vitamins */}
            <Text className="mt-6 font-semibold text-gray-800">
              Vitamins & Minerals
            </Text>
            <View className="flex-row flex-wrap mt-2">
              {jsonData["Key vitamins & minerals"].map((v, i) => (
                <View
                  key={i}
                  className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full mr-2 mt-2"
                >
                  <Ionicons name="sparkles-outline" size={14} color="#3B82F6" />
                  <Text className="text-blue-700 text-sm ml-1">{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Markdown explanation */}
        {result !== "" ? (
          <View className="bg-white rounded-3xl shadow-md p-6">
            <Markdown
              markdownit={MarkdownIt({
                typographer: true,
                breaks: true,
                linkify: true,
              })}
              style={{
                body: { fontSize: 16, lineHeight: 24, color: "#374151" },
                heading1: {
                  fontSize: 22,
                  fontWeight: "bold",
                  marginTop: 20,
                  color: "#111827",
                },
                heading2: {
                  fontSize: 20,
                  fontWeight: "600",
                  marginTop: 16,
                  color: "#1F2937",
                },
                strong: { fontWeight: "bold", color: "#111827" },
                list_item: { marginBottom: 8 },
              }}
            >
              {result}
            </Markdown>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
