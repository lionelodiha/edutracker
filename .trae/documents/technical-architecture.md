## 1. Architecture design

```mermaid
graph TD
  A[User Browser] --> B[React Frontend Application]
  B --> C[ASP.NET Core Web API]
  C --> D[SQL Server Database]
  C --> E[Supabase Auth Service]

  subgraph "Frontend Layer"
      B
  end

  subgraph "Backend Layer"
      C
  end

  subgraph "Data Layer"
      D
      E
  end
```

## 2. Technology Description
- Frontend: React@18 + TypeScript@5 + TailwindCSS@3 + Vite
- Initialization Tool: vite-init
- Backend: ASP.NET Core@6 (existing, unchanged)
- Database: SQL Server (existing, unchanged)
- Authentication: Supabase Auth (replacing Flutter auth)
- State Management: React Context + useReducer
- Routing: React Router@6
- HTTP Client: Axios

## 3. Route definitions
| Route | Purpose |
|-------|---------|
| / | Welcome page with Figma-designed landing |
| /login | User authentication page |
| /register | New user registration page |
| /dashboard | Main dashboard for students and teachers |
| /assignments | Assignment management and submission |
| /profile | User profile and settings |
| /admin | Admin dashboard (admin users only) |

## 4. API definitions

### 4.1 Authentication API
```
POST /api/auth/login
```

Request:
| Param Name| Param Type  | isRequired  | Description |
|-----------|-------------|-------------|-------------|
| email     | string      | true        | User email address |
| password  | string      | true        | User password |

Response:
| Param Name| Param Type  | Description |
|-----------|-------------|-------------|
| token     | string      | JWT authentication token |
| user      | object      | User profile data |

### 4.2 Assignments API
```
GET /api/assignments
```

Response:
| Param Name| Param Type  | Description |
|-----------|-------------|-------------|
| assignments | array     | List of assignment objects |
| total     | number      | Total assignment count |

### 4.3 Submission API
```
POST /api/assignments/{id}/submit
```

Request:
| Param Name| Param Type  | isRequired  | Description |
|-----------|-------------|-------------|-------------|
| file      | file        | true        | Assignment submission file |
| comments  | string      | false       | Optional submission comments |

## 5. Server architecture diagram
```mermaid
graph TD
  A[React Frontend] --> B[ASP.NET Core API]
  B --> C[Authentication Middleware]
  B --> D[Business Logic Layer]
  D --> E[Data Access Layer]
  E --> F[SQL Server]
  C --> G[Supabase Auth]

  subgraph "Backend Services"
      B
      C
      D
      E
  end
```

## 6. Data model

### 6.1 Data model definition
```mermaid
erDiagram
  USER ||--o{ ASSIGNMENT : creates
  USER ||--o{ SUBMISSION : submits
  ASSIGNMENT ||--o{ SUBMISSION : receives
  USER {
      int id PK
      string email UK
      string password_hash
      string name
      string role
      datetime created_at
  }
  ASSIGNMENT {
      int id PK
      int teacher_id FK
      string title
      string description
      datetime due_date
      datetime created_at
  }
  SUBMISSION {
      int id PK
      int student_id FK
      int assignment_id FK
      string file_url
      string status
      int grade
      datetime submitted_at
  }
```

### 6.2 Frontend Component Structure
```
src/
├── components/
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Header.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── dashboard/
│   │   ├── DashboardOverview.tsx
│   │   └── ProgressChart.tsx
│   └── assignments/
│       ├── AssignmentList.tsx
│       └── SubmissionForm.tsx
├── pages/
│   ├── Welcome.tsx
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── Assignments.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── services/
│   ├── auth.service.ts
│   └── api.service.ts
└── types/
    ├── user.types.ts
    └── assignment.types.ts
```

## 7. Migration Strategy

### 7.1 Flutter Cleanup
- Remove all Flutter-related files and directories
- Delete mobile/flutter directory and contents
- Remove Flutter-specific configuration files
- Update .gitignore to exclude Flutter artifacts

### 7.2 React Setup
- Initialize new React project with TypeScript template
- Configure TailwindCSS for styling
- Set up React Router for navigation
- Implement authentication with Supabase
- Create reusable component library

### 7.3 Backend Integration
- Maintain existing ASP.NET Core API endpoints
-