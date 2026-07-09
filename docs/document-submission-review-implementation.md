# Document Submission & Review API Implementation

This document describes the mobile app integration with the Document Submission & Review API.

## Overview

The API provides a standardized document submission and review workflow for Business and Supplier entities. Every reviewable record moves through a status machine with document upload capabilities.

### Status Machine

```
draft → pending → approved
           ↓  ↑
         modify (admin requested changes; owner resubmits back to pending)
           ↓
        rejected (terminal)
```

## Architecture

### Core Modules

1. **`lib/api/clients.ts`** - API client functions
2. **`lib/review-status.ts`** - Review status helper utilities
3. **`lib/document-helpers.ts`** - Document handling utilities

### API Endpoints Added

#### Business Management

```typescript
// Create business in draft status with optional document
coreCreateBusiness(formData: FormData): Promise<any>

// Submit business for review (draft → pending)
coreSubmitBusiness(id: number | string): Promise<any>

// Resubmit business after admin requests changes (modify → pending)
coreResubmitBusiness(id: number | string, formData: FormData): Promise<any>

// Get business details and review status
coreGetBusiness(id: number | string): Promise<any>

// Get current user's business
coreGetMyBusiness(): Promise<any>
```

#### Business Documents

```typescript
// List all documents for a business
coreGetBusinessDocuments(businessId: number | string): Promise<any>

// Upload additional document
coreCreateBusinessDocument(businessId: number | string, formData: FormData): Promise<any>

// Delete a document
coreDeleteBusinessDocument(businessId: number | string, documentId: number | string): Promise<any>
```

#### Supplier Management

```typescript
// Register supplier (creates user, business, supplier - already pending)
marketRegisterSupplier(formData: FormData): Promise<any>

// Resubmit supplier after admin requests changes
marketResubmitSupplier(supplierId: number | string, formData: FormData): Promise<any>

// Get supplier details and review status
marketGetSupplier(supplierId: number | string): Promise<any>

// Get current user's suppliers
marketGetMySuppliers(): Promise<any>
```

## Document Helper Functions

### Building FormData

```typescript
// Business creation with documents
buildBusinessFormData({
  name: string,
  description?: string,
  contact_email?: string,
  contact_phone?: string,
  tin_number?: string,
  business_type_id?: number | string,
  business_license?: DocumentAsset,
}): FormData

// Business resubmit with updated documents
buildBusinessResubmitFormData({
  name?: string,
  description?: string,
  contact_email?: string,
  contact_phone?: string,
  tin_number?: string,
  business_license?: DocumentAsset,
}): FormData

// Supplier registration with documents
buildSupplierRegistrationFormData({
  email?: string,
  contact_person_phone: string,
  password: string,
  password_confirmation: string,
  business_name: string,
  tin_number?: string,
  location: string,
  business_license?: DocumentAsset,
  additional_documents?: DocumentAsset[],
}): FormData

// Supplier resubmit with updated documents
buildSupplierResubmitFormData({
  name?: string,
  location?: string,
  contact_phone?: string,
  business_license?: DocumentAsset,
  additional_documents?: DocumentAsset[],
}): FormData
```

### Document Picking

```typescript
// Pick single document
const document = await pickDocument(options?);

// Pick multiple documents
const documents = await pickDocuments(options?);

// Validate file size and type
const sizeValidation = validateFileSize(asset, maxSizeBytes);
const typeValidation = validateFileType(asset, allowedTypes);
```

## Review Status Helpers

### Status Checks

```typescript
// Check if entity can be edited directly
canDirectEdit(status: ReviewStatus): boolean

// Check if entity needs resubmit endpoint
needsResubmit(status: ReviewStatus): boolean

// Check if entity is in final state
isFinalState(status: ReviewStatus): boolean

// Check if entity is awaiting admin review
isAwaitingReview(status: ReviewStatus): boolean
```

### Status Display

```typescript
// Get user-friendly message
getStatusMessage(status: ReviewStatus, entityType: string): string

// Get color scheme for UI
getStatusColor(status: ReviewStatus): {
  icon: string;
  iconColor: string;
  bgColor: string;
}

// Extract review state from API response
extractReviewStatus(data: any, entityType: string): ReviewState | null
```

## Implementation Flows

### Business Flow

#### 1. Create Business (Draft)

```typescript
const formData = buildBusinessFormData({
  name: "Acme Trading PLC",
  contact_email: "acme@example.com",
  contact_phone: "+251911000000",
  tin_number: "0012345678",
  business_license: licenseFile, // DocumentAsset from picker
});

const result = await coreCreateBusiness(formData);
// result.data.review_status === "draft"
```

#### 2. Add Additional Documents (Optional, while draft)

```typescript
const formData = new FormData();
formData.append("document[file]", {
  uri: document.uri,
  name: document.name,
  type: document.mimeType || "application/octet-stream",
} as any);

await coreCreateBusinessDocument(businessId, formData);
```

#### 3. Submit for Review

```typescript
const result = await coreSubmitBusiness(businessId);
// result.data.review_status === "pending"
```

#### 4. Check Status

```typescript
const result = await coreGetBusiness(businessId);
const state = extractReviewStatus(result, "business");

if (state.status === "modify") {
  // Admin requested changes
  // Show state.reason to user
} else if (state.status === "approved") {
  // Approved - allow access
} else if (state.status === "rejected") {
  // Rejected - show state.reason
}
```

#### 5. Resubmit After Changes Requested

```typescript
if (state.status === "modify") {
  const formData = buildBusinessResubmitFormData({
    name: "Updated Business Name",
    business_license: newLicenseFile, // optional
  });

  const result = await coreResubmitBusiness(businessId, formData);
  // result.data.review_status === "pending"
}
```

