import React, { useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { Image } from "expo-image";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

export default function KeGebeyaLoader(): JSX.Element {
  const progress = useSharedValue(0);

  useEffect(() => {
    // continuous linear loop from 0 -> 1 -> 0 -> ...
    progress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const animatedGlowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.loaderWrapper}>
        {/* BACKGROUND GLOWING LOOP LAYER */}
        <Animated.View style={[styles.absoluteCenter, animatedGlowStyle]}>
          <Svg width={110} height={110} viewBox="0 0 100 100">
            <Defs>
              <LinearGradient
                id="gradientLoop"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <Stop offset="0%" stopColor="#8B1E1E" stopOpacity="0.8" />
                <Stop offset="50%" stopColor="#0A2240" stopOpacity="0.1" />
                <Stop offset="100%" stopColor="#0A2240" stopOpacity="0.8" />
              </LinearGradient>
            </Defs>
            <Path
              d="M 50,10 A 40,40 0 1,1 49.9,10"
              fill="none"
              stroke="url(#gradientLoop)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </Svg>
        </Animated.View>

        {/* STATIC ACCENT FOREGROUND - render provided logo inside a circular mask */}
        <View style={styles.absoluteCenter}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo1.png")}
              style={styles.logoImage}
              contentFit="contain"
            />
          </View>
        </View>
      </View>

      {/* Brand Text styling */}
      <Text style={styles.text}>KeGebeya...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  loaderWrapper: {
    width: 120,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  absoluteCenter: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  logoImage: {
    width: 48,
    height: 48,
    resizeMode: "contain",
  },
  text: {
    marginTop: 20,
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
  },
});
