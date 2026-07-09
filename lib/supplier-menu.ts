import type { Router } from "expo-router";

export type ShellMenuItem = {
  label: string;
  icon?: string;
  onPress?: () => void;
  action?: "logout";
};

export function getSupplierMenuItems(
  router: Router,
  handlers: { onLogout: () => void },
): ShellMenuItem[] {
  return [
    {
      label: "Create Product",
      icon: "add-box",
      onPress: () => router.push("/supplier/create-product" as any),
    },
    {
      label: "My Profile",
      icon: "person",
      onPress: () => router.push("/profile" as any),
    },
    {
      label: "Log out",
      icon: "logout",
      action: "logout",
      onPress: handlers.onLogout,
    },
  ];
}
