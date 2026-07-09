# Supplier Modification Flow - Implementation Summary

## Overview
This document describes the implementation of the supplier modification request flow in the mobile app, allowing admins to request changes from suppliers/agents and enabling them to resubmit their applications.

## Implementation Status: ✅ Complete

### What Was Implemented

#### 1. New Screens Created

##### `/app/onboarding/changes-requested.tsx`
- Displays admin feedback (modification reason)
- Shows editable fields: business name, address, contact phone, business type
- Allows document re-upload (business license, additional documents)
- Supports both **suppliers** and **agents**
- Submits corrections via resubmit endpoint
- Redirects to pending-approval screen after successful resubmit

##### `/app/onboarding/rejected.tsx`
- Shows rejection status with rejection reason
- Displays helpful next steps
- Provides option to start new application
- Supports all role types (supplier, agent, retailer)

#### 2. Updated Files

##### `app/login.tsx`
**Changes:**
- Added branching for `status === "modify"` → routes to changes-requested screen
- Added branching for `status === "rejected"` → routes to rejected screen
- Implemented for both **agents** and **suppliers**
- Passes `entityId` from `review_status.entity_id` to the screens

**Flow:**
```typescript
if (status === "pending" || status === "under_review") {
  → /onboarding/pending-approval
}
if (status === "modify") {
  → /onboarding/changes-requested (with entityId)
}
if (status === "rejected") {
  → /onboarding/rejected
}
// Otherwise proceed to main app
```

##### `app/onboarding/pending-approval.tsx`
**Changes:**
- Added polling for review status changes using `AppState` listener
- Integrated with `useSdk` hook to fetch user profile when app foregrounds
- Auto-redirects when status changes:
  - `modify` → changes-requested screen
  - `approved` → appropriate dashboard
  - `rejected` → rejected screen

**Key Logic:**
```typescript
useEffect(() => {
  const subscription = AppState.addEventListener("change", async (nextAppState) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active") {
      await fetchUser(); // Refresh user data including review_status
    }
    appState.current = nextAppState;
  });
  return () => subscription.remove();
}, [fetchUser]);
```

##### `lib/api/clients.ts`
**New Functions Added:**

1. **`marketResubmitSupplier(supplierId, formData)`**
   - POST to `/suppliers/:id/resubmit`
   - Accepts FormData with corrected fields and documents
   - Returns updated supplier with `status: "pending"` and cleared `review_reason`

2. **`marketGetSupplier(supplierId)`**
   - GET `/suppliers/:id`
   - Fetches supplier details including `review_reason`

3. **`marketGetMySuppliers()`**
   - GET `/suppliers/my_suppliers`
   - Fetches all suppliers for current user

**Endpoint Structure:**
```typescript
POST {API_BASE}/suppliers/:entity_id/resubmit
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
  supplier[name]: string (optional)
  supplier[address]: string (optional)
  supplier[contact_phone]: string (optional)
  supplier[business_type]: string (optional)
  business_license: file (optional)
  additional_documents[]: file[] (optional)
```

#### 3. Review Status Object Contract

Every login/refresh response includes:
```typescript
{
  "data": {
    "user": {
      "review_status": {
        "type": "supplier" | "agent" | "retailer",
        "entity_id": 42,
        "status": "pending" | "approved" | "modify" | "rejected" | "draft"
      }
    }
  }
}
```

#### 4. Notification Integration

When admin requests modification, backend creates a notification:
```json
{
  "notification_type": "modification",
  "title": "Supplier Modification",
  "body": "Your supplier '<name>' has been modification. Reason: <admin's reason>"
}
```

The `review_reason` field is also available via GET `/suppliers/:id`:
```json
{
  "data": {
    "id": 42,
    "name": "My Business",
    "review_reason": "Please update your business license - current document is expired.",
    "review_status": "modify"
  }
}
```

## User Flow

### Scenario 1: Admin Requests Modification
1. Supplier logs in
2. App reads `review_status.status === "modify"`
3. User is routed to `/onboarding/changes-requested`
4. Screen loads supplier data and displays admin's `review_reason`
5. Supplier updates fields and/or re-uploads documents
6. Supplier clicks "Resubmit Application"
7. POST to `/suppliers/:id/resubmit` with corrections
8. Status changes to `pending`, reason is cleared
9. User is redirected to `/onboarding/pending-approval`

