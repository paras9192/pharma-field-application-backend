# Pharma Field API — Frontend Contract

> **Base URL:** `http://localhost:3000/api/v1`  
> **Swagger UI:** `http://localhost:3000/api/docs`  
> **Content-Type:** `application/json` for all requests

---

## Table of Contents

1. [Global Conventions](#1-global-conventions)
2. [Authentication](#2-authentication)
3. [Users](#3-users)
4. [Territories](#4-territories)
5. [Doctors](#5-doctors)
6. [Chemists](#6-chemists)
7. [Attendance](#7-attendance)
8. [Visits](#8-visits)
9. [Daily Reports](#9-daily-reports)
10. [Dashboard](#10-dashboard)
11. [Enums Reference](#11-enums-reference)
12. [Role-Permission Matrix](#12-role-permission-matrix)
13. [TypeScript Types](#13-typescript-types)

---

## 1. Global Conventions

### Request Headers

Every protected endpoint requires:
```
Authorization: Bearer <accessToken>
Content-Type: application/json
```

### Success Response Envelope

All successful responses are wrapped:

```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated Response Envelope

List endpoints return:

```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Error Response Envelope

All errors return:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": ["name must be a string"]
  },
  "path": "/api/v1/users",
  "timestamp": "2026-06-20T10:00:00.000Z"
}
```

### Common Query Params (Paginated Endpoints)

| Param    | Type   | Default | Description              |
|----------|--------|---------|--------------------------|
| `page`   | number | `1`     | Page number (min: 1)     |
| `limit`  | number | `20`    | Items per page (max: 100)|
| `search` | string | —       | Full-text search term    |

### HTTP Status Codes

| Code | Meaning                  |
|------|--------------------------|
| 200  | OK                       |
| 201  | Created                  |
| 400  | Bad Request / Validation |
| 401  | Unauthorized             |
| 403  | Forbidden (wrong role)   |
| 404  | Not Found                |
| 409  | Conflict (duplicate)     |
| 500  | Internal Server Error    |

---

## 2. Authentication

### POST `/auth/login`

Login with email and password. No auth header required.

**Request Body:**
```json
{
  "email": "admin@pharmafield.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a0042b16aa16777d0f3cfe9d695beb8cab242b...",
    "user": {
      "id": "uuid",
      "name": "Super Admin",
      "email": "admin@pharmafield.com",
      "phone": "9999999999",
      "role": "SUPER_ADMIN",
      "employeeCode": "EMP001",
      "profilePhoto": null
    }
  }
}
```

> **Token lifetime:** accessToken = 15 minutes, refreshToken = 30 days  
> Store both tokens. Use refreshToken to get a new accessToken before expiry.

---

### POST `/auth/refresh`

Get a new access token using a refresh token. No auth header required.

**Request Body:**
```json
{
  "refreshToken": "a0042b16aa16777..."
}
```

**Response:** Same shape as `/auth/login`.

---

### POST `/auth/logout`

🔒 **Auth required**

Invalidates the refresh token.

**Request Body:**
```json
{
  "refreshToken": "a0042b16aa16777..."
}
```

**Response:**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

### GET `/auth/me`

🔒 **Auth required**

Returns the full profile of the currently logged-in user.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Super Admin",
    "email": "admin@pharmafield.com",
    "phone": "9999999999",
    "roleId": 1,
    "employeeCode": "EMP001",
    "profilePhoto": null,
    "dateOfJoining": "2024-01-01T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "role": { "id": 1, "name": "SUPER_ADMIN", "description": "..." },
    "employeeTerritories": [
      {
        "territory": {
          "id": 1,
          "name": "Mumbai West",
          "city": {
            "name": "Mumbai",
            "district": {
              "name": "Mumbai City",
              "state": { "name": "Maharashtra", "code": "MH" }
            }
          }
        }
      }
    ]
  }
}
```

---

## 3. Users

> **Access:** SUPER_ADMIN, ADMIN (except `change-password` which is all roles)

### POST `/users`

Create a new user.

**Request Body:**
```json
{
  "name": "Raj Sharma",
  "email": "raj@company.com",
  "phone": "9876543210",
  "password": "SecurePass1",
  "role": "MR",
  "employeeCode": "EMP002",
  "dateOfJoining": "2026-01-15"
}
```

| Field          | Type   | Required | Notes                                           |
|----------------|--------|----------|-------------------------------------------------|
| `name`         | string | ✅       |                                                 |
| `email`        | string | ✅       | Must be unique                                  |
| `phone`        | string | ✅       | Must be unique                                  |
| `password`     | string | ✅       | Min 8 chars, must have upper + lower + number   |
| `role`         | enum   | ✅       | `SUPER_ADMIN` `ADMIN` `MR` `SALES_PERSON`       |
| `employeeCode` | string | ❌       | Must be unique if provided                      |
| `dateOfJoining`| string | ❌       | ISO date `YYYY-MM-DD`                           |

**Response:** User object (no passwordHash).

---

### GET `/users`

List users with optional filters.

**Query Params:**

| Param      | Type   | Description                                         |
|------------|--------|-----------------------------------------------------|
| `page`     | number | Default: 1                                          |
| `limit`    | number | Default: 20                                         |
| `search`   | string | Searches name, email, phone, employeeCode           |
| `role`     | enum   | Filter by role                                      |
| `isActive` | string | `"true"` or `"false"`                               |

**Response:** Paginated list of user objects.

---

### GET `/users/:id`

Get a single user by ID including their territory assignments.

---

### PATCH `/users/:id`

Update user details.

**Request Body (all optional):**
```json
{
  "name": "Raj Sharma Updated",
  "phone": "9876543211",
  "employeeCode": "EMP002-A",
  "profilePhoto": "https://...",
  "dateOfJoining": "2026-01-15",
  "isActive": true
}
```

---

### PATCH `/users/:id/toggle-active`

Toggle user's active/inactive status. No body required.

---

### POST `/users/me/change-password`

🔒 **All roles** — Change your own password.

**Request Body:**
```json
{
  "currentPassword": "OldPass1",
  "newPassword": "NewPass1"
}
```

---

### POST `/users/:id/reset-password`

Admin reset of any user's password.

**Request Body:**
```json
{
  "password": "NewTemp1234"
}
```

---

## 4. Territories

### GET `/territories/hierarchy`

🔒 **All roles**

Returns full State → District → City → Territory tree.

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Maharashtra",
      "code": "MH",
      "districts": [
        {
          "id": 1,
          "name": "Mumbai City",
          "cities": [
            {
              "id": 1,
              "name": "Mumbai",
              "territories": [
                { "id": 1, "name": "Andheri West", "code": "MH-MUM-AW", "isActive": true }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

---

### POST `/territories/states`

> **Access:** SUPER_ADMIN, ADMIN

```json
{ "name": "Maharashtra", "code": "MH" }
```

---

### GET `/territories/states`

List all states.

---

### GET `/territories/states/:id`

Get a state with all its districts.

---

### POST `/territories/districts`

> **Access:** SUPER_ADMIN, ADMIN

```json
{ "name": "Mumbai City", "stateId": 1 }
```

---

### GET `/territories/districts?stateId=1`

List districts filtered by state.

---

### GET `/territories/districts/:id`

Get a district with all its cities.

---

### POST `/territories/cities`

> **Access:** SUPER_ADMIN, ADMIN

```json
{ "name": "Mumbai", "districtId": 1 }
```

---

### GET `/territories/cities?districtId=1`

List cities filtered by district.

---

### POST `/territories`

> **Access:** SUPER_ADMIN, ADMIN

Create a territory.

```json
{
  "name": "Andheri West",
  "cityId": 1,
  "code": "MH-MUM-AW",
  "description": "Western Andheri area"
}
```

---

### GET `/territories`

🔒 **All roles**

List territories with optional filters.

| Param      | Type   | Description                         |
|------------|--------|-------------------------------------|
| `search`   | string | Search name or code                 |
| `cityId`   | number | Filter by city                      |
| `isActive` | string | `"true"` or `"false"`               |

---

### GET `/territories/:id`

Get territory with full location path and assigned employees.

---

### PATCH `/territories/:id`

> **Access:** SUPER_ADMIN, ADMIN

```json
{
  "name": "Andheri West Updated",
  "description": "Updated description",
  "isActive": false
}
```

---

### POST `/territories/assign`

> **Access:** SUPER_ADMIN, ADMIN

Assign a territory to an employee.

```json
{
  "userId": "user-uuid",
  "territoryId": 1
}
```

---

### DELETE `/territories/assign/:userId/:territoryId`

> **Access:** SUPER_ADMIN, ADMIN

Unassign a territory from an employee.

---

### GET `/territories/user/:userId`

> **Access:** SUPER_ADMIN, ADMIN

Get all territories assigned to a specific user.

---

## 5. Doctors

### POST `/doctors`

🔒 **All roles**

```json
{
  "name": "Dr. Raj Patel",
  "specialization": "Cardiologist",
  "clinicName": "Heart Care Clinic",
  "hospitalName": "City Hospital",
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "email": "dr.raj@hospital.com",
  "address": "123, Main Street, Mumbai",
  "territoryId": 1
}
```

| Field            | Required | Notes               |
|------------------|----------|---------------------|
| `name`           | ✅       |                     |
| `specialization` | ❌       |                     |
| `clinicName`     | ❌       |                     |
| `hospitalName`   | ❌       |                     |
| `phone`          | ❌       |                     |
| `alternatePhone` | ❌       |                     |
| `email`          | ❌       |                     |
| `address`        | ❌       |                     |
| `territoryId`    | ❌       | Links to territory  |

---

### GET `/doctors`

🔒 **All roles**

| Param         | Type   | Description                  |
|---------------|--------|------------------------------|
| `search`      | string | Name, specialization, phone  |
| `territoryId` | number | Filter by territory          |
| `isActive`    | string | `"true"` or `"false"`        |

---

### GET `/doctors/:id`

Returns doctor details + last 10 visits.

---

### PATCH `/doctors/:id`

🔒 **All roles** — Update any doctor field (all optional).

---

### DELETE `/doctors/:id`

> **Access:** SUPER_ADMIN, ADMIN — Soft-deactivates the doctor.

---

## 6. Chemists

### POST `/chemists`

🔒 **All roles**

```json
{
  "shopName": "Raj Medical Store",
  "ownerName": "Raj Kumar",
  "phone": "9876543210",
  "alternatePhone": "9876543211",
  "email": "raj@medical.com",
  "gstNumber": "27AAPFU0939F1ZV",
  "address": "456, Market Road, Mumbai",
  "territoryId": 1
}
```

| Field           | Required | Notes              |
|-----------------|----------|--------------------|
| `shopName`      | ✅       |                    |
| `ownerName`     | ✅       |                    |
| `phone`         | ✅       |                    |
| `alternatePhone`| ❌       |                    |
| `email`         | ❌       |                    |
| `gstNumber`     | ❌       |                    |
| `address`       | ❌       |                    |
| `territoryId`   | ❌       | Links to territory |

---

### GET `/chemists`

🔒 **All roles**

| Param         | Type   | Description                    |
|---------------|--------|--------------------------------|
| `search`      | string | Shop name, owner, phone, GST   |
| `territoryId` | number | Filter by territory            |
| `isActive`    | string | `"true"` or `"false"`          |

---

### GET `/chemists/:id`

Returns chemist details + last 10 visits.

---

### PATCH `/chemists/:id`

🔒 **All roles** — Update any chemist field (all optional).

---

### DELETE `/chemists/:id`

> **Access:** SUPER_ADMIN, ADMIN — Soft-deactivates.

---

## 7. Attendance

### POST `/attendance/check-in`

🔒 **All roles** — Can only check in once per day.

```json
{
  "lat": 18.9394,
  "lng": 72.8355,
  "address": "Mumbai Office, Andheri West",
  "notes": "On time"
}
```

| Field     | Required |
|-----------|----------|
| `lat`     | ✅       |
| `lng`     | ✅       |
| `address` | ❌       |
| `notes`   | ❌       |

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "date": "2026-06-20T00:00:00.000Z",
    "checkInTime": "2026-06-20T09:00:00.000Z",
    "checkInLat": "18.9394",
    "checkInLng": "72.8355",
    "checkInAddress": "Mumbai Office, Andheri West",
    "checkOutTime": null,
    "checkOutLat": null,
    "checkOutLng": null,
    "checkOutAddress": null,
    "workingHours": null,
    "status": "PRESENT",
    "notes": null,
    "user": { "id": "uuid", "name": "Raj Sharma" }
  }
}
```

> **409 Conflict** if already checked in today.

---

### POST `/attendance/check-out`

🔒 **All roles** — Can only check out once per day, must check in first.

```json
{
  "lat": 18.9394,
  "lng": 72.8355,
  "address": "Home, Borivali",
  "notes": "Completed all visits"
}
```

> Working hours auto-calculated. Status becomes `HALF_DAY` if < 4 hours.

---

### GET `/attendance/today`

🔒 **All roles**

Returns today's attendance record for the logged-in user, or `null` if not checked in.

---

### GET `/attendance/my`

🔒 **All roles**

My attendance history with date range filter.

| Param  | Type   | Description       |
|--------|--------|-------------------|
| `from` | string | ISO date `YYYY-MM-DD` |
| `to`   | string | ISO date `YYYY-MM-DD` |
| `page` | number | Pagination        |
| `limit`| number | Pagination        |

---

### GET `/attendance/daily-present?date=2026-06-20`

> **Access:** SUPER_ADMIN, ADMIN

Returns all employees who are present on a given date (defaults to today).

---

### GET `/attendance/list`

> **Access:** SUPER_ADMIN, ADMIN

Full attendance list with filters.

| Param    | Type   | Description           |
|----------|--------|-----------------------|
| `userId` | string | Filter by employee    |
| `date`   | string | Specific date         |
| `from`   | string | Date range start      |
| `to`     | string | Date range end        |

---

### GET `/attendance/:id`

> **Access:** SUPER_ADMIN, ADMIN — Get a specific attendance record.

---

## 8. Visits

### POST `/visits`

🔒 **All roles**

```json
{
  "visitType": "DOCTOR",
  "doctorId": "doctor-uuid",
  "territoryId": 1,
  "visitDate": "2026-06-20",
  "lat": 18.9394,
  "lng": 72.8355,
  "locationAddress": "Heart Care Clinic, Andheri",
  "purpose": "Product introduction",
  "notes": "Doctor showed interest in Product X",
  "followUpDate": "2026-06-27",
  "followUpNotes": "Send product samples",
  "status": "COMPLETED",
  "products": [
    {
      "productName": "CardioPlus",
      "details": "Discussed benefits for hypertension",
      "quantity": "2 samples"
    }
  ]
}
```

| Field             | Required | Notes                                          |
|-------------------|----------|------------------------------------------------|
| `visitType`       | ✅       | `DOCTOR` or `CHEMIST`                          |
| `doctorId`        | ✅*      | Required if `visitType = DOCTOR`               |
| `chemistId`       | ✅*      | Required if `visitType = CHEMIST`              |
| `visitDate`       | ✅       | `YYYY-MM-DD`                                   |
| `territoryId`     | ❌       |                                                |
| `lat`             | ❌       | GPS latitude                                   |
| `lng`             | ❌       | GPS longitude                                  |
| `locationAddress` | ❌       |                                                |
| `purpose`         | ❌       |                                                |
| `notes`           | ❌       |                                                |
| `followUpDate`    | ❌       | `YYYY-MM-DD`                                   |
| `followUpNotes`   | ❌       |                                                |
| `status`          | ❌       | Default: `COMPLETED`                           |
| `products`        | ❌       | Array of products discussed                    |

---

### GET `/visits`

🔒 **All roles** (MR/SALES_PERSON see only their own)

| Param           | Type    | Description                          |
|-----------------|---------|--------------------------------------|
| `userId`        | string  | Admin only — filter by employee      |
| `visitType`     | enum    | `DOCTOR` or `CHEMIST`                |
| `from`          | string  | Date range start `YYYY-MM-DD`        |
| `to`            | string  | Date range end `YYYY-MM-DD`          |
| `territoryId`   | number  | Filter by territory                  |
| `followUpPending` | string | `"true"` — show overdue follow-ups |

**Response includes:** visit, user, doctor/chemist info, territory, products.

---

### GET `/visits/follow-ups/pending`

🔒 **All roles** (MR/SALES_PERSON see only their own)

Returns all visits with past-due follow-up dates that aren't marked done.

---

### GET `/visits/:id`

🔒 **All roles** (MR/SALES_PERSON can only access their own)

---

### PATCH `/visits/:id`

🔒 **All roles** (MR/SALES_PERSON can only update their own)

```json
{
  "notes": "Updated notes",
  "followUpDate": "2026-06-30",
  "followUpNotes": "Call before visiting",
  "followUpDone": false,
  "status": "COMPLETED",
  "products": [
    { "productName": "CardioPlus", "details": "Reorder", "quantity": "5" }
  ]
}
```

> Sending `products` **replaces** all existing products for that visit.

---

### PATCH `/visits/:id/follow-up-done`

🔒 **All roles** — Mark a follow-up as completed. No body needed.

---

## 9. Daily Reports

### POST `/daily-reports`

🔒 **All roles**

```json
{
  "date": "2026-06-20",
  "productsDiscussed": "CardioPlus, NeuroCalm",
  "competitorActivity": "Competitor X launched new product in territory",
  "highlights": "Met 5 doctors, 3 chemists. Good response to CardioPlus.",
  "challenges": "Traffic issues in the afternoon",
  "remarks": "Need more product samples",
  "status": "DRAFT"
}
```

| Field                | Required | Notes                             |
|----------------------|----------|-----------------------------------|
| `date`               | ✅       | `YYYY-MM-DD` — one report per day |
| `productsDiscussed`  | ❌       |                                   |
| `competitorActivity` | ❌       |                                   |
| `highlights`         | ❌       |                                   |
| `challenges`         | ❌       |                                   |
| `remarks`            | ❌       |                                   |
| `status`             | ❌       | `DRAFT` (default) or `SUBMITTED`  |

> Visit counts (`totalVisits`, `doctorVisits`, `chemistVisits`) are **auto-computed** from actual visits logged for that date.

> **409 Conflict** if a report already exists for that date — use PATCH instead.

---

### GET `/daily-reports`

🔒 **All roles** (MR/SALES_PERSON see only their own)

| Param    | Type   | Description                     |
|----------|--------|---------------------------------|
| `userId` | string | Admin only — filter by employee |
| `from`   | string | Date range start                |
| `to`     | string | Date range end                  |
| `status` | enum   | `DRAFT` or `SUBMITTED`          |

---

### GET `/daily-reports/today`

🔒 **All roles**

Returns today's report for the logged-in user or `null` if not created.

---

### GET `/daily-reports/:id`

🔒 **All roles** (MR/SALES_PERSON can only access their own)

---

### PATCH `/daily-reports/:id`

🔒 **All roles** (MR/SALES_PERSON can only update their own)

Cannot edit a report that's already `SUBMITTED`.

```json
{
  "productsDiscussed": "CardioPlus",
  "highlights": "Updated highlights",
  "status": "DRAFT"
}
```

---

### PATCH `/daily-reports/:id/submit`

🔒 **All roles** — Submit a report. No body needed.

Recalculates visit counts at submit time. Cannot re-submit.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "date": "2026-06-20T00:00:00.000Z",
    "totalVisits": 8,
    "doctorVisits": 5,
    "chemistVisits": 3,
    "status": "SUBMITTED",
    "submittedAt": "2026-06-20T18:00:00.000Z",
    ...
  }
}
```

---

## 10. Dashboard

### GET `/dashboard/admin?date=2026-06-20`

> **Access:** SUPER_ADMIN, ADMIN

Daily overview. Defaults to today if no `date` provided.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-06-20",
    "summary": {
      "totalEmployees": 15,
      "activeEmployees": 14,
      "presentToday": 11,
      "absentToday": 3,
      "totalVisitsToday": 42,
      "doctorVisitsToday": 28,
      "chemistVisitsToday": 14,
      "pendingFollowUps": 7,
      "reportsSubmittedToday": 10,
      "totalDoctors": 200,
      "totalChemists": 150
    },
    "topPerformers": [
      {
        "user": { "id": "uuid", "name": "Raj Sharma", "employeeCode": "EMP002", "role": { "name": "MR" } },
        "visitCount": 9
      }
    ],
    "presentEmployees": [
      {
        "id": "attendance-uuid",
        "checkInTime": "2026-06-20T09:05:00.000Z",
        "checkOutTime": null,
        "workingHours": null,
        "status": "PRESENT",
        "user": { "id": "uuid", "name": "Raj Sharma", "employeeCode": "EMP002", "role": { "name": "MR" } }
      }
    ]
  }
}
```

---

### GET `/dashboard/me?date=2026-06-20`

🔒 **All roles**

Employee's personal daily dashboard. Defaults to today.

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2026-06-20",
    "attendance": {
      "checkInTime": "2026-06-20T09:05:00.000Z",
      "checkOutTime": null,
      "status": "PRESENT"
    },
    "summary": {
      "todayVisits": 5,
      "doctorVisitsToday": 3,
      "chemistVisitsToday": 2,
      "pendingFollowUps": 2,
      "totalVisitsMonth": 42,
      "reportStatus": "DRAFT"
    },
    "recentVisits": [ ... ],
    "upcomingFollowUps": [ ... ]
  }
}
```

---

### GET `/dashboard/territories`

> **Access:** SUPER_ADMIN, ADMIN

Territory coverage overview.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Andheri West",
      "code": "MH-MUM-AW",
      "location": {
        "city": "Mumbai",
        "district": "Mumbai City",
        "state": "Maharashtra"
      },
      "assignedEmployees": 2,
      "employees": [
        { "id": "uuid", "name": "Raj Sharma", "role": { "name": "MR" } }
      ],
      "stats": {
        "doctors": 25,
        "chemists": 18,
        "totalVisits": 142
      }
    }
  ]
}
```

---

### GET `/dashboard/performance?from=2026-06-01&to=2026-06-30`

> **Access:** SUPER_ADMIN, ADMIN

Employee performance report for a date range. Defaults to current month.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "employee": { "id": "uuid", "name": "Raj Sharma", "employeeCode": "EMP002", "role": { "name": "MR" } },
      "totalVisits": 95,
      "doctorVisits": 60,
      "chemistVisits": 35,
      "daysPresent": 22,
      "reportsSubmitted": 22
    }
  ]
}
```

> Sorted by `totalVisits` descending (top performers first).

---

## 11. Enums Reference

```typescript
enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN       = "ADMIN",
  MR          = "MR",
  SALES_PERSON = "SALES_PERSON"
}

enum VisitType {
  DOCTOR  = "DOCTOR",
  CHEMIST = "CHEMIST"
}

enum VisitStatus {
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  PENDING   = "PENDING"
}

enum AttendanceStatus {
  PRESENT  = "PRESENT",
  ABSENT   = "ABSENT",
  HALF_DAY = "HALF_DAY",
  LEAVE    = "LEAVE"
}

enum ReportStatus {
  DRAFT     = "DRAFT",
  SUBMITTED = "SUBMITTED"
}
```

---

## 12. Role-Permission Matrix

| Endpoint                            | SUPER_ADMIN | ADMIN | MR  | SALES_PERSON |
|-------------------------------------|:-----------:|:-----:|:---:|:------------:|
| **Auth**                            |             |       |     |              |
| Login / Refresh                     | ✅          | ✅    | ✅  | ✅           |
| Logout / GET /me                    | ✅          | ✅    | ✅  | ✅           |
| **Users**                           |             |       |     |              |
| Create / List / Get / Update user   | ✅          | ✅    | ❌  | ❌           |
| Toggle active / Reset password      | ✅          | ✅    | ❌  | ❌           |
| Change own password                 | ✅          | ✅    | ✅  | ✅           |
| **Territories**                     |             |       |     |              |
| View hierarchy / list / get         | ✅          | ✅    | ✅  | ✅           |
| Create / Update / Assign            | ✅          | ✅    | ❌  | ❌           |
| **Doctors & Chemists**              |             |       |     |              |
| Create / List / Get / Update        | ✅          | ✅    | ✅  | ✅           |
| Delete (deactivate)                 | ✅          | ✅    | ❌  | ❌           |
| **Attendance**                      |             |       |     |              |
| Check-in / Check-out / Today / My   | ✅          | ✅    | ✅  | ✅           |
| Admin list / Daily-present          | ✅          | ✅    | ❌  | ❌           |
| **Visits**                          |             |       |     |              |
| Create / Update own                 | ✅          | ✅    | ✅  | ✅           |
| List / Get (own only for MR/SP)     | ✅          | ✅    | own | own          |
| List all / filter by userId         | ✅          | ✅    | ❌  | ❌           |
| **Daily Reports**                   |             |       |     |              |
| Create / Update / Submit own        | ✅          | ✅    | ✅  | ✅           |
| List all / filter by userId         | ✅          | ✅    | own | own          |
| **Dashboard**                       |             |       |     |              |
| GET /dashboard/me                   | ✅          | ✅    | ✅  | ✅           |
| GET /dashboard/admin                | ✅          | ✅    | ❌  | ❌           |
| GET /dashboard/territories          | ✅          | ✅    | ❌  | ❌           |
| GET /dashboard/performance          | ✅          | ✅    | ❌  | ❌           |

---

## 13. TypeScript Types

Copy these into your frontend project (`types/api.ts`):

```typescript
// ─── Common ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  path: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MR' | 'SALES_PERSON';
export type VisitType = 'DOCTOR' | 'CHEMIST';
export type VisitStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type ReportStatus = 'DRAFT' | 'SUBMITTED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  employeeCode: string | null;
  profilePhoto: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string | null;
  profilePhoto: string | null;
  dateOfJoining: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: Role };
  createdBy: { id: string; name: string } | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  employeeCode?: string;
  dateOfJoining?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  employeeCode?: string;
  profilePhoto?: string;
  dateOfJoining?: string;
  isActive?: boolean;
}

// ─── Territory ────────────────────────────────────────────────────────────────

export interface State {
  id: number;
  name: string;
  code: string;
  createdAt: string;
}

export interface District {
  id: number;
  name: string;
  stateId: number;
  state: State;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
  districtId: number;
  district: District;
  createdAt: string;
}

export interface Territory {
  id: number;
  name: string;
  code: string | null;
  cityId: number;
  city: City;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  clinicName: string | null;
  hospitalName: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  territoryId: number | null;
  territory: Pick<Territory, 'id' | 'name'> | null;
  addedBy: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorPayload {
  name: string;
  specialization?: string;
  clinicName?: string;
  hospitalName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  territoryId?: number;
}

// ─── Chemist ──────────────────────────────────────────────────────────────────

export interface Chemist {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  gstNumber: string | null;
  address: string | null;
  territoryId: number | null;
  territory: Pick<Territory, 'id' | 'name'> | null;
  addedBy: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChemistPayload {
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  territoryId?: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkInLat: string | null;
  checkInLng: string | null;
  checkInAddress: string | null;
  checkOutTime: string | null;
  checkOutLat: string | null;
  checkOutLng: string | null;
  checkOutAddress: string | null;
  workingHours: string | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface CheckInPayload {
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
}

export interface CheckOutPayload {
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export interface VisitProduct {
  id: number;
  visitId: string;
  productName: string;
  details: string | null;
  quantity: string | null;
}

export interface Visit {
  id: string;
  userId: string;
  visitType: VisitType;
  doctorId: string | null;
  chemistId: string | null;
  territoryId: number | null;
  visitDate: string;
  visitTime: string;
  lat: string | null;
  lng: string | null;
  locationAddress: string | null;
  purpose: string | null;
  notes: string | null;
  followUpDate: string | null;
  followUpNotes: string | null;
  followUpDone: boolean;
  status: VisitStatus;
  products: VisitProduct[];
  user: { id: string; name: string; employeeCode: string | null };
  doctor: { id: string; name: string; specialization: string | null } | null;
  chemist: { id: string; shopName: string; ownerName: string } | null;
  territory: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitPayload {
  visitType: VisitType;
  doctorId?: string;
  chemistId?: string;
  territoryId?: number;
  visitDate: string;
  lat?: number;
  lng?: number;
  locationAddress?: string;
  purpose?: string;
  notes?: string;
  followUpDate?: string;
  followUpNotes?: string;
  status?: VisitStatus;
  products?: { productName: string; details?: string; quantity?: string }[];
}

// ─── Daily Reports ────────────────────────────────────────────────────────────

export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  totalVisits: number;
  doctorVisits: number;
  chemistVisits: number;
  productsDiscussed: string | null;
  competitorActivity: string | null;
  highlights: string | null;
  challenges: string | null;
  remarks: string | null;
  status: ReportStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface CreateDailyReportPayload {
  date: string;
  productsDiscussed?: string;
  competitorActivity?: string;
  highlights?: string;
  challenges?: string;
  remarks?: string;
  status?: ReportStatus;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  date: string;
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    presentToday: number;
    absentToday: number;
    totalVisitsToday: number;
    doctorVisitsToday: number;
    chemistVisitsToday: number;
    pendingFollowUps: number;
    reportsSubmittedToday: number;
    totalDoctors: number;
    totalChemists: number;
  };
  topPerformers: Array<{
    user: { id: string; name: string; employeeCode: string | null; role: { name: Role } };
    visitCount: number;
  }>;
  presentEmployees: Attendance[];
}

export interface EmployeeDashboard {
  date: string;
  attendance: Attendance | null;
  summary: {
    todayVisits: number;
    doctorVisitsToday: number;
    chemistVisitsToday: number;
    pendingFollowUps: number;
    totalVisitsMonth: number;
    reportStatus: ReportStatus | 'NOT_CREATED';
  };
  recentVisits: Visit[];
  upcomingFollowUps: Visit[];
}

export interface TerritoryStats {
  id: number;
  name: string;
  code: string | null;
  location: { city: string; district: string; state: string };
  assignedEmployees: number;
  employees: Array<{ id: string; name: string; role: { name: Role } }>;
  stats: { doctors: number; chemists: number; totalVisits: number };
}

export interface EmployeePerformance {
  employee: { id: string; name: string; employeeCode: string | null; role: { name: Role } };
  totalVisits: number;
  doctorVisits: number;
  chemistVisits: number;
  daysPresent: number;
  reportsSubmitted: number;
}
```

---

## Quick Reference — All Endpoints

```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout                        🔒
GET    /auth/me                            🔒

POST   /users                              🔒 SUPER_ADMIN, ADMIN
GET    /users                              🔒 SUPER_ADMIN, ADMIN
GET    /users/:id                          🔒 SUPER_ADMIN, ADMIN
PATCH  /users/:id                          🔒 SUPER_ADMIN, ADMIN
PATCH  /users/:id/toggle-active            🔒 SUPER_ADMIN, ADMIN
POST   /users/me/change-password           🔒 ALL
POST   /users/:id/reset-password           🔒 SUPER_ADMIN, ADMIN

GET    /territories/hierarchy              🔒 ALL
POST   /territories/states                 🔒 SUPER_ADMIN, ADMIN
GET    /territories/states                 🔒 ALL
GET    /territories/states/:id             🔒 ALL
POST   /territories/districts              🔒 SUPER_ADMIN, ADMIN
GET    /territories/districts?stateId=     🔒 ALL
GET    /territories/districts/:id          🔒 ALL
POST   /territories/cities                 🔒 SUPER_ADMIN, ADMIN
GET    /territories/cities?districtId=     🔒 ALL
POST   /territories                        🔒 SUPER_ADMIN, ADMIN
GET    /territories                        🔒 ALL
GET    /territories/:id                    🔒 ALL
PATCH  /territories/:id                    🔒 SUPER_ADMIN, ADMIN
POST   /territories/assign                 🔒 SUPER_ADMIN, ADMIN
DELETE /territories/assign/:userId/:tId    🔒 SUPER_ADMIN, ADMIN
GET    /territories/user/:userId           🔒 SUPER_ADMIN, ADMIN

POST   /doctors                            🔒 ALL
GET    /doctors                            🔒 ALL
GET    /doctors/:id                        🔒 ALL
PATCH  /doctors/:id                        🔒 ALL
DELETE /doctors/:id                        🔒 SUPER_ADMIN, ADMIN

POST   /chemists                           🔒 ALL
GET    /chemists                           🔒 ALL
GET    /chemists/:id                       🔒 ALL
PATCH  /chemists/:id                       🔒 ALL
DELETE /chemists/:id                       🔒 SUPER_ADMIN, ADMIN

POST   /attendance/check-in                🔒 ALL
POST   /attendance/check-out               🔒 ALL
GET    /attendance/today                   🔒 ALL
GET    /attendance/my                      🔒 ALL
GET    /attendance/daily-present           🔒 SUPER_ADMIN, ADMIN
GET    /attendance/list                    🔒 SUPER_ADMIN, ADMIN
GET    /attendance/:id                     🔒 SUPER_ADMIN, ADMIN

POST   /visits                             🔒 ALL
GET    /visits                             🔒 ALL (MR/SP: own only)
GET    /visits/follow-ups/pending          🔒 ALL (MR/SP: own only)
GET    /visits/:id                         🔒 ALL (MR/SP: own only)
PATCH  /visits/:id                         🔒 ALL (MR/SP: own only)
PATCH  /visits/:id/follow-up-done          🔒 ALL

POST   /daily-reports                      🔒 ALL
GET    /daily-reports                      🔒 ALL (MR/SP: own only)
GET    /daily-reports/today                🔒 ALL
GET    /daily-reports/:id                  🔒 ALL (MR/SP: own only)
PATCH  /daily-reports/:id                  🔒 ALL (MR/SP: own only)
PATCH  /daily-reports/:id/submit           🔒 ALL

GET    /dashboard/admin                    🔒 SUPER_ADMIN, ADMIN
GET    /dashboard/me                       🔒 ALL
GET    /dashboard/territories              🔒 SUPER_ADMIN, ADMIN
GET    /dashboard/performance              🔒 SUPER_ADMIN, ADMIN
```
