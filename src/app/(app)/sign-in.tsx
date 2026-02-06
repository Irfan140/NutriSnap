import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignIn from "@/src/components/GoogSignIn";
import { useState } from "react";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    setIsLoading(true);

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2));
        Alert.alert("Sign In Failed", "Please check your credentials");
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign In Failed", "Please check your email and password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
              Welcome Back
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Sign in to your account to continue
            </Text>
          </View>

          {/* Login Form Card */}
          <View className="bg-white rounded-2xl shadow-lg shadow-gray-200 p-6 mb-6">
            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                Email Address
              </Text>
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="Enter your email"
                onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                Password
              </Text>
              <TextInput
                value={password}
                placeholder="Enter your password"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
              />
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className="rounded-xl py-4 px-6 
                 bg-blue-500"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-base">
                {isLoading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
          <GoogleSignIn />

          {/* Sign Up Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">
              Don't have an account?
            </Text>
            <Link href="/sign-up" asChild>
              <TouchableOpacity className="ml-2">
                <Text className="text-blue-600 font-semibold text-base">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
