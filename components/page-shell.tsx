import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState, type ReactNode } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import LogoutConfirmModal from "@/components/ui/logout-confirm-modal";
import MenuModal from "@/components/ui/menu-modal";
import type { ShellMenuItem } from "@/lib/supplier-menu";
import { useSdk } from "@/lib/sdk/context";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  headerVariant?: "default" | "retailer";
  showLogo?: boolean;
  logoSize?: { width: number; height: number };
  useBackIcon?: boolean;
  menuItems?: ShellMenuItem[];
  rightNode?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  compactHeader?: boolean;
  onBackPress?: () => void;
  style?: ViewStyle;
};

export function PageShell({
  title,
  subtitle,
  showBackButton = false,
  headerVariant = "default",
  showLogo = false,
  logoSize,
  useBackIcon = false,
  menuItems,
  rightNode,
  footer,
  children,
  compactHeader = false,
  onBackPress,
  style,
}: PageShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useSdk();
  const isRetailerHeader = headerVariant === "retailer";
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const hasMenu =
    isRetailerHeader && Array.isArray(menuItems) && menuItems.length > 0;

  const handleHeaderPress = () => {
    if (onBackPress) {
      onBackPress();
      return;
    }
    if (!useBackIcon && hasMenu) {
      setShowMenuModal(true);
      return;
    }
    router.back();
  };

  const modalItems =
    menuItems?.map((item) => ({
      label: item.label,
      icon: item.icon,
      onPress: () => {
        setShowMenuModal(false);
        if (item.action === "logout") {
          setShowLogoutModal(true);
          return;
        }
        item.onPress?.();
      },
    })) ?? [];

  const logoDimensions = logoSize ?? { width: 150, height: 40 };
  const showHeader =
    showBackButton || title || subtitle || rightNode || showLogo;

  return (
    <>
      <ThemedView style={[styles.container, style]}>
        {showHeader ? (
          <View
            style={[styles.headerRow, compactHeader && styles.headerRowCompact]}
          >
            {showBackButton ? (
              <TouchableOpacity
                onPress={handleHeaderPress}
                style={
                  isRetailerHeader ? styles.retailerIconWrap : styles.backBtn
                }
                accessibilityLabel={hasMenu ? "Open menu" : "Go back"}
              >
                {isRetailerHeader && !useBackIcon ? (
                  <IconSymbol
                    name="line.horizontal.3"
                    size={28}
                    color="#800000"
                  />
                ) : (
                  <MaterialIcons name="arrow-back" size={20} color="#333" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.spacer} />
            )}

            {showBackButton && showLogo && isRetailerHeader ? (
              <View style={styles.headerCenter} pointerEvents="none">
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={[
                    styles.headerLogo,
                    {
                      width: logoDimensions.width,
                      height: logoDimensions.height,
                    },
                  ]}
                  contentFit="contain"
                />
                {subtitle ? (
                  <ThemedText
                    type="default"
                    lightColor="#6b6b6b"
                    style={styles.subtitle}
                  >
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            ) : showBackButton ? (
              <View style={styles.headerCenter} pointerEvents="none">
                {title ? (
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.headerTitleCenter}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {title}
                  </ThemedText>
                ) : null}
                {subtitle ? (
                  <ThemedText
                    type="default"
                    lightColor="#6b6b6b"
                    style={styles.subtitle}
                  >
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            ) : (
              <View style={styles.headerTextWrap}>
                {title ? (
                  <ThemedText
                    type="defaultSemiBold"
                    style={styles.headerTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {title}
                  </ThemedText>
                ) : null}
                {subtitle ? (
                  <ThemedText
                    type="default"
                    lightColor="#6b6b6b"
                    style={styles.subtitle}
                  >
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>
            )}

            {rightNode ? (
              <View>{rightNode}</View>
            ) : (
              <View style={styles.spacer} />
            )}
          </View>
        ) : null}

        {children}

        {footer ? (
          <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
            {footer}
          </View>
        ) : null}
      </ThemedView>

      {/* Black safe area for phone navigation bar */}
      <View style={[styles.bottomSafeArea, { height: insets.bottom }]} />

      {hasMenu ? (
        <>
          <MenuModal
            visible={showMenuModal}
            onClose={() => setShowMenuModal(false)}
            items={modalItems}
          />
          <LogoutConfirmModal
            visible={showLogoutModal}
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={async () => {
              setShowLogoutModal(false);
              try {
                await logout();
              } catch {
                // ignore
              }
              router.replace("/login");
            }}
          />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  headerRowCompact: {
    marginBottom: 6,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  retailerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerLogo: {
    width: 180,
    height: 48,
  },
  spacer: { width: 36, height: 36 },
  headerTextWrap: { flex: 1, marginHorizontal: 12 },
  headerTitle: {
    fontSize: 22,
    color: "#1A1C1C",
    textAlign: "left",
    marginLeft: -40,
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerTitleCenter: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1C1C",
    textAlign: "center",
    marginLeft: 0,
  },
  subtitle: { marginTop: 4, textAlign: "left" },
  footer: { marginTop: "auto" },
  bottomSafeArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
});
