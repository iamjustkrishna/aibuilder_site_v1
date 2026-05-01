# Certificate Management - API Specification

## Overview

This document specifies the backend API endpoints needed to power the Certificate Management component. The component is fully functional with mock data, but will use these endpoints when the backend is ready.

## Endpoints Required

### 1. GET /api/admin/cohorts

**Purpose**: Fetch list of all cohorts for selection dropdown

**Method**: `GET`
**Path**: `/api/admin/cohorts`
**Auth**: Admin required

**Query Parameters**: None

**Response (200 OK)**:
```json
{
  "cohorts": [
    {
      "id": "cohort-0",
      "code": "COHORT-0",
      "name": "Cohort 0 (Current)",
      "user_count": 12,
      "is_current": true
    },
    {
      "id": "cohort-1",
      "code": "COHORT-1",
      "name": "Cohort 1",
      "user_count": 8,
      "is_current": false
    }
  ]
}
```

**Error (403 Forbidden)**:
```json
{ "error": "Admin access required" }
```

**Example Implementation**:
```typescript
const response = await fetch('/api/admin/cohorts')
const { cohorts } = await response.json()
setCohorts(cohorts)
```

---

### 2. GET /api/admin/cohorts/{cohort_id}/users

**Purpose**: Fetch users in a specific cohort for selection table

**Method**: `GET`
**Path**: `/api/admin/cohorts/{cohort_id}/users`
**Auth**: Admin required

**Path Parameters**:
- `cohort_id` (string, required) - The cohort ID (e.g., "cohort-0")

**Query Parameters**: None

**Response (200 OK)**:
```json
{
  "users": [
    {
      "id": "user-1",
      "full_name": "John Doe",
      "email": "john@example.com",
      "membership_tier": "foundational",
      "avatar_url": "https://ui-avatars.com/api/?name=John+Doe"
    },
    {
      "id": "user-2",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "membership_tier": "builder",
      "avatar_url": "https://ui-avatars.com/api/?name=Jane+Smith"
    }
  ]
}
```

**Error (404 Not Found)**:
```json
{ "error": "Cohort not found" }
```

**Error (403 Forbidden)**:
```json
{ "error": "Admin access required" }
```

**Example Implementation**:
```typescript
const response = await fetch(`/api/admin/cohorts/${cohortId}/users`)
const { users } = await response.json()
setUsers(users)
```

---

### 3. POST /api/admin/certificates/generate

**Purpose**: Queue certificate generation for selected users

**Method**: `POST`
**Path**: `/api/admin/certificates/generate`
**Auth**: Admin required
**Content-Type**: `application/json`

**Request Body**:
```json
{
  "user_ids": ["user-1", "user-2", "user-3"],
  "cohort_id": "cohort-0"
}
```

**Response (200 OK)**:
```json
{
  "job_id": "job-abc123def",
  "queued_count": 3,
  "queue_time": "2024-01-15T10:30:00Z",
  "estimated_completion": "2024-01-15T10:35:00Z"
}
```

**Error (400 Bad Request)**:
```json
{ "error": "Invalid user IDs", "details": "Some users not in cohort" }
```

**Error (403 Forbidden)**:
```json
{ "error": "Admin access required" }
```

**Example Implementation**:
```typescript
const response = await fetch('/api/admin/certificates/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_ids: Array.from(selectedUsers),
    cohort_id: selectedCohort
  })
})
const { job_id, queued_count } = await response.json()
setToastMessage(`Queued ${queued_count} certificate(s)...`)
```

---

### 4. GET /api/admin/certificates/status

**Purpose**: Poll current status of certificate generation jobs

**Method**: `GET`
**Path**: `/api/admin/certificates/status`
**Auth**: Admin required

**Query Parameters**:
- `user_ids` (string, required) - Comma-separated user IDs
  - Example: `?user_ids=user-1,user-2,user-3`

