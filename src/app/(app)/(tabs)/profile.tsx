import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";

const Profile = () => {
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const getUserAvatar = () => {
    if (user?.imageUrl) {
      return user.imageUrl;
    }

    return "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face";
  };

  const getUserName = () => {
    if (user?.fullName) {
      return user.fullName;
    }
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return "User";
  };

  const getUserEmail = () => {
    return user?.primaryEmailAddress?.emailAddress || "No email available";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-6 py-8">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
              Profile
            </Text>
          </View>

          {/* User Profile Card */}
          <View className="bg-white rounded-3xl shadow-lg shadow-gray-200 p-6 mb-6">
            {/* Avatar and Basic Info */}
            <View className="items-center mb-6">
              <View className="relative mb-4">
                <Image
                  source={{ uri: getUserAvatar() }}
                  className="w-24 h-24 rounded-full"
                  resizeMode="cover"
                />
                <TouchableOpacity className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-2">
                  <Ionicons name="camera" size={16} color="white" />
                </TouchableOpacity>
              </View>

              <Text className="text-2xl font-bold text-gray-800 mb-1">
                {getUserName()}
              </Text>
              <Text className="text-gray-600 text-base">{getUserEmail()}</Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-500 rounded-2xl p-4 shadow-lg shadow-red-200"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                Sign Out
              </Text>
            </View>
          </TouchableOpacity>

          {/* App Version */}
          <View className="mt-8 items-center">
            <Text className="text-gray-400 text-sm">AI travel App v1.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;
