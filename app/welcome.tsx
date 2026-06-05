import { ThemedText } from "@/components/themed-text";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Image
          source={require("@/assets/images/new4.png")}
          style={styles.bg}
          contentFit="cover"
        />
      </View>

      <View style={styles.bottom}>
        <ThemedText type="defaultSemiBold" style={styles.title}>
          KeGebeya{`\n`}Welcome
        </ThemedText>
        <Text style={styles.subtitle}>
          Welcome to KeGebeya marketplace. Discover products and connect with
          suppliers.
        </Text>

        <Pressable
          style={styles.continue}
          onPress={() => router.push("/onboarding/role")}
        >
          <ThemedText type="defaultSemiBold" style={styles.continueText}>
            Continue
          </ThemedText>
          <MaterialIcons
            name="arrow-forward"
            size={18}
            color="#fff"
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  // use percentage height so the top image scales consistently across devices
  top: { height: "73%", position: "relative" },
  bg: { width: "100%", height: "100%" },
  logo: { width: 120, height: 120, position: "absolute", left: 20, top: 36 },
  bottom: { flex: 1, padding: 24, justifyContent: "space-between" },
  title: {
    fontSize: 40,
    lineHeight: 44,
    color: "#0a2f4a",
    marginTop: "-20%",
    marginLeft: 0,
    alignSelf: "flex-start",
  },
  subtitle: {
    color: "#0a2f4a",
    fontWeight: "300",
    fontSize: 17,
    marginTop: 8,
    marginLeft: 0,
    alignSelf: "flex-start",
  },
  continue: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a2f4a",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 28,
  },
  continueText: { color: "#fff", fontSize: 16 },
});
