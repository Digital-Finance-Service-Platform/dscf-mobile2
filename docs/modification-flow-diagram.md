# Supplier Modification Flow - State Diagram

## Review Status State Machine

```
┌─────────────────────────────────────────────────────────────────┐
│                      SUPPLIER/AGENT LIFECYCLE                    │
└─────────────────────────────────────────────────────────────────┘

        REGISTRATION
             │
             ▼
    ┌────────────────┐
    │     DRAFT      │  (User not yet submitted)
    └────────────────┘
             │
             │ Submit Application
             ▼
    ┌────────────────┐
    │    PENDING     │◄──────────────────┐
    └────────────────┘                   │
             │                           │
             │ Admin Reviews             │
             │                           │
        ┌────┴────┬────────┐            │
        │         │        │            │
        ▼         ▼        ▼            │
   ┌─────────┐ ┌────────┐ ┌──────────┐ │
   │APPROVED │ │ MODIFY │ │ REJECTED │ │
   └─────────┘ └────────┘ └──────────┘ │
        │          │                    │
        │          │ User Resubmits     │
        │          └────────────────────┘
        │
        ▼
   USER ENTERS APP
```

## Mobile Screen Routing

```
LOGIN SCREEN
     │
     │ authLogin() → review_status
     │
     ├─ status === "draft" ──────────► Continue Onboarding
     │
     ├─ status === "pending" ────────► /onboarding/pending-approval
     │                                         │
     │                                         │ App Foreground
     │                                         │ → fetchUser()
     │                                         │
     │                                         ├─ status changes to "modify" ──►
     │                                         │
     │                                         └─ status changes to "approved" ─► Dashboard
     │
     ├─ status === "modify" ─────────► /onboarding/changes-requested
     │                                         │
     │                                         │ Load supplier/:id
     │                                         │ → display review_reason
     │                                         │
     │                                         │ User edits + resubmits
     │                                         │ POST /:id/resubmit
     │                                         │
     │                                         └─► /onboarding/pending-approval
     │
     ├─ status === "rejected" ───────► /onboarding/rejected
     │                                         │
     │                                         └─ "Start New Application" ──► /onboarding/role
     │
     └─ status === "approved" ───────► Dashboard / Main App
```

## Data Flow

### Login Flow
```
┌──────────────┐
│ Login Screen │
└──────┬───────┘
       │
       │ POST /auth/login
       │ { email_or_phone, password }
       │
       ▼
┌──────────────────────────────────────────────┐
│ Backend Response                             │
│ {                                            │
│   data: {                                    │
│     access_token: "...",                     │
│     user: {                                  │
│       review_status: {                       │
│         type: "supplier",                    │
│         entity_id: 42,                       │
│         status: "modify"  ◄─── Check this   │
│       }                                      │
│     }                                        │
│   }                                          │
│ }                                            │
└──────────────────────────────────────────────┘
       │
       │ Route based on status
       │
       ▼
┌───────────────────────┐
│ Changes Requested UI  │
└───────────────────────┘
```

### Changes Requested Screen Flow
```
┌────────────────────────────┐
│ Changes Requested Screen   │
└────────────┬───────────────┘
             │
             │ GET /suppliers/:entity_id
             │ Authorization: Bearer <token>
             │
             ▼
┌────────────────────────────────────────┐
│ Supplier Data + Review Reason          │
│ {                                      │
│   data: {                              │
│     id: 42,                            │
│     name: "My Business",               │
│     address: "123 Main St",            │
│     review_reason: "Update license",   │  ◄─── Display this
│     review_status: "modify"            │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
             │
             │ Pre-fill form fields
             │
             ▼
┌────────────────────────────┐
│ User Edits & Uploads Docs  │
└────────────┬───────────────┘
             │
             │ POST /suppliers/:id/resubmit
             │ Content-Type: multipart/form-data
             │
             │ FormData:
             │   supplier[name]: "Updated Name"
             │   supplier[address]: "New Address"
             │   business_license: <file>
             │
             ▼
┌────────────────────────────────────────┐
│ Updated Supplier                       │
│ {                                      │
│   data: {                              │
│     id: 42,                            │
│     review_status: "pending",  ◄───────┼─ Changed
│     review_reason: null        ◄───────┼─ Cleared
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
             │
             │ Success Alert
             │
             ▼
┌────────────────────────────┐
│ Pending Approval Screen    │
└────────────────────────────┘
```

