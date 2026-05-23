import React from "react";
import { Stack } from "expo-router";

export default function OrdersLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

// Hides the default header/title (like "orders/[id]") for order screens
