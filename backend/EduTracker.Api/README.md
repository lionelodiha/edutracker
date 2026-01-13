# EduTracker API

Welcome to the **EduTracker API**, the api is designed to manage users, sessions, and authentication and other services to manage the educational resources of a school.

---

## 🔐 Authentication & Security

All interactions with the Api are secured. We use a combination of hashing for sensitive data and encryption for personal identifiers.

### Data Security Policy

- **User Identifiers**: Emails and other identifiers are securely hashed and encrypted to protect privacy.
- **Passwords**: Stored using strong one-way hashing algorithms.
- **Personal Information**: Names and contact details are encrypted using advanced encryption standards to ensure confidentiality.

---

## 📡 API Reference

The API follows RESTful conventions and returns a standardized response envelope.

### Standard Response Envelope

```json
{
  "success": true,
  "messageId": "string (UUID)",
  "message": "Human readable summary",
  "details": [],
  "data": { ... },
  "timestamp": "ISO8601"
}
```

---

## 🛠️ Development & Tooling

- **Scalars / OpenAPI**: Interactive documentation is available at `/openapi/v1.json` (or via the Scalar UI in development).
- **Structured Logging**: Every request is tagged with a `TraceId` for debugging.
- **Global Error Handling**: Consistent error responses via custom middleware.