### Scenario 2: Application Rejected
1. Supplier logs in
2. App reads `review_status.status === "rejected"`
3. User is routed to `/onboarding/rejected`
4. Screen shows rejection reason (if available)
5. User can start new application or go back to login

### Scenario 3: Status Changes While on Pending Screen
1. Supplier is waiting on `/onboarding/pending-approval`
2. Admin requests modification
3. Supplier backgrounds and then foregrounds the app
4. App fetches latest user profile via `authMe()`
5. Status detected as `modify`
6. User is auto-redirected to `/onboarding/changes-requested`

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/suppliers/:id` | GET | Fetch supplier details + review_reason |
| `/suppliers/my_suppliers` | GET | Fetch all suppliers for current user |
| `/suppliers/:id/resubmit` | POST | Resubmit supplier application after modification |
| `/agents/:id` | GET | Fetch agent details + review_reason |
| `/agents/:id/resubmit` | POST | Resubmit agent application after modification |
| `/auth/login` | POST | Returns user with review_status |
| `/auth/refresh` | POST | Returns updated user with review_status |
| `/auth/me` | GET | Returns current user with review_status |

## Error Handling

### Network Errors
- All API calls wrapped in try-catch
- User-friendly error messages displayed via Alert
- Console logging for debugging

### Missing Data
- Validates `entityId` exists before API calls
- Shows loading state while fetching data
- Gracefully handles missing `review_reason`

### Invalid States
- Backend validates resubmit only allowed from `modify` state
- Returns 422 if called from other states
- Mobile handles by showing error alert

## Testing Checklist

- [ ] Login as supplier with `status: "modify"` → should route to changes-requested
- [ ] Login as supplier with `status: "rejected"` → should route to rejected
- [ ] Login as agent with `status: "modify"` → should route to changes-requested
- [ ] Changes-requested screen loads supplier data correctly
- [ ] Changes-requested screen displays review_reason
- [ ] Can edit fields and re-upload documents
- [ ] Resubmit button disabled while submitting
- [ ] Successful resubmit redirects to pending-approval
- [ ] Error messages display when resubmit fails
- [ ] Pending screen polls for status changes on app foreground
- [ ] Status change from `modify` auto-redirects to changes-requested
- [ ] Status change from `pending` to `approved` auto-redirects to dashboard
- [ ] Rejected screen shows reason and allows new application

## Backend Requirements

The mobile implementation assumes the following backend behavior:

1. **Login/Refresh Response:**
   - Returns `review_status` object with `type`, `entity_id`, `status`

2. **GET `/suppliers/:id`:**
   - Returns supplier with `review_reason` field (null if not in modify/rejected state)

3. **POST `/suppliers/:id/resubmit`:**
   - Accepts FormData with optional corrected fields
   - Accepts optional file uploads
   - Only valid from `modify` state
   - Transitions to `pending` state and clears `review_reason`
   - Returns updated supplier object

4. **Notifications:**
   - Sends push notification when status changes to `modify`
   - Notification body contains admin's reason

## Future Enhancements

1. **Add periodic polling** in addition to foreground refresh (e.g., every 30 seconds)
2. **Add "View Documents"** to see currently uploaded documents
3. **Add field-level validation** before allowing resubmit
4. **Add progress indicator** for file uploads
5. **Add image preview** for uploaded documents
6. **Implement for retailers** if they gain review_status flow

## Related Files

- `/app/onboarding/changes-requested.tsx` - Main modification screen
- `/app/onboarding/rejected.tsx` - Rejection screen
- `/app/onboarding/pending-approval.tsx` - Pending/polling screen
- `/app/login.tsx` - Login flow with status routing
- `/lib/api/clients.ts` - API client functions
- `/lib/sdk/context.tsx` - SDK context with user state
- `/lib/sdk/provider.tsx` - SDK provider with fetchUser

## Contract Reference

See the original specification: `mobile-supplier-modification-flow.md`
