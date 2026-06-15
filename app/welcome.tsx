import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Hero image with gradient overlay ── */}
      <View style={[styles.hero, { height: height * 0.48 }]}>
        <Image
          source={require("@/assets/images/welcome2.png")}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
        />
        {/* gradient-like overlay at the bottom of the image */}
        <View style={styles.gradientOverlay} />

        {/* floating badge */}
        <View style={styles.badge}>
          <MaterialIcons name="local-mall" size={18} color="#fff" />
          <Text style={styles.badgeText}>Marketplace</Text>
        </View>
      </View>

      {/* ── Bottom content ── */}
      <View style={styles.bottom}>
        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.brand}>KeGebeya</Text>
          <Text style={styles.tagline}>
            Your one-stop B2B{"\n"}marketplace
          </Text>
          <Text style={styles.description}>
            Connect with verified suppliers, discover quality products, and grow
            your business — all in one place.
          </Text>
        </View>

        {/* CTA buttons */}
        <View style={styles.ctaBlock}>
          <Pressable
            style={styles.continue}
            onPress={() => router.push("/onboarding/role")}
          >
            <Text style={styles.continueText}>Get Started</Text>
            <MaterialIcons
              name="arrow-forward"
              size={18}
              color="#fff"
              style={{ marginLeft: 8 }}
            />
          </Pressable>

          <Pressable
            style={styles.signInLink}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.signInText}>
              Already have an account?{" "}
              <Text style={styles.signInBold}>Sign in</Text>
            </Text>
          </Pressable>
        </View>
      </View>
      {/* Black safe area for phone navigation bar */}
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#fff",
  },

  /* ── Hero ── */
  hero: {
    position: "relative",
    overflow: "hidden",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  badge: {
    position: "absolute",
    top: 40,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(10, 47, 74, 0.75)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  /* ── Bottom content ── */
  bottom: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    justifyContent: "space-between",
  },

  /* ── Title block ── */
  titleBlock: {
    gap: 6,
  },
  brand: {
    fontSize: 14,
    fontWeight: "700",
    color: "#800000",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  tagline: {
    fontSize: 30,
    fontWeight: "800",
    color: "#0a2f4a",
    lineHeight: 36,
    marginTop: 4,
  },
  description: {
    fontSize: 15,
    color: "#55656d",
    lineHeight: 22,
    marginTop: 8,
    fontWeight: "400",
  },

  /* ── CTA ── */
  ctaBlock: {
    gap: 14,
    paddingBottom: 10,
  },
  continue: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a2f4a",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#0a2f4a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  continueText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  signInLink: {
    alignItems: "center",
    paddingVertical: 6,
  },
  signInText: {
    color: "#55656d",
    fontSize: 14,
  },
  signInBold: {
    color: "#0a2f4a",
    fontWeight: "700",
  },
  bottomSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
});
