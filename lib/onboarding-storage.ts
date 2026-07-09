/**
 * Onboarding Storage Helper
 * 
 * Temporary storage for onboarding data including documents
 * that cannot be passed through router params
 */

import { deleteItemAsync, getItemAsync, setItemAsync } from "./secureStore";

const ONBOARDING_KEY = "onboarding_temp_data";

export interface OnboardingDocuments {
  licenseFile?: {
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  };
  additionalDocs?: Array<{
    uri: string;
    name: string;
    mimeType: string;
    size?: number;
  }>;
}

export interface OnboardingData {
  role: string;
  // Supplier fields
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  documents?: OnboardingDocuments;
  // Retailer fields
  firstName?: string;
  lastName?: string;
  gender?: string;
  tin?: string;
  // Agent fields
  fullName?: string;
  serviceArea?: string;
  faydaNumber?: string;
}

/**
 * Store onboarding data temporarily
 */
export async function storeOnboardingData(data: OnboardingData): Promise<void> {
  try {
    await setItemAsync(ONBOARDING_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("[OnboardingStorage] Failed to store data:", err);
    throw new Error("Failed to save onboarding data");
  }
}

/**
 * Retrieve stored onboarding data
 */
export async function getOnboardingData(): Promise<OnboardingData | null> {
  try {
    const data = await getItemAsync(ONBOARDING_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error("[OnboardingStorage] Failed to retrieve data:", err);
    return null;
  }
}

/**
 * Clear onboarding data after successful registration
 */
export async function clearOnboardingData(): Promise<void> {
  try {
    await deleteItemAsync(ONBOARDING_KEY);
  } catch (err) {
    console.error("[OnboardingStorage] Failed to clear data:", err);
  }
}

/**
 * Update only the documents portion of stored data
 */
export async function updateOnboardingDocuments(
  documents: OnboardingDocuments
): Promise<void> {
  try {
    const existing = await getOnboardingData();
    if (existing) {
      existing.documents = documents;
      await storeOnboardingData(existing);
    } else {
      await storeOnboardingData({ role: "unknown", documents });
    }
  } catch (err) {
    console.error("[OnboardingStorage] Failed to update documents:", err);
    throw new Error("Failed to save documents");
  }
}
