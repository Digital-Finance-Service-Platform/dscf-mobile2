import { Tabs, useSegments } from "expo-router";
import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { Image } from "expo-image";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { useCart } from "@/components/cart-context";

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBarBackground}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.title !== undefined ? options.title : route.name;
          const isFocused = state.index === index;
          const iconName = options.tabBarIconName || "help";

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              activeOpacity={0.9}
              onPress={onPress}
              style={styles.tabItem}
            >
              {isFocused ? (
                /* Active state with 90-degree horizontally split mask background */
                <View style={styles.activeTabWrapper}>
                  <View style={styles.cutoutRing}>
                    {/* Top half: White */}
                    <View style={styles.topHalfMask} />
                    {/* Bottom half: Gray */}
                    <View style={styles.bottomHalfMask} />

                    {/* Centered Floating Active Circle */}
                    <View style={styles.activeCircle}>
                      <MaterialIcons
                        name={iconName}
                        size={26}
                        color="#800000"
                      />
                    </View>
                  </View>
                  <Text style={[styles.label, styles.activeLabel]}>
                    {label}
                  </Text>
                </View>
              ) : (
                /* Inactive state */
                <View style={styles.inactiveTabWrapper}>
                  <MaterialIcons name={iconName} size={24} color="#a89c95" />
                  <Text style={[styles.label, styles.inactiveLabel]}>
                    {label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function AppHeader() {
  const segments = useSegments();
  const { count } = useCart();

  // hide the global app header on checkout screens
  const hideOn = ["checkout"];
  if (segments && segments.length > 0 && hideOn.includes(segments[0])) {
    return null;
  }

  const bg = "#0a1f44";
  const iconColor = "#fff";

  return (
    <View style={[layoutStyles.header, { backgroundColor: bg }]}>
      <TouchableOpacity
        accessibilityLabel="Open menu"
        style={layoutStyles.headerIconWrap}
      >
        <IconSymbol name="line.horizontal.3" size={28} color={iconColor} />
      </TouchableOpacity>

      <Image
        source={require("@/assets/images/logo.png")}
        style={layoutStyles.headerIconSmall}
      />

      <TouchableOpacity
        accessibilityLabel="Open cart"
        style={layoutStyles.headerIconWrap}
      >
        <IconSymbol name="cart" size={28} color={iconColor} />
        {count > 0 && (
          <View style={layoutStyles.badge}>
            <Text style={layoutStyles.badgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function TabLayout() {
  useEffect(() => {
    if (Platform.OS === "android") {
      (async () => {
        try {
          const SystemUI = await import("expo-system-ui");
          if (
            SystemUI &&
            typeof SystemUI.setBackgroundColorAsync === "function"
          ) {
            await SystemUI.setBackgroundColorAsync("#000000");
          }
        } catch (e) {
          // ignore
        }
      })();
    }
  }, []);

  return (
    <>
      <View style={{ flex: 1 }}>
        <AppHeader />
        <Tabs
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen
            name="index"
            options={
              {
                title: "Discover",
                tabBarIconName: "search",
              } as any
            }
          />
          <Tabs.Screen
            name="categories"
            options={
              {
                title: "Categories",
                tabBarIconName: "apps",
              } as any
            }
          />
          <Tabs.Screen
            name="cart"
            options={
              {
                title: "Cart",
                tabBarIconName: "shopping-bag",
              } as any
            }
          />
          <Tabs.Screen
            name="orders"
            options={
              {
                title: "Orders",
                tabBarIconName: "receipt",
              } as any
            }
          />
        </Tabs>
      </View>
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: "absolute",
    left: 2,
    right: 2,
    bottom: 0,
    backgroundColor: "transparent",
  },
  tabBarBackground: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    height: 68,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 0,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  inactiveTabWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
  },
  activeTabWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  /* Holds the horizontal color split container */
  cutoutRing: {
    position: "absolute",
    top: -32,
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden", // Clips the horizontal half-blocks perfectly into a circle outline
    alignItems: "center",
    justifyContent: "center",
  },
  /* Top 180-degree block (rotated 90 degrees) */
  topHalfMask: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#ffffff",
  },
  /* Bottom 180-degree block (rotated 90 degrees) */
  bottomHalfMask: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "#f4f4f5",
  },
  activeCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2, // Layered cleanly above the two background masks
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  label: {
    fontSize: 12,
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
  },
  activeLabel: {
    color: "#800000",
    fontWeight: "700",
    position: "absolute",
    bottom: 8,
  },
  inactiveLabel: {
    color: "#a89c95",
    fontWeight: "500",
    marginTop: 4,
  },
});

const layoutStyles = StyleSheet.create({
  header: {
    height: 70,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 10,
    justifyContent: "space-between",
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconSmall: { width: 140, height: 36, resizeMode: "contain" },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#8a1d1d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
});
