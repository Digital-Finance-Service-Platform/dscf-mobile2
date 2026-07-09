# Testing the Supplier Modification Flow

## Quick Test Guide

### Prerequisites
- Backend running with modification flow support (gem `dscf-marketplace 0.13.9+`)
- Admin access to modify supplier/agent applications
- Test supplier/agent accounts

### Test Scenarios

## 1. Initial Modification Request

### Setup
1. Create a supplier application (via `/onboarding/supplier`)
2. Submit application (status becomes `pending`)
3. Admin reviews and clicks "Request Changes"
4. Admin provides reason: "Please update business license - current document is expired"

### Expected Behavior
1. Supplier receives push notification
2. Supplier's `review_status.status` changes to `"modify"`
3. Next login routes to `/onboarding/changes-requested`
4. Screen shows:
   - Admin feedback card with orange warning icon
   - Reason text: "Please update business license..."
   - Current business information (pre-filled)
   - Document upload options
   - "Resubmit Application" button

### Test Steps
```bash
# Login as the supplier
Phone: +251912345678
Password: supplier123

# Expected: Automatically routed to changes-requested screen
```

---

## 2. Edit and Resubmit

### Test Steps
1. On changes-requested screen, update "Business Name"
2. Tap "Upload new business license"
3. Select a PDF document
4. Tap "Resubmit Application"

### Expected Behavior
- Loading indicator shown on button
- POST to `/suppliers/:id/resubmit` with FormData
- Success alert: "Your application has been resubmitted for review"
- Redirect to `/onboarding/pending-approval`
- Status is now `"pending"`
- `review_reason` is cleared

---

## 3. Application Rejection

### Setup
1. Admin reviews application
2. Admin clicks "Reject"
3. Admin provides reason: "Business license is not valid for this region"

### Expected Behavior
1. Supplier's `review_status.status` changes to `"rejected"`
2. Next login routes to `/onboarding/rejected`
3. Screen shows:
   - Red error icon
   - "Application Rejected" title
   - Rejection reason in red card
   - Options: "Start New Application" or "Back to Login"

### Test Steps
```bash
# Login as the supplier
Phone: +251912345678
Password: supplier123

# Expected: Automatically routed to rejected screen
```

---

## 4. Status Change While Waiting

### Setup
1. Supplier is on `/onboarding/pending-approval` (status: `pending`)
2. Admin requests modification (status changes to `modify`)

### Test Steps
1. Supplier is on pending-approval screen
2. Admin changes status to `modify` in admin panel
3. Supplier backgrounds the app (press home)
4. Supplier foregrounds the app (tap app icon)

### Expected Behavior
- App calls `authMe()` to refresh user profile
- Detects `review_status.status === "modify"`
- Auto-redirects to `/onboarding/changes-requested`
- Shows admin's new feedback

---

## 5. Agent Modification Flow

