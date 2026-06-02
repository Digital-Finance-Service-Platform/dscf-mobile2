import { Platform } from "react-native";
import * as SecureStoreModule from "expo-secure-store";

const isWeb = Platform.OS === "web";

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("[secureStore] localStorage.getItem failed", e);
      return null;
    }
  }
  return SecureStoreModule.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("[secureStore] localStorage.setItem failed", e);
    }
    return;
  }
  return SecureStoreModule.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("[secureStore] localStorage.removeItem failed", e);
    }
    return;
  }
  return SecureStoreModule.deleteItemAsync(key);
}
