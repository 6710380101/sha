# Security Specification — ThaiLearn Hub (`firestore.rules`)

## 1. Data Invariants & Relational Mapping

1. **Identity & Privilege Invariant (`users/{userId}`)**:
   - A user profile document ID `userId` must strictly match `request.auth.uid` and `incoming().uid`.
   - Passwords are NEVER stored in Firestore.
   - Regular users cannot self-assign `role: 'admin'` or `role: 'moderator'` on registration (`create`) or profile edits (`update`). Only the bootstrapped verified admin (`t.gan5140@gmail.com` with `email_verified == true`) can create an initial `'admin'` profile, and only an active Admin can change roles/status on user profiles.
   - PII Isolation: `users/{userId}` contains `email` and is readable (`get`) strictly by the owner (`request.auth.uid == userId`) or active Staff (`moderator` / `admin`). `list` is restricted to verified bootstrapped Admin.
2. **Resource Ownership & Active Member Gate (`resources/{resourceId}`)**:
   - Every resource created must have `authorId == request.auth.uid`, `visibility == 'public'`, and a valid active `/users/$(request.auth.uid)` profile (`exists()` + `status == 'active'`).
   - Only the resource author (while active) can update content fields, and only active Staff (`moderator` / `admin`) can update `visibility` (`'public'` vs `'hidden'`).
3. **Deduplicated Favorites (`favorites/{favoriteId}`)**:
   - Every favorite document ID must equal `request.auth.uid + '_' + incoming().resourceId`, preventing duplicate bookmarks for the same resource.
   - The referenced `/resources/$(incoming().resourceId)` must exist (`exists()`).
   - `list` queries on `favorites` enforce `resource.data.userId == request.auth.uid` on the server.
4. **Report Lifecycle & Terminal State Lock (`reports/{reportId}`)**:
   - Reports must reference an existing `/resources/$(incoming().resourceId)` and set `reporterId == request.auth.uid` and `status == 'pending'` on creation.
   - Once a report transitions from `'pending'` to `'resolved'` or `'dismissed'`, non-admin users are locked out from further updates (Terminal State Locking).
5. **Immutable Audit Trail (`moderationLogs/{logId}`)**:
   - Only active Staff (`moderator` / `admin`) can create moderation logs with `actorId == request.auth.uid` and `createdAt == request.time`.
   - Moderation logs are strictly append-only (`allow update, delete: if false;`).
6. **Global Site Settings (`settings/{settingId}`)**:
   - Only `settingId == 'site_config'` is valid. Publicly readable via `get` so all visitors receive dynamic site name, announcement, and categories, while `create` and `update` are restricted strictly to active Admins.

---

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Payload 1 — Privilege Escalation on Registration (`users/{uid}` create)**:
   ```json
   {
     "uid": "attacker_uid",
     "displayName": "Hacker",
     "email": "attacker@example.com",
     "role": "admin",
     "status": "active",
     "photoURL": "",
     "bio": "",
     "createdAt": "REQUEST_TIME",
     "updatedAt": "REQUEST_TIME"
   }
   ```
   *Expected*: `PERMISSION_DENIED` (self-assigned `'admin'` rejected for non-bootstrapped email).

2. **Payload 2 — Shadow Field Injection on User Update (`users/{uid}` update)**:
   ```json
   {
     "displayName": "Valid Name",
     "isSuperAdmin": true,
     "updatedAt": "REQUEST_TIME"
   }
   ```
   *Expected*: `PERMISSION_DENIED` (`hasOnly` & `affectedKeys().hasOnly()` block shadow fields).

3. **Payload 3 — Unverified Email Spoofing (`users/{uid}` read/write)**:
   - Auth token has `email: "t.gan5140@gmail.com"`, `email_verified: false`.
   *Expected*: `PERMISSION_DENIED` (`isVerifiedUser()` enforces `request.auth.token.email_verified == true`).

4. **Payload 4 — Cross-User PII Leak (`users/{otherUid}` get)**:
   - Authenticated user `user_a` attempts `getDoc(doc(db, 'users', 'user_b'))`.
   *Expected*: `PERMISSION_DENIED` (PII Isolation restricts `get` to owner or staff).

5. **Payload 5 — Identity Spoofing on Resource Creation (`resources/{resId}` create)**:
   ```json
   {
     "title": "Spoofed Resource",
     "description": "Trying to post under another teacher's UID.",
     "category": "คอมพิวเตอร์",
     "level": "มัธยมศึกษาตอนปลาย",
     "mediaType": "pdf",
     "resourceUrl": "https://example.com/file.pdf",
     "fileName": "",
     "fileSize": 0,
     "fileDataUrl": "",
     "tags": ["คอมพิวเตอร์"],
     "authorId": "victim_teacher_uid",
     "authorName": "Victim Teacher",
     "visibility": "public",
     "createdAt": "REQUEST_TIME",
     "updatedAt": "REQUEST_TIME"
   }
   ```
   *Expected*: `PERMISSION_DENIED` (`incoming().authorId == request.auth.uid` fails).

6. **Payload 6 — Orphaned Favorite Creation (`favorites/{favId}` create)**:
   ```json
   {
     "userId": "user_1",
     "resourceId": "non_existent_resource_999",
     "resourceTitle": "Ghost Resource",
     "resourceCategory": "วิทยาศาสตร์",
     "resourceMediaType": "pdf",
     "createdAt": "REQUEST_TIME"
   }
   ```
   *Expected*: `PERMISSION_DENIED` (`exists(/databases/$(database)/documents/resources/$(incoming().resourceId))` fails).

7. **Payload 7 — Unauthorized Favorite Scraping (`favorites` list)**:
   - Authenticated user `user_1` runs `getDocs(collection(db, 'favorites'))` without `where('userId', '==', 'user_1')`.
   *Expected*: `PERMISSION_DENIED` (`allow list` requires `resource.data.userId == request.auth.uid`).

8. **Payload 8 — Terminal State Re-Opening on Report (`reports/{repId}` update)**:
   - Moderator attempts to modify a report whose `existing().status` is already `'resolved'`.
   *Expected*: `PERMISSION_DENIED` (Terminal State Locking blocks non-admin updates once status != `'pending'`).

9. **Payload 9 — Audit Log Tampering (`moderationLogs/{logId}` delete/update)**:
   - Admin or Moderator attempts to `deleteDoc` or `updateDoc` an existing moderation log entry.
   *Expected*: `PERMISSION_DENIED` (`allow update, delete: if false`).

10. **Payload 10 — Unbounded Tag Array Exhaustion (`resources/{resId}` create)**:
    - Resource payload includes `tags` array with 25 items (`tags.size() > 10`).
    *Expected*: `PERMISSION_DENIED` (`data.tags.size() <= 10` enforced).

11. **Payload 11 — Client Timestamp Forgery (`resources/{resId}` create)**:
    - Resource payload passes a backdated timestamp `2020-01-01T00:00:00Z` instead of `serverTimestamp()` (`request.time`).
    *Expected*: `PERMISSION_DENIED` (`incoming().createdAt == request.time` enforced).

12. **Payload 12 — Unauthorized Site Settings Mutation (`settings/site_config` update)**:
    - Regular member attempts to add a category or change `siteName` in `settings/site_config`.
    *Expected*: `PERMISSION_DENIED` (`isAdmin()` required).