**Response (200 OK)**:
```json
{
  "statuses": [
    {
      "user_id": "user-1",
      "full_name": "John Doe",
      "email": "john@example.com",
      "status": "generated",
      "certificate_url": "https://certificates.aibuilder.space/user-1.pdf",
      "visibility": "hidden",
      "generated_at": "2024-01-15T10:33:45Z",
      "progress_percent": 100
    },
    {
      "user_id": "user-2",
      "full_name": "Jane Smith",
      "email": "jane@example.com",
      "status": "generating",
      "visibility": "hidden",
      "progress_percent": 75
    },
    {
      "user_id": "user-3",
      "full_name": "Bob Wilson",
      "email": "bob@example.com",
      "status": "failed",
      "visibility": "hidden",
      "error_message": "PDF generation failed - invalid course data",
      "progress_percent": 100
    }
  ]
}
```

**Status Values**:
- `"pending"` - Waiting in queue
- `"in_queue"` - Ready to process
- `"generating"` - Currently generating
- `"generated"` - Successfully created, ready to download
- `"failed"` - Generation failed, check error_message

**Error (400 Bad Request)**:
```json
{ "error": "Missing user_ids parameter" }
```

**Error (403 Forbidden)**:
```json
{ "error": "Admin access required" }
```

**Example Implementation**:
```typescript
useEffect(() => {
  if (!pollingActive) return
  
  const timer = setInterval(async () => {
    const userIds = Array.from(selectedUsers).join(',')
    const response = await fetch(
      `/api/admin/certificates/status?user_ids=${userIds}`
    )
    const { statuses } = await response.json()
    setCertificateStatuses(statuses)
    
    // Stop polling if all done
    const allDone = statuses.every(s => 
      s.status === "generated" || s.status === "failed"
    )
    if (allDone) setPollingActive(false)
  }, 2000)
  
  return () => clearInterval(timer)
}, [pollingActive, selectedUsers])
```

---

### 5. PATCH /api/admin/certificates/{user_id}/visibility

**Purpose**: Toggle certificate visibility on user's dashboard

**Method**: `PATCH`
**Path**: `/api/admin/certificates/{user_id}/visibility`
**Auth**: Admin required
**Content-Type**: `application/json`

**Path Parameters**:
- `user_id` (string, required) - The user ID

**Request Body**:
```json
{
  "visibility": "visible"
}
```

**Visibility Values**:
- `"visible"` - Show on user's dashboard
- `"hidden"` - Hide from user's dashboard

**Response (200 OK)**:
```json
{
  "user_id": "user-1",
  "visibility": "visible",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

**Error (404 Not Found)**:
```json
{ "error": "Certificate not found for user" }
```

**Error (400 Bad Request)**:
```json
{ "error": "Invalid visibility value", "valid_values": ["visible", "hidden"] }
```

**Error (403 Forbidden)**:
```json
{ "error": "Admin access required" }
```

**Example Implementation**:
```typescript
const handleToggleVisibility = async (userId) => {
  const status = certificateStatuses.find(s => s.user_id === userId)
  const newVisibility = status.visibility === "visible" ? "hidden" : "visible"
  
  // Optimistic update
  setCertificateStatuses(prev =>
    prev.map(s =>
      s.user_id === userId ? { ...s, visibility: newVisibility } : s
    )
  )
  
  // Actual API call
  const response = await fetch(
    `/api/admin/certificates/${userId}/visibility`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visibility: newVisibility })
    }
  )
  
  if (!response.ok) {
    // Revert on error
    setCertificateStatuses(prev =>
      prev.map(s =>
        s.user_id === userId ? { ...s, visibility: status.visibility } : s
      )
    )
  }
}
```

---

## Data Models

### Cohort Object
```typescript
interface Cohort {
  id: string                  // Unique identifier
  code: string               // Human-readable code (e.g., "COHORT-0")
  name: string               // Display name
  user_count: number         // Number of users in cohort
  is_current: boolean        // Whether this is the active cohort
}
```

### User Object
```typescript
interface CohortUser {
  id: string                 // User ID
  full_name: string          // User's full name
  email: string              // Email address
  membership_tier: string    // "initial" | "foundational" | "builder" | "architect"
  avatar_url?: string        // Avatar image URL (optional)
}
```

### Certificate Status Object
```typescript
interface CertificateStatus {
  user_id: string            // User ID
  full_name: string          // User's name
  email: string              // User's email
  status: string             // "pending" | "in_queue" | "generating" | "generated" | "failed"
  certificate_url?: string   // URL to download (if generated)
  visibility: string         // "visible" | "hidden"
  error_message?: string     // Error description (if failed)
  generated_at?: string      // ISO timestamp of generation
  progress_percent?: number  // 0-100 percentage complete
}
```

---

## Authentication

All endpoints require admin authentication. The component assumes:
- User making requests is already authenticated
- An auth check happens server-side
- Return 403 if user is not admin

**Implementation suggestion**:
```typescript
async function isAdminUser(userId: string, email: string): Promise<boolean> {
  // Check admin_emails table or similar
  const result = await db.query(
    'SELECT * FROM admin_emails WHERE email = ?',
    [email]
  )
  return result.length > 0
}
```

---

## Error Handling

### Component Expects
1. **Standard HTTP status codes**:
   - 200 = Success
   - 400 = Bad request
   - 403 = Not authorized (admin required)
   - 404 = Not found
   - 500 = Server error

2. **Error Response Format**:
```json
{
  "error": "Human readable error message",
  "details": "Optional additional details"
}
```

3. **Timeouts**:
   - Handle network timeouts gracefully
   - Show error message after 10 seconds of no response
   - Allow user to retry

---

## Rate Limiting

**Recommended**:
- Generate endpoint: 10 requests per minute per user
- Status endpoint: Unlimited (safe to poll every 2 seconds)
- Visibility endpoint: 100 requests per minute per user

---

## Performance Considerations

### Polling Strategy
- Frequency: Every 2 seconds
- Stop condition: When all statuses are "generated" or "failed"
- Fallback: Stop after 5 minutes regardless

### Batch Size
- Support queuing up to 1000 certificates at once
- Return statuses incrementally if large batch

### Database Optimization
- Index on (user_id, cohort_id) for quick lookups
- Index on status for filtering
- Archive old records after 30 days

---

## Testing the Endpoints

### Using cURL

**Test 1: Get cohorts**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.aibuilder.space/api/admin/cohorts
```

