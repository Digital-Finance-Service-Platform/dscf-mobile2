import { Tabs, useSegments, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { useSdk } from "@/lib/sdk/context";
import LogoutConfirmModal from "@/components/ui/logout-confirm-modal";
import MenuModal from "@/components/ui/menu-modal";

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
                <View style={styles.activeTabWrapper}>
                  <View style={styles.cutoutRing}>
                    <View style={styles.topHalfMask} />
                    <View style={styles.bottomHalfMask} />

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
  const { token, logout, refreshToken } = useSdk();
  const router = useRouter();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // hide the global app header on checkout screens
  const hideOn = ["checkout"];
  if (segments && segments.length > 0 && hideOn.includes(segments[0])) {
    return null;
  }

  const bg = "#FAF9F8";
  const iconColor = "#800000";

  return (
    <View style={[layoutStyles.header, { backgroundColor: bg }]}>
      <TouchableOpacity
        accessibilityLabel="Open menu"
        style={layoutStyles.headerIconWrap}
        onPress={() => setShowMenuModal(true)}
      >
        <IconSymbol name="line.horizontal.3" size={28} color={iconColor} />
      </TouchableOpacity>

      <Image
        source={require("@/assets/images/logo.png")}
        style={layoutStyles.headerIconSmall}
      />

      <View style={layoutStyles.rightIcons}>
        <TouchableOpacity
          accessibilityLabel="Refresh"
          style={layoutStyles.headerIconWrap}
          onPress={async () => {
            try {
              console.log("AppHeader: Refresh pressed");
            } catch (e) {}
            try {
              await refreshToken();
            } catch (e) {
              try {
                console.log("AppHeader: refreshToken failed", e);
              } catch (e) {}
            }
            try {
              const currentPath =
                segments && segments.length ? "/" + segments.join("/") : "/";
              // append timestamp to force navigation/rerender
              router.replace(`${currentPath}?_t=${Date.now()}`);
            } catch (e) {
              try {
                console.log("AppHeader: router replace failed", e);
              } catch (e) {}
            }
          }}
        >
          <MaterialIcons name="refresh" size={24} color={iconColor} />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityLabel="Open cart"
          style={[layoutStyles.headerIconWrap, { marginLeft: -6 }]}
        >
          <IconSymbol name="cart" size={28} color={iconColor} />
          {count > 0 && (
            <View style={layoutStyles.badge}>
              <Text style={layoutStyles.badgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>

        <LogoutConfirmModal
          visible={showLogoutModal}
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={async () => {
            // debug: confirm handler invoked
            try {
              console.log("AppHeader: Logout confirmed - starting logout");
            } catch (e) {}
            setShowLogoutModal(false);
            try {
              await logout();
              try {
                console.log("AppHeader: logout() completed");
              } catch (e) {}
            } catch (e) {
              // ignore
              try {
                console.log("AppHeader: logout() threw", e);
              } catch (e) {}
            }
            try {
              router.replace("/welcome");
              try {
                console.log("AppHeader: navigated to /welcome");
              } catch (e) {}
            } catch (e) {
              // ignore
              try {
                console.log("AppHeader: router.replace failed", e);
              } catch (e) {}
            }
          }}
        />

        <MenuModal
          visible={showMenuModal}
          onClose={() => setShowMenuModal(false)}
          items={[
            {
              label: "My Profile",
              icon: "person",
              onPress: () => {
                setShowMenuModal(false);
                router.push("/profile");
              },
            },
            {
              label: "Favorites",
              icon: "favorite",
              onPress: () => {
                setShowMenuModal(false);
                router.push("/favorites");
              },
            },
            {
              label: "Contact Us",
              icon: "phone",
              onPress: () => {
                setShowMenuModal(false);
                router.push("/contact");
              },
            },
            {
              label: "Chatbot",
              icon: "chat",
              onPress: () => {
                setShowMenuModal(false);
                router.push("/chatbot");
              },
            },
            {
              label: "Settings",
              icon: "settings",
              onPress: () => {
                setShowMenuModal(false);
                router.push("/settings");
              },
            },
            {
              label: "Log out",
              icon: "logout",
              onPress: () => {
                // debug: trace menu logout press
                try {
                  console.log("AppHeader: Menu 'Log out' pressed");
                } catch (e) {}
                setShowMenuModal(false);
                setShowLogoutModal(true);
              },
            },
          ]}
        />
      </View>
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
      <StatusBar style="dark" />
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
  headerIconSmall: { width: "45%", height: "70%" },
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
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },
});
