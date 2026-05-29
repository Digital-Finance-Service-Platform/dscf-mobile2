import "react-native-reanimated";
import React from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { CartProvider } from "@/components/cart-context";
import SdkProvider from "@/lib/sdk/provider";
import { useSdk } from "@/lib/sdk/context";
import Constants from "expo-constants";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const config = {
    authUrl:
      process.env.EXPO_PUBLIC_AUTH_URL ??
      (Constants.expoConfig?.extra as any)?.authUrl ??
      "http://localhost:3000",
    marketUrl:
      process.env.EXPO_PUBLIC_MARKET_URL ??
      (Constants.expoConfig?.extra as any)?.marketUrl ??
      "http://localhost:3000/api/marketplace",
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
    </Stack>
  );
}