### Supplier Flow

#### 1. Register Supplier (Already Pending)

```typescript
const formData = buildSupplierRegistrationFormData({
  email: "owner@example.com",
  contact_person_phone: "+251911000001",
  password: "SecurePass123",
  password_confirmation: "SecurePass123",
  business_name: "Acme Supply Co",
  location: "Addis Ababa",
  business_license: licenseFile,
  additional_documents: [doc1, doc2], // optional
});

const result = await marketRegisterSupplier(formData);
// result.data.review_status === "pending" (created already pending)
```

#### 2. Check Status

```typescript
const result = await marketGetSupplier(supplierId);
const state = extractReviewStatus(result, "supplier");
// Check state.status and state.reason
```

#### 3. Resubmit After Changes Requested

```typescript
if (state.status === "modify") {
  const formData = buildSupplierResubmitFormData({
    name: "Updated Supplier Name",
    location: "Updated Location",
    business_license: newLicenseFile, // optional
    additional_documents: [newDoc], // optional
  });

  const result = await marketResubmitSupplier(supplierId, formData);
  // result.data.review_status === "pending"
}
```

## UI Integration

### Status Display Component

```typescript
const state = extractReviewStatus(response, "business");
if (!state) return null;

const config = getStatusColor(state.status);
const message = getStatusMessage(state.status, "business");

return (
  <View style={{ backgroundColor: config.bgColor }}>
    <MaterialIcons name={config.icon} color={config.iconColor} />
    <Text>{message}</Text>
    {state.reason && <Text>Reason: {state.reason}</Text>}
  </View>
);
```

### Conditional Actions

```typescript
if (canDirectEdit(state.status)) {
  // Show edit form with normal PATCH endpoint
} else if (needsResubmit(state.status)) {
  // Show edit form with resubmit endpoint
  // Display admin feedback (state.reason)
} else if (isFinalState(state.status)) {
  // Disable editing, show final status
} else if (isAwaitingReview(state.status)) {
  // Show waiting message, disable editing
}
```

## Testing

A complete test interface is available at `app/debug/test-document-submission.tsx`.

### Test Business Flow

1. Navigate to `/debug/test-document-submission`
2. Select "Test Business Flow"
3. Fill in business information
4. Upload business license (optional)
5. Click "Create Business (Draft)"
6. Click "Submit for Review"
7. Simulate admin requesting changes (use backend admin panel)
8. Click "Refresh Status" to see `modify` status
9. Update fields and click "Resubmit Changes"
10. Verify status returns to `pending`

### Test Supplier Flow

1. Navigate to `/debug/test-document-submission`
2. Select "Test Supplier Flow"
3. Fill in supplier information
4. Upload documents
5. Click "Register Supplier" (creates already pending)
6. Simulate admin requesting changes
7. Click "Refresh Status" to see `modify` status
8. Update fields and click "Resubmit Changes"
9. Verify status returns to `pending`

## Key Implementation Notes

### Document Storage

- Documents cannot be passed through React Native router params
- For onboarding flows, documents must be either:
  1. Stored in AsyncStorage/SecureStore during multi-step flow
  2. Re-captured on the final submission screen
  3. Submitted immediately without multi-step navigation

Current implementation uses approach #3 for supplier registration (immediate submission).

### FormData Construction

- Always use `FormData` for endpoints accepting file uploads
- Don't manually set `Content-Type` header - let fetch set multipart boundary
- Use helper functions to ensure correct field nesting (e.g., `business[name]` vs `name`)

### Business vs Supplier Differences

| Feature | Business | Supplier |
|---------|----------|----------|
| Creation | Draft status | Immediately pending |
| Submit endpoint | Required (`/submit`) | Implicit at registration |
| Resubmit endpoint | `PATCH /businesses/:id/resubmit` | `POST /suppliers/:id/resubmit` |
| Field nesting | `business[field]` | `supplier[field]` (resubmit only) |
| Document params | Nested or top-level | Top-level |

### Agent Photo/ID Gap

The agent registration endpoint's permitted params only whitelist `national_id`, not `photo`. Sending `agent[photo]` is silently dropped. If photo capture is needed, request backend update.

## Error Handling

```typescript
try {
  const result = await coreSubmitBusiness(businessId);
  // Handle success
} catch (err: any) {
  // API returns structured errors:
  // err.message contains user-friendly message
  // May include validation errors array
  Alert.alert("Error", err?.message || "Operation failed");
}
```

## Status Polling

For real-time status updates, implement polling or use app state listeners:

```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", async (nextState) => {
    if (nextState === "active") {
      // App foregrounded - refresh status
      await refreshStatus();
    }
  });
  return () => subscription.remove();
}, []);
```

## Security Considerations

1. **Authentication**: All authenticated endpoints require `Authorization: Bearer <token>`
2. **Ownership**: Users can only submit/resubmit their own entities (enforced server-side)
3. **File Validation**: Validate file size and type client-side before upload
4. **Secure Storage**: Store sensitive data in SecureStore, not AsyncStorage

## Future Enhancements

1. **Document preview**: Add ability to preview uploaded documents
2. **Progress tracking**: Show upload progress for large files
3. **Offline support**: Queue submissions for when connection restored
4. **Push notifications**: Notify users of status changes
5. **Document versioning**: Track document change history

## References

- API Documentation: `/docs/document-submission-review-api.md`
- Review Status Module: `lib/review-status.ts`
- Document Helpers: `lib/document-helpers.ts`
- API Clients: `lib/api/clients.ts`
- Test Interface: `app/debug/test-document-submission.tsx`
