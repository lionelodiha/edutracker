# School Management API Requirements

This document outlines the backend API endpoints required to support the new "School Side" frontend UI.

## 0. Tenant Authentication (School Code)
To log teachers and students securely into their specific school without knowing their tenant ID directly, the global login portal requires a **School Code** (a unique string/slug for each Organization).

### 0.1. Portal Login Endpoint
- **Endpoint:** `POST /api/auth/portal-login`
- **Request Body:**
```json
{
  "schoolCode": "string (e.g. SPRINGFIELD)",
  "identifier": "string (email or student ID)",
  "password": "string"
}
```
*Note: The backend should lookup the `OrganizationId` based on `schoolCode`, and then authenticate the user within that scope.*

### 0.2. Portal Sign-up Endpoint (Invitation Link)
- **Endpoint:** `POST /api/auth/portal-signup`
- **Request Body:**
```json
{
  "schoolCode": "string (e.g. SPRINGFIELD)",
  "role": "Student | Teacher",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "password": "string"
}
```
*Note: The `schoolCode` and `role` are embedded in the invitation URL query strings sent by the Admin (`/portal-signup?schoolCode=...&role=...`). The UI locks these fields during registration so the user cannot tamper with them. The backend MUST strictly bind the resulting user account to the matching `OrganizationId` and `Role`.*

---

## 1. Class Roster Management (Enrollments)
The frontend requires endpoints to add and remove users (Students and Teachers) to a specific class.

### 1.1. Get Class Roster
- **Endpoint:** `GET /api/classes/{classId}/roster`
- **Description:** Returns a list of all users enrolled in the class.
- **Response Model:**
```json
[
  {
    "enrollmentId": "guid",
    "userId": "guid",
    "firstName": "string",
    "lastName": "string",
    "role": "Student | Teacher",
    "enrolledAt": "datetime"
  }
]
```

### 1.2. Enroll User in Class
- **Endpoint:** `POST /api/classes/{classId}/roster`
- **Request Body:**
```json
{
  "userId": "guid",
  "role": "Student | Teacher"
}
```

### 1.3. Remove User from Class
- **Endpoint:** `DELETE /api/classes/{classId}/roster/{enrollmentId}`

---

## 2. Assignments
Endpoints to manage homework, quizzes, and exams for a particular class.

### 2.1. Get Class Assignments
- **Endpoint:** `GET /api/classes/{classId}/assignments`
- **Response Model:**
```json
[
  {
    "id": "guid",
    "title": "string",
    "description": "string",
    "dueDate": "datetime",
    "maxScore": 100,
    "createdAt": "datetime"
  }
]
```

### 2.2. Create Assignment
- **Endpoint:** `POST /api/classes/{classId}/assignments`
- **Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "datetime",
  "maxScore": 100
}
```

### 2.3. Delete Assignment
- **Endpoint:** `DELETE /api/classes/{classId}/assignments/{assignmentId}`

---

## 3. Grading & Submissions
Endpoints to handle grading for the assignments.

### 3.1. Get Assignment Grades (Submissions)
- **Endpoint:** `GET /api/classes/{classId}/assignments/{assignmentId}/grades`
- **Response Model:**
```json
[
  {
    "id": "guid",
    "studentId": "guid",
    "studentName": "string",
    "score": 95,
    "feedback": "string",
    "gradedAt": "datetime"
  }
]
```

### 3.2. Submit / Update Grade
- **Endpoint:** `PUT /api/classes/{classId}/assignments/{assignmentId}/grades`
- **Request Body:**
```json
{
  "studentId": "guid",
  "score": 95,
  "feedback": "string"
}
```

---

## 4. Attendance
Endpoints to track daily presence for students in a class.

### 4.1. Get Class Attendance by Date
- **Endpoint:** `GET /api/classes/{classId}/attendance?date=YYYY-MM-DD`
- **Response Model:**
```json
[
  {
    "studentId": "guid",
    "studentName": "string",
    "status": "Present | Absent | Tardy | Excused"
  }
]
```

### 4.2. Log / Update Attendance
- **Endpoint:** `PUT /api/classes/{classId}/attendance`
- **Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "records": [
    {
      "studentId": "guid",
      "status": "Present | Absent | Tardy | Excused"
    }
  ]
}
```
