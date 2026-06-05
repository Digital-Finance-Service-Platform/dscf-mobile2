import { CartProvider } from "@/components/cart-context";
import { useSdk } from "@/lib/sdk/context";
import SdkProvider from "@/lib/sdk/provider";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Updates from "expo-updates";
import React, { useEffect } from "react";
import { Alert } from "react-native";
import "react-native-reanimated";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const apiBase =
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    (Constants.expoConfig?.extra as any)?.apiBaseUrl ??
    "http://localhost:3000";

  const config = {
    authUrl:
      process.env.EXPO_PUBLIC_AUTH_URL ??
      process.env.NEXT_PUBLIC_AUTH_URL ??
      (Constants.expoConfig?.extra as any)?.authUrl ??
      apiBase,
    marketUrl:
      process.env.EXPO_PUBLIC_MARKET_URL ??
      process.env.NEXT_PUBLIC_MARKET_URL ??
      (Constants.expoConfig?.extra as any)?.marketUrl ??
      `${apiBase.replace(/\/$/, "")}/marketplace`,
  };

  // Check for updates on app launch
  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert(
          "Update Available",
          "A new version of the app is available. Would you like to update now?",
          [
            {
              text: "Later",
              onPress: () => {},
              style: "cancel",
            },
            {
              text: "Update",
              onPress: async () => {
                try {
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (error) {
                  Alert.alert("Error", "Failed to install update");
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.log("Error checking for updates:", error);
    }
  };

  return (
    <ThemeProvider value={DefaultTheme}>
      <SdkProvider config={config}>
        <CartProvider>
          {/* Render welcome/login or main tabs after SDK initialization */}
          <AuthStack />
          <StatusBar style="light" backgroundColor="#000000" />
        </CartProvider>
      </SdkProvider>
    </ThemeProvider>
  );
}

function AuthStack() {
  const { token, initialized } = useSdk();

  // Wait for token load from secure storage
  if (!initialized) return null;
  const initialRoute = token ? "(tabs)" : "welcome";

  return (
    <Stack
      screenOptions={{ headerShown: false }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/role" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/agent" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding/retailor"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="onboarding/dropoff"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