### Polling Flow (App Foreground)
```
┌────────────────────────────┐
│ Pending Approval Screen    │
│ (status: "pending")        │
└────────────┬───────────────┘
             │
             │ User backgrounds app
             │ Admin changes status to "modify"
             │ User foregrounds app
             │
             ▼
┌────────────────────────────┐
│ AppState Listener          │
│ "inactive" → "active"      │
└────────────┬───────────────┘
             │
             │ fetchUser()
             │
             ▼
┌────────────────────────────┐
│ GET /auth/me               │
│ Authorization: Bearer      │
└────────────┬───────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Updated User Profile                   │
│ {                                      │
│   data: {                              │
│     user: {                            │
│       review_status: {                 │
│         status: "modify"  ◄────────────┼─ Detected change
│       }                                │
│     }                                  │
│   }                                    │
│ }                                      │
└────────────────────────────────────────┘
             │
             │ useEffect detects change
             │
             ▼
┌────────────────────────────┐
│ Auto-redirect to           │
│ Changes Requested Screen   │
└────────────────────────────┘
```

## Status Transition Table

| Current Status | Trigger | Next Status | Mobile Action |
|---------------|---------|-------------|---------------|
| `draft` | User submits | `pending` | → /onboarding/pending-approval |
| `pending` | Admin approves | `approved` | → Dashboard |
| `pending` | Admin requests changes | `modify` | → /onboarding/changes-requested |
| `pending` | Admin rejects | `rejected` | → /onboarding/rejected |
| `modify` | User resubmits | `pending` | → /onboarding/pending-approval |
| `rejected` | User starts new | `draft` | → /onboarding/role |
| `approved` | N/A | `approved` | → Dashboard |

## Notification Flow

```
┌─────────────────┐
│  Admin Panel    │
└────────┬────────┘
         │
         │ Admin clicks "Request Changes"
         │ Inputs reason: "Update license"
         │
         ▼
┌────────────────────────────────────────┐
│ Backend: NotificationService.deliver   │
│                                        │
│ Creates notification:                  │
│ {                                      │
│   type: "modification",                │
│   title: "Supplier Modification",     │
│   body: "Your supplier has been       │
│          modification. Reason:        │
│          Update license"              │
│ }                                      │
│                                        │
│ Updates supplier:                      │
│ {                                      │
│   review_status: "modify",             │
│   review_reason: "Update license"      │
│ }                                      │
└────────────────────────────────────────┘
         │
         │ Push Notification
         │
         ▼
┌────────────────────────────┐
│  Supplier's Phone          │
│  "Your supplier has been   │
│   modification. Reason:    │
│   Update license"          │
└────────────────────────────┘
         │
         │ User taps notification or logs in
         │
         ▼
┌────────────────────────────┐
│ Changes Requested Screen   │
│ Shows review_reason        │
└────────────────────────────┘
```

## Key Implementation Points

### 1. Review Status Detection
```typescript
const reviewStatus = loginResult?.data?.user?.review_status;
const status = reviewStatus?.status;
const entityId = reviewStatus?.entity_id;
```

### 2. Status Branching
```typescript
if (status === "modify") {
  router.replace({
    pathname: "/onboarding/changes-requested",
    params: { role, entityId: String(entityId) }
  });
}
```

### 3. Polling on Foreground
```typescript
AppState.addEventListener("change", async (nextAppState) => {
  if (appState.current.match(/inactive|background/) && nextAppState === "active") {
    await fetchUser(); // Refresh review_status
  }
});
```

### 4. Resubmit Endpoint
```typescript
POST /suppliers/:entity_id/resubmit
FormData:
  - supplier[name]: optional
  - supplier[address]: optional
  - business_license: optional file
```

## Related Documentation
- Implementation details: `docs/supplier-modification-flow-implementation.md`
- Testing guide: `docs/testing-modification-flow.md`
- API contract: `mobile-supplier-modification-flow.md`
