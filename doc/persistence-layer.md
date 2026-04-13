# Persistence Layer Design Document (EduTracker)

## 0. Core Architectural Rule (MANDATORY BOUNDARY MODEL)

This persistence layer is designed around strict **context isolation**:

* **User Context** → identity, authentication, credentials only
* **School Context** → membership, invitations, applications only (knows UserId only)
* **Academic Context** → teaching & learning domain (knows SchoolId + SchoolMemberId only)

❗ No context is allowed to reference internal objects of another context.
Only **IDs are used as contracts between boundaries**.

---

# 1. DATABASE OVERVIEW

## Core Persistence Principles

* Strong referential integrity **within a context only**
* Loose coupling across contexts
* Prefer **RESTRICT + SOFT DELETE over CASCADE DELETE**
* No cross-context foreign key navigation at domain level (only FK enforcement at DB level when required)
* All sensitive data encrypted at application boundary

---

# 2. SOFT DELETE STRATEGY (NEW GLOBAL RULE)

## Standard Rule

Instead of cascading deletions:

* Use `is_deleted` (boolean) OR `deleted_at` (timestamp nullable)
* Data is NEVER physically removed except system-level purge jobs
* Relationships are preserved for audit integrity

## Benefits

* Prevents accidental data loss
* Prevents cascade deletion spirals
* Enables audit/history reconstruction
* Safer multi-tenant operations

---

# 3. USER CONTEXT (ISOLATED)

## Responsibility

Only authentication and identity storage.

❗ User Context does NOT know:

* Schools
* Academic structures
* Memberships

---

## 3.1 users

* id (PK, uuid)
* user_name (unique)
* email_hash (unique)
* password_hash
* role
* is_locked
* is_deleted (soft delete)
* created_at
* updated_at
* first_name (encrypted)
* middle_name (encrypted)
* last_name (encrypted)
* email (encrypted)

### Constraints

* UNIQUE(user_name)
* UNIQUE(email_hash)

### Delete Rule

* ❌ NO CASCADE DELETE into other contexts
* Only sessions are invalidated logically

---

## 3.2 user_sessions

* id (PK)
* user_id (FK → users.id)
* expires_at
* absolute_expires_at
* is_revoked
* revoked_at

### Delete Rule

* ON DELETE RESTRICT (preferred)
* Sessions become invalid via is_revoked

---

# 4. SCHOOL CONTEXT (ISOLATED DOMAIN BOUNDARY)

## Responsibility

Manages:

* Schools
* Memberships
* Applications
* Invitations

❗ School Context knows ONLY `UserId`

---

## 4.1 schools

* id (PK)
* owner_user_id (FK → users.id)
* name
* is_locked
* is_deleted (soft delete)
* created_at
* updated_at

### Constraints

* owner_user_id NOT NULL

### Delete Rule (IMPORTANT CHANGE)

* ❌ NO CASCADE DELETE to members, invites, applications
* ✔ School is soft-deleted instead

---

## 4.2 school_members

* id (PK)
* school_id (FK → schools.id)
* user_id (FK → users.id)
* role
* status
* is_deleted
* created_at

### Constraints

* UNIQUE(school_id, user_id)

### Delete Rule

* ON DELETE RESTRICT
* Membership remains for audit even if user leaves

---

## 4.3 school_applications

* id (PK)
* school_id
* applicant_user_id
* application_type
* status
* review_notes (encrypted)
* applied_at
* reviewed_at
* reviewed_by_user_id
* is_deleted

### Delete Rule

* ON DELETE RESTRICT
* Applications preserved for audit

---

## 4.4 school_invites

* id (PK)
* school_id
* invited_user_id
* invited_by_user_id
* status
* expires_at
* responded_at
* is_deleted
* created_at
* updated_at

### Delete Rule

* ON DELETE RESTRICT
* Invite history is permanent audit record

---

# 5. ACADEMIC CONTEXT (STRICT ISOLATION)

## CORE RULE

❗ Academic Context:

* NO CASCADE DELETES across school or user boundaries
* ALL data is soft-deletable

---

## 5.1 teachers

* id
* school_id
* school_member_id
* employee_id
* is_deleted

### Constraints

* UNIQUE(school_id, school_member_id)

### Delete Rule

* ON DELETE RESTRICT

---

## 5.2 students

* id
* school_id
* school_member_id
* student_id
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

## 5.3 courses

* id
* school_id
* code
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

## 5.4 semesters

* id
* school_id
* is_deleted

---

## 5.5 terms

* id
* semester_id
* ordinal
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

## 5.6 course_offerings

* id
* course_id
* term_id
* teacher_id
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

## 5.7 student_enrollments

* id
* student_id
* course_offering_id
* status
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

# 6. ASSESSMENT SYSTEM

## 6.1 assessments

* id
* school_id
* weight
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

## 6.2 assessment_instances

* id
* assessment_id
* course_offering_id
* is_deleted

---

## 6.3 student_assessments

* id
* student_id
* assessment_instance_id
* is_deleted

### Delete Rule

* ON DELETE RESTRICT

---

# 7. RELATIONSHIP GRAPH (SAFE MODEL)

```
USER (soft delete only)
  |
  v
SCHOOL (soft delete only)
  |
  v
ACADEMIC (soft delete only)
```

---

# 8. CRITICAL DESIGN CONSTRAINTS

## 8.1 NO CASCADE DELETION RULE

❌ No cascading deletes across contexts

✔ All deletions are either:

* Soft delete (preferred)
* Restricted delete (blocked)

---

## 8.2 DATA SAFETY GUARANTEE

* No accidental data loss propagation
* Full audit history preserved
* Tenant isolation remains intact

---

# 9. KEY DESIGN INSIGHT

👉 System prioritizes **data survival over automatic cleanup**

Instead of cascading deletes:

* We preserve relationships
* Mark records inactive
* Maintain audit integrity

---

# 10. FINAL ARCHITECTURE GUARANTEE

This system guarantees:

* Zero cascade deletion spirals
* Safe multi-tenant isolation
* Full historical traceability
* Controlled lifecycle management
* Stable long-term data retention model
