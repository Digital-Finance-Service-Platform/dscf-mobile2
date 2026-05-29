import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { clearTokens } from "@/lib/api/clients";
import { useRouter } from "expo-router";

export default function ClearTokensScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await clearTokens();
      } catch (e) {
        // ignore
      }
      // navigate to login after clearing
      router.replace("/login");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Clearing local auth and opening login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  text: { marginTop: 12, textAlign: "center" },
});
