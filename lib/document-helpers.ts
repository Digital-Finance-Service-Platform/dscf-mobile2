/**
 * Document Helper Module
 * 
 * Utilities for handling document uploads in onboarding flows
 */

import * as DocumentPicker from "expo-document-picker";

export type DocumentAsset = DocumentPicker.DocumentPickerAsset;

export interface DocumentFormField {
  uri: string;
  name: string;
  type: string;
}

/**
 * Convert a DocumentPicker asset to a format suitable for FormData
 */
export function assetToFormField(asset: DocumentAsset): DocumentFormField {
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType || "application/octet-stream",
  };
}

/**
 * Pick a single document
 */
export async function pickDocument(
  options?: DocumentPicker.DocumentPickerOptions
): Promise<DocumentAsset | null> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ["application/pdf", "image/*"],
    ...options,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets?.[0] ?? null;
}

/**
 * Pick multiple documents
 */
export async function pickDocuments(
  options?: DocumentPicker.DocumentPickerOptions
): Promise<DocumentAsset[]> {
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: true,
    type: ["application/pdf", "image/*"],
    ...options,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets ?? [];
}

/**
 * Validate document file size (in bytes)
 */
export function validateFileSize(
  asset: DocumentAsset,
  maxSizeBytes: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  if (!asset.size) {
    return { valid: true }; // Size not available, skip validation
  }

  if (asset.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { valid: true };
}

/**
 * Validate document file type
 */
export function validateFileType(
  asset: DocumentAsset,
  allowedTypes: string[] = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
): { valid: boolean; error?: string } {
  if (!asset.mimeType) {
    return { valid: true }; // Type not available, skip validation
  }

  const isAllowed = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const prefix = type.split("/")[0];
      return asset.mimeType?.startsWith(prefix + "/");
    }
    return asset.mimeType === type;
  });

  if (!isAllowed) {
    return {
      valid: false,
      error: "File type not allowed. Please upload PDF or image files.",
    };
  }

  return { valid: true };
}

/**
 * Build FormData for business creation with documents
 */
export function buildBusinessFormData(fields: {
  name: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  tin_number?: string;
  business_type_id?: number | string;
  business_license?: DocumentAsset;
}): FormData {
  const formData = new FormData();

  // Add business fields
  if (fields.name) formData.append("business[name]", fields.name);
  if (fields.description) formData.append("business[description]", fields.description);
  if (fields.contact_email) formData.append("business[contact_email]", fields.contact_email);
  if (fields.contact_phone) formData.append("business[contact_phone]", fields.contact_phone);
  if (fields.tin_number) formData.append("business[tin_number]", fields.tin_number);
  if (fields.business_type_id) formData.append("business[business_type_id]", String(fields.business_type_id));

  // Add business license document
  if (fields.business_license) {
    formData.append("business[business_license]", assetToFormField(fields.business_license) as any);
  }

  return formData;
}

/**
 * Build FormData for business resubmit with documents
 */
export function buildBusinessResubmitFormData(fields: {
  name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  tin_number?: string;
  business_license?: DocumentAsset;
}): FormData {
  const formData = new FormData();

  // Only add fields that are provided (for resubmit, we only update what changed)
  if (fields.name) formData.append("business[name]", fields.name);
  if (fields.description) formData.append("business[description]", fields.description);
  if (fields.contact_email) formData.append("business[contact_email]", fields.contact_email);
  if (fields.contact_phone) formData.append("business[contact_phone]", fields.contact_phone);
  if (fields.tin_number) formData.append("business[tin_number]", fields.tin_number);

  // Add new business license if provided
  if (fields.business_license) {
    formData.append("business[business_license]", assetToFormField(fields.business_license) as any);
  }

  return formData;
}

/**
 * Build FormData for supplier registration with documents
 */
export function buildSupplierRegistrationFormData(fields: {
  email?: string;
  contact_person_phone: string;
  password: string;
  password_confirmation: string;
  business_name: string;
  tin_number?: string;
  location: string;
  business_license?: DocumentAsset;
  additional_documents?: DocumentAsset[];
}): FormData {
  const formData = new FormData();

  // Add top-level fields (supplier registration uses top-level params)
  if (fields.email) formData.append("email", fields.email);
  formData.append("contact_person_phone", fields.contact_person_phone);
  formData.append("password", fields.password);
  formData.append("password_confirmation", fields.password_confirmation);
  formData.append("business_name", fields.business_name);
  if (fields.tin_number) formData.append("tin_number", fields.tin_number);
  formData.append("location", fields.location);

  // Add business license
  if (fields.business_license) {
    formData.append("business_license", assetToFormField(fields.business_license) as any);
  }

  // Add additional documents
  if (fields.additional_documents && fields.additional_documents.length > 0) {
    fields.additional_documents.forEach((doc) => {
      formData.append("additional_documents[]", assetToFormField(doc) as any);
    });
  }

  return formData;
}

/**
 * Build FormData for supplier resubmit with documents
 */
export function buildSupplierResubmitFormData(fields: {
  name?: string;
  location?: string;
  contact_phone?: string;
  business_license?: DocumentAsset;
  additional_documents?: DocumentAsset[];
}): FormData {
  const formData = new FormData();

  // Add supplier fields (nested under supplier[...])
  if (fields.name) formData.append("supplier[name]", fields.name);
  if (fields.location) formData.append("supplier[location]", fields.location);
  if (fields.contact_phone) formData.append("supplier[contact_phone]", fields.contact_phone);

  // Add documents (top-level for resubmit)
  if (fields.business_license) {
    formData.append("business_license", assetToFormField(fields.business_license) as any);
  }

  if (fields.additional_documents && fields.additional_documents.length > 0) {
    fields.additional_documents.forEach((doc) => {
      formData.append("additional_documents[]", assetToFormField(doc) as any);
    });
  }

  return formData;
}
