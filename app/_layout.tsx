import "react-native-reanimated";
import React from "react";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { CartProvider } from "@/components/cart-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="light" />
      </CartProvider>
    </ThemeProvider>
  );
}
