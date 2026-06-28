# Profile API — changes for Frontend

All endpoints require `Authorization: Bearer <accessToken>`.
The `me` endpoints work for **any authenticated user** (no role restriction).

---

## 1. GET /auth/me  (updated response)

Now returns the new personal + document fields, plus two helper fields for
driving a "complete your profile" UI.

**Response 200**
```jsonc
{
  "id": "uuid",
  "name": "Paras Lohia",
  "email": "paras@example.com",
  "phone": "9876543210",
  "employeeCode": "EMP01",
  "profilePhoto": "https://<bucket>.s3.../profile-photos/....jpg", // null if not set
  "dateOfJoining": "2024-01-10",
  "isActive": true,

  // ── new personal fields ──
  "dateOfBirth": "1995-08-21",          // or null
  "gender": "MALE",                      // "MALE" | "FEMALE" | "OTHER" | null
  "bloodGroup": "O+",                    // or null
  "address": "Sector 48, Gurugram",      // or null
  "bio": "Field rep, North zone",        // or null
  "emergencyContactName": "Rahul",       // or null
  "emergencyContactPhone": "9000000000", // or null

  // ── KYC document URLs (S3) ──
  "aadhaarUrl": "https://....pdf",       // or null
  "panUrl": "https://....jpg",           // or null
  "tenthMarksheetUrl": "https://....pdf",// or null

  "role": { "id": 3, "name": "MR" },
  "employeeTerritories": [ /* ... */ ],
  "createdAt": "...",
  "updatedAt": "...",

  // ── profile completeness helpers ──
  "profileComplete": false,
  "missingProfileFields": ["profilePhoto", "dateOfBirth", "aadhaarUrl"]
}
```

`profileComplete` is `true` only when **all** of these are set:
`profilePhoto, dateOfBirth, gender, bloodGroup, address,
emergencyContactName, emergencyContactPhone, aadhaarUrl, panUrl, tenthMarksheetUrl`.
`missingProfileFields` lists whichever of those are still empty — use it to render
a checklist / progress indicator.

---

## 2. PATCH /users/me  (new — edit own profile)

Edit personal details. All fields optional; send only what changed.
**Cannot** change email, role, employeeCode, or isActive here (admin-only).

**Request body** (`application/json`)
```jsonc
{
  "name": "Paras Lohia",
  "phone": "9876543210",                 // must be unique → 409 if taken
  "dateOfBirth": "1995-08-21",           // YYYY-MM-DD
  "gender": "MALE",                       // "MALE" | "FEMALE" | "OTHER"
  "bloodGroup": "O+",                     // max 5 chars, auto-uppercased
  "address": "Sector 48, Gurugram",
  "bio": "Field rep, North zone",         // max 280 chars
  "emergencyContactName": "Rahul",
  "emergencyContactPhone": "9000000000"
}
```

**Response 200** → the full updated profile (same shape as `GET /auth/me`).
**Errors:** `409` phone already in use · `400` validation error.

---

## 3. POST /users/me/photo  (new — upload profile photo)

**Content-Type:** `multipart/form-data`
**Field:** `file` (single file)
**Allowed:** jpeg, jpg, png, webp, heic, heif, or pdf · max 10 MB
Uploading again replaces the previous photo.

**Response 200** → the full updated profile (same shape as `GET /auth/me`),
with `profilePhoto` now populated.
**Errors:** `400` no file uploaded.

Example:
```js
const fd = new FormData();
fd.append("file", file);
await api.post("/users/me/photo", fd); // do NOT set Content-Type manually
```

---

## 4. POST /users/me/documents/:type  (new — upload a KYC document)

**Path param `type`:** one of `aadhaar` | `pan` | `tenth-marksheet`
**Content-Type:** `multipart/form-data`
**Field:** `file` (single file)
**Allowed:** images or pdf · max 10 MB
Uploading again replaces the previous document of that type.

| type             | sets field          |
|------------------|---------------------|
| `aadhaar`        | `aadhaarUrl`        |
| `pan`            | `panUrl`            |
| `tenth-marksheet`| `tenthMarksheetUrl` |

**Response 200** → the full updated profile (same shape as `GET /auth/me`).
**Errors:** `400` invalid type · `400` no file uploaded.

Example:
```js
const fd = new FormData();
fd.append("file", file);
await api.post(`/users/me/documents/aadhaar`, fd);
```

---

## 5. GET /users/:id  (admin — updated response)

Admin (`SUPER_ADMIN` / `ADMIN`) single-user fetch now also returns the personal
fields and document URLs (same keys as `GET /auth/me`, minus the
`profileComplete` / `missingProfileFields` helpers).

> Note: the user **list** endpoint `GET /users` does **not** include personal
> details or document URLs — those are only exposed on single-user fetch and
> own-profile, by design (KYC privacy).

---

## Notes for FE
- Photo + documents are separate multipart uploads; the text profile uses JSON
  on `PATCH /users/me`. They can be wired independently.
- Every write endpoint returns the **full updated profile**, so you can update
  local state directly from the response without re-fetching `/auth/me`.
- For "profile picture is required", gate on `profileComplete === false` and/or
  `missingProfileFields.includes("profilePhoto")` to prompt the user.