Same as supplier flow, but:
- Role: `"agent"`
- Entity type: `agent`
- No document uploads (agents don't upload documents)
- Resubmit endpoint: `/agents/:id/resubmit`

### Test Steps
```bash
# Login as the agent
Phone: +251923456789
Password: agent123

# Expected: If status is "modify", routed to changes-requested
# Screen shows agent-specific fields (no document section)
```

---

## API Test Cases

### Test 1: Fetch Supplier with Review Reason
```bash
curl -X GET \
  https://api.example.com/marketplace/suppliers/42 \
  -H "Authorization: Bearer <token>"

# Expected response:
{
  "data": {
    "id": 42,
    "name": "Test Business",
    "review_reason": "Please update your business license",
    "review_status": "modify"
  }
}
```

### Test 2: Resubmit with Corrections
```bash
curl -X POST \
  https://api.example.com/marketplace/suppliers/42/resubmit \
  -H "Authorization: Bearer <token>" \
  -F "supplier[name]=Updated Business Name" \
  -F "supplier[contact_phone]=+251912000000" \
  -F "business_license=@/path/to/new-license.pdf"

# Expected response:
{
  "data": {
    "id": 42,
    "name": "Updated Business Name",
    "review_reason": null,
    "review_status": "pending"
  }
}
```

### Test 3: Login Response with Modify Status
```bash
curl -X POST \
  https://api.example.com/core/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email_or_phone": "+251912345678",
    "password": "supplier123"
  }'

# Expected response includes:
{
  "data": {
    "access_token": "...",
    "user": {
      "review_status": {
        "type": "supplier",
        "entity_id": 42,
        "status": "modify"
      }
    }
  }
}
```

---

## Edge Cases to Test

### 1. Empty Resubmit
- Submit without changing any fields
- Expected: Resubmit succeeds (just re-opens review)

### 2. Partial Update
- Only change business name, leave others as-is
- Expected: Only name is updated, others unchanged

### 3. Documents Only
- Don't change any text fields, only re-upload license
- Expected: Resubmit succeeds with new document

### 4. Invalid Entity ID
- Manually navigate to changes-requested with wrong ID
- Expected: Error alert "Failed to load supplier data"

### 5. Network Failure During Resubmit
- Disconnect network before tapping resubmit
- Expected: Error alert "Network error during supplier resubmit"

### 6. Invalid State Resubmit
- Try to call resubmit when status is `pending` or `approved`
- Expected: Backend returns 422, app shows error

### 7. Multiple Documents
- Upload 3 additional documents
- Expected: All documents shown in list, all uploaded on resubmit

---

## Manual QA Checklist

### UI/UX
- [ ] Admin feedback card displays with correct styling (orange warning)
- [ ] Reason text is readable and wraps properly
- [ ] Input fields are pre-filled with current data
- [ ] Document picker works on both iOS and Android
- [ ] Selected files show check icon
- [ ] Multiple documents display in list
- [ ] Resubmit button shows loading spinner
- [ ] Success alert appears after resubmit
- [ ] Navigation flows correctly after resubmit

### Functionality
- [ ] Fetches supplier data on screen load
- [ ] Displays review_reason correctly
- [ ] All fields are editable
- [ ] File picker opens correctly
- [ ] Can select PDF and image files
- [ ] FormData built correctly with all fields
- [ ] POST request succeeds
- [ ] Redirects to pending-approval after success
- [ ] Error alerts display on failure

### Polling/Refresh
- [ ] App foreground triggers user profile refresh
- [ ] Status change detected correctly
- [ ] Auto-redirect works from pending to changes-requested
- [ ] Auto-redirect works from pending to rejected
- [ ] No infinite loops or repeated redirects

### Cross-Role
- [ ] Works for suppliers
- [ ] Works for agents (no document section)
- [ ] Rejected screen works for all roles
- [ ] Role-specific titles display correctly

---

## Debugging Tips

### Check Review Status
Add debug logging in login flow:
```typescript
console.log("Review Status:", loginResult?.data?.user?.review_status);
```

### Monitor API Calls
Check network logs for:
- `/auth/login` - Should return review_status
- `/auth/me` - Should be called on foreground
- `/suppliers/:id` - Should load supplier data
- `/suppliers/:id/resubmit` - Should be called on submit

### Common Issues

**Issue: Not routing to changes-requested**
- Check: `review_status.status === "modify"` in login response
- Check: `entityId` is passed in route params

**Issue: No admin feedback showing**
- Check: Backend returns `review_reason` field
- Check: Field is not null/empty

**Issue: Resubmit fails with 422**
- Check: Current status is `modify` (not `pending` or `approved`)
- Check: Using correct endpoint `/suppliers/:id/resubmit`

**Issue: Documents not uploading**
- Check: FormData is properly constructed
- Check: File URIs are valid
- Check: Content-Type header not manually set (let fetch handle it)

**Issue: Not redirecting after status change**
- Check: AppState listener is registered
- Check: `fetchUser()` is called on foreground
- Check: useEffect dependency array includes `user`

---

## Success Criteria

✅ Supplier with `modify` status routes to changes-requested screen
✅ Admin feedback displays clearly
✅ Fields are editable and pre-filled
✅ Documents can be uploaded
✅ Resubmit sends correct data
✅ Status changes to `pending` after resubmit
✅ Redirects to pending-approval after success
✅ App detects status changes when foregrounded
✅ Auto-redirects work correctly
✅ Error handling provides clear feedback
✅ Works for both suppliers and agents
✅ Rejected flow works correctly