**Test 2: Get users in cohort**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.aibuilder.space/api/admin/cohorts/cohort-0/users
```

**Test 3: Generate certificates**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["user-1", "user-2"],
    "cohort_id": "cohort-0"
  }' \
  https://api.aibuilder.space/api/admin/certificates/generate
```

**Test 4: Check status**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  'https://api.aibuilder.space/api/admin/certificates/status?user_ids=user-1,user-2'
```

**Test 5: Toggle visibility**
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"visibility": "visible"}' \
  https://api.aibuilder.space/api/admin/certificates/user-1/visibility
```

---

## Migration from Mock to Real

### Step 1: Update Component
Replace mock data imports in `certificate-management.tsx`:

```typescript
// OLD (before)
import { MOCK_COHORTS, MOCK_USERS } from "@/lib/certificate-utils"

// NEW (after)
// Remove mock imports, use real API calls instead
```

### Step 2: Replace Data Fetching
```typescript
// OLD: generateMockStatuses(userIds)
// NEW: POST to generate endpoint

// OLD: updateProgressStepSimulation()
// NEW: GET status from endpoint

// OLD: direct state update for visibility
// NEW: PATCH to visibility endpoint
```

### Step 3: Test
- Run component against real API
- Verify all actions work as expected
- Test error scenarios
- Check performance with real data

---

## Implementation Checklist

- [ ] Implement GET /api/admin/cohorts
- [ ] Implement GET /api/admin/cohorts/{cohort_id}/users
- [ ] Implement POST /api/admin/certificates/generate
- [ ] Implement GET /api/admin/certificates/status
- [ ] Implement PATCH /api/admin/certificates/{user_id}/visibility
- [ ] Add admin authentication to all endpoints
- [ ] Add error handling for all scenarios
- [ ] Test with cURL or Postman
- [ ] Test with frontend component
- [ ] Document any deviations from spec
- [ ] Set up monitoring and logging

---

## Notes

1. **Certificate URLs**: Implement storage system for generated PDFs
2. **Job Queue**: Use BullMQ or similar for async generation
3. **Database**: Create tables for cohort_enrollments, certificates, visibility_settings
4. **Logging**: Log all generation attempts for audit trail
5. **Notifications**: Consider emailing users when certificates are ready

---

**Ready to implement?** Contact your backend team with this specification!
