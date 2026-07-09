import { useRouter } from "expo-router";
import { useMemo } from "react";

import { getSupplierMenuItems } from "@/lib/supplier-menu";

export function useSupplierMenuItems() {
  const router = useRouter();

  return useMemo(
    () =>
      getSupplierMenuItems(router, {
        onLogout: () => {},
      }),
    [router],
  );
}
