import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { useState } from "react";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      Alert.alert("Error", "Please enter your email and password");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert("Sign Up Failed", "Please check your email and try again");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!code) {
      Alert.alert("Error", "Please enter the verification code");
      return;
    }

    setIsLoading(true);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
        Alert.alert(
          "Verification Failed",
          "Please check your code and try again",
        );
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
      Alert.alert(
        "Verification Failed",
        "Please check your code and try again",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingVerification) {
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
                Verify Your Email
              </Text>
              <Text className="text-gray-600 text-center text-base">
                We've sent a verification code to your email
              </Text>
            </View>

            {/* Verification Form Card */}
            <View className="bg-white rounded-2xl shadow-lg shadow-gray-200 p-6 mb-6">
              {/* Verification Code Input */}
              <View className="mb-6">
                <Text className="text-gray-700 font-medium mb-2 text-sm">
                  Verification Code
                </Text>
                <TextInput
                  value={code}
                  placeholder="Enter your verification code"
                  onChangeText={(code) => setCode(code)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white text-center text-lg font-semibold"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={onVerifyPress}
                disabled={isLoading}
                className="rounded-xl py-4 px-6 
                 bg-blue-500"
              >
                <Text className="text-white font-semibold text-center text-base">
                  {isLoading ? "Verifying..." : "Verify Email"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Back to Sign Up Link */}
            <View className="flex-row justify-center items-center">
              <Text className="text-gray-600 text-base">
                Didn't receive the code?
              </Text>
              <TouchableOpacity
                className="ml-2"
                onPress={() => setPendingVerification(false)}
              >
                <Text className="text-blue-600 font-semibold text-base">
                  Try Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
              Create Account
            </Text>
            <Text className="text-gray-600 text-center text-base">
              Sign up to get started with your account
            </Text>
          </View>

          {/* Sign Up Form Card */}
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
                onChangeText={(email) => setEmailAddress(email)}
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
                placeholder="Create a password (min. 8 characters)"
                secureTextEntry={true}
                onChangeText={(password) => setPassword(password)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white"
              />
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={isLoading}
              className="rounded-xl py-4 px-6 
                 bg-blue-500"
              activeOpacity={0.8}
            >
              <Text className="text-white font-semibold text-center text-base">
                {isLoading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600 text-base">
              Already have an account?
            </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity className="ml-2">
                <Text className="text-blue-600 font-semibold text-base">
                  Sign In
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
