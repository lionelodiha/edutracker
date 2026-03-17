# EduTracker API

The EduTracker API provides the backend surface for identity, session management, and organization collaboration. It is the single entry point for current features and is designed to expand into additional product domains as the platform grows.

**API base path:** `/api`

---

## Overview

EduTracker currently exposes endpoints for:

- Authentication and session lifecycle
- User profiles and admin actions
- Organization membership and invites

A lightweight info endpoint is also available at `GET /api`.

---

## Authentication and Sessions

EduTracker uses a **session-based authentication** scheme backed by an HTTP-only cookie.

- Cookie name: `edu_session_id`
- Set by: `POST /api/auth/login` and `POST /api/auth/refresh`
- Cleared by: `POST /api/auth/logout`
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=None`

When calling protected endpoints from a browser client, make sure credentials are included so cookies are sent.

---

## Standard Response Envelope

All endpoints respond with a consistent envelope:

```json
{
  "success": true,
  "messageId": "string",
  "message": "Human readable summary",
  "details": [
    {
      "message": "string", "severity": "Info"
    }
  ],
  "data": { ... }
}
```

Notes:

- `details` can be `null` or empty for successful responses.
- `messageId` is a stable code useful for client-side handling.
- When an unexpected server error occurs, `messageId` is `COMMON_UNKNOWN_ERROR` and `success` is `false`.

---

## Errors and Traceability

Every response includes an `X-Trace-Id` header. Provide this value when reporting issues so logs can be correlated.

---

## Pagination (Cursor)

Some list endpoints use cursor pagination. The shape is:

```json
{
  "items": [ { ... } ],
  "nextCursor": "uuid-or-null",
  "hasMore": true
}
```

Use `nextCursor` as the `cursor` query parameter in subsequent requests.

---

## OpenAPI

In Development environments:

- OpenAPI JSON: `/openapi/v1.json`
- Interactive docs (Scalar): `/scalar`

---

## Security and Data Handling

Sensitive identifiers are hashed or encrypted at rest. Passwords are stored using strong one-way hashing, while personal identifiers are encrypted using modern cryptography (AES-GCM).

---

## Endpoints

### Base

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api` | Public | API information and capabilities |

### Authentication

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Log in and create a session cookie |
| POST | `/api/auth/refresh` | Session | Refresh current session cookie |
| POST | `/api/auth/logout` | Session | Revoke current session and clear cookie |

### Users

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users` | Admin or SuperAdmin | List users (cursor pagination) |
| GET | `/api/users/me` | Session | Current user profile |
| GET | `/api/users/{id}` | Session | Get user profile by id |
| PATCH | `/api/users/me` | Session | Update current user profile |
| PATCH | `/api/users/me/password` | Session | Change current user password |
| POST | `/api/users/{id}/promote` | SuperAdmin | Promote a user to the next role |
| POST | `/api/users/{id}/demote` | SuperAdmin | Demote a user to the previous role |
| POST | `/api/users/{id}/lock` | Admin or SuperAdmin | Lock a user account |
| POST | `/api/users/{id}/unlock` | Admin or SuperAdmin | Unlock a user account |

### Sessions

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/sessions/me` | Session | List current user sessions |
| POST | `/api/sessions/{id}/revoke` | Session | Revoke a specific session |
| POST | `/api/sessions/revoke-all` | Session | Revoke all sessions (optionally keep current) |

### Organizations

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/organizations` | Session | Create organization |
| GET | `/api/organizations` | Session | List organizations for current user |
| GET | `/api/organizations/{id}` | Session | Get organization by id (member only) |
| PATCH | `/api/organizations/{id}` | Session | Update organization name (owner only) |
| DELETE | `/api/organizations/{id}` | Session | Delete organization (owner only) |
| POST | `/api/organizations/{id}/transfer-ownership` | Session | Transfer ownership to an active member |
| POST | `/api/organizations/{id}/invite` | Session | Invite user to organization |
| PATCH | `/api/organizations/{id}/members/{memberId}/role` | Session | Update member role (owner only) |
| GET | `/api/organizations/{id}/members` | Session | List organization members |
| DELETE | `/api/organizations/{id}/members/{memberId}` | Session | Remove member or leave organization |
| GET | `/api/organizations/{id}/invites` | Session | List org invites (owner/moderator) |
| POST | `/api/organizations/invites/{inviteId}/accept` | Session | Accept invite for current user |
| POST | `/api/organizations/invites/{inviteId}/reject` | Session | Reject invite for current user |
| POST | `/api/organizations/{id}/invites/{inviteId}/cancel` | Session | Cancel invite (owner/moderator) |
| GET | `/api/organizations/invites` | Session | List current user invites |
