# Course Enrollment System — Complete Project Explanation

> A comprehensive guide to understanding every aspect of this full-stack application.
> This document explains the what, why, and how of the entire system without
> requiring you to read every line of code.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [The Problem Being Solved](#2-the-problem-being-solved)
3. [Technology Choices](#3-technology-choices)
4. [System Architecture](#4-system-architecture)
5. [Database Design](#5-database-design)
6. [Backend Deep Dive](#6-backend-deep-dive)
7. [Authentication System](#7-authentication-system)
8. [Role-Based Access Control](#8-role-based-access-control)
9. [API Design](#9-api-design)
10. [Validation Strategy](#10-validation-strategy)
11. [Error Handling](#11-error-handling)
12. [Pagination and Search](#12-pagination-and-search)
13. [The Seat Limit Edge Case](#13-the-seat-limit-edge-case)
14. [Frontend Deep Dive](#14-frontend-deep-dive)
15. [Frontend State Management](#15-frontend-state-management)
16. [Frontend Routing](#16-frontend-routing)
17. [Frontend UI Design](#17-frontend-ui-design)
18. [Frontend-Backend Communication](#18-frontend-backend-communication)
19. [CORS Configuration](#19-cors-configuration)
20. [Testing Strategy](#20-testing-strategy)
21. [Docker and Deployment](#21-docker-and-deployment)
22. [Swagger API Documentation](#22-swagger-api-documentation)
23. [File Structure Explained](#23-file-structure-explained)
24. [Request Lifecycle](#24-request-lifecycle)
25. [Security Considerations](#25-security-considerations)
26. [Scaling Considerations](#26-scaling-considerations)
27. [How to Demo the Application](#27-how-to-demo-the-application)

---

## 1. Project Overview

This is a **Course Enrollment Management System** — a web application that allows
administrators to create courses and enroll students into them, while students can
browse available courses and see enrollment information.

The application consists of three major layers:

- **Frontend (React)** — The user interface running in the browser. Users interact
  with forms, tables, and navigation to manage courses and students.

- **Backend (NestJS)** — The server-side application that processes requests,
  enforces business rules, and communicates with the database. It exposes a
  RESTful API that the frontend consumes.

- **Database (SQLite)** — A file-based database that stores all persistent data:
  courses, students, and user accounts. The file is called `database.sqlite` and
  lives in the project root.

The communication flow is:

```
User clicks button in browser
    → Frontend sends HTTP request to backend API
        → Backend validates input, checks permissions, applies business rules
            → Backend reads/writes to database
        → Backend sends response back
    → Frontend updates the UI with the result
```

This is a classic **three-tier architecture**: presentation (frontend), logic (backend),
and data (database). Each tier is independent — you could swap the React frontend for
a mobile app without changing the backend, or swap SQLite for PostgreSQL without
changing the frontend.

---

## 2. The Problem Being Solved

In a real university or training center, course enrollment involves several
challenges:

1. **Course Management** — Administrators need to create courses with details like
   name, instructor, and available seats.

2. **Student Enrollment** — Students need to be enrolled in specific courses, and
   each enrollment must be tracked.

3. **Capacity Enforcement** — A course with 30 seats should not allow 31 students
   to enroll. This is a critical business rule that must be enforced at the system
   level, not just at the UI level.

4. **Access Control** — Not everyone should be able to create courses or enroll
   students. Administrators manage the system; students only view it.

5. **Data Integrity** — The system must prevent invalid data (empty names, invalid
   emails, negative seat limits) and handle edge cases gracefully (enrolling in a
   full course, updating a course's seat limit below current enrollment).

This project addresses all five challenges in a self-contained, deployable package.

---

## 3. Technology Choices

### Backend: NestJS

**Why NestJS?**
NestJS is a Node.js framework inspired by Angular's architecture. It provides:

- **Modules** — Organize code into self-contained units (Auth, Courses, Students)
- **Dependency Injection** — Services receive their dependencies automatically,
  making code testable and loosely coupled
- **Decorators** — Declarative metadata for routes, validation, guards, and API docs
- **TypeScript** — Type safety catches errors at compile time, not runtime
- **Express under the hood** — Battle-tested HTTP server

Alternatives considered:
- **Express** — Too unstructured for a project of this size. No built-in module system.
- **Fastify** — Faster but less mature ecosystem compared to NestJS.
- **Spring Boot** — Excellent but requires Java; the project brief specifies NestJS track.

### ORM: TypeORM

**Why TypeORM?**
TypeORM is an Object-Relational Mapper that lets you work with database tables as
JavaScript/TypeScript objects instead of writing raw SQL.

```typescript
// Without ORM (raw SQL):
const result = await db.query('SELECT * FROM courses WHERE id = ?', [id]);

// With TypeORM:
const course = await courseRepo.findOne({ where: { id } });
```

TypeORM provides:
- **Entity classes** — Define your database schema as TypeScript classes
- **Repository pattern** — Clean API for CRUD operations (find, save, remove)
- **Relationships** — Define one-to-many, many-to-many, etc. with decorators
- **Auto-sync** — Creates/updates tables automatically during development
- **Query builder** — Escape hatch for complex queries

### Database: SQLite

**Why SQLite?**
SQLite is a serverless, file-based database. The entire database lives in a single
file (`database.sqlite`). This is ideal for:

- **Self-contained projects** — No database server to install or configure
- **Development** — Zero setup, instant start
- **Demonstrations** — Anyone can clone and run without infrastructure

SQLite handles all the SQL features we need: tables, foreign keys, indexes,
transactions. The only limitation is concurrent writes (SQLite uses file-level
locking), which is not a concern for this project's scale.

### Frontend: React 19 + Vite

**Why React?**
React is the most widely-used UI library. Its component-based architecture
naturally maps to UI elements:

- A `CourseTable` component renders a table of courses
- A `SearchBar` component handles search input
- A `Modal` component wraps any form in an overlay

**Why Vite?**
Vite is a modern build tool that provides instant hot module replacement (HMR)
during development. Changes appear in the browser in milliseconds, not seconds.

### Authentication: JWT + Passport

**Why JWT (JSON Web Tokens)?**
JWTs are stateless tokens. The server doesn't need to store session data — all
user information (id, email, role) is encoded in the token itself. This means:

- No server-side session storage needed
- Tokens can be verified without database lookups
- Works across multiple server instances (stateless scaling)

**Why Passport?**
Passport is the standard authentication middleware for Node.js. The `passport-jwt`
strategy handles token extraction and verification automatically.

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                     BROWSER                          │
│  ┌───────────────────────────────────────────────┐  │
│  │              React Application                 │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │  │
│  │  │  Pages    │  │Components│  │ Services │   │  │
│  │  │(Courses, │  │(Table,   │  │ (api.ts) │   │  │
│  │  │ Students)│  │ Modal,   │  │          │   │  │
│  │  │          │  │ Toast)   │  │          │   │  │
│  │  └────┬─────┘  └──────────┘  └────┬─────┘   │  │
│  │       │                            │          │  │
│  │       └──────────┬─────────────────┘          │  │
│  │                  │                            │  │
│  │         HTTP Requests (fetch)                 │  │
│  └──────────────────┼───────────────────────────┘  │
│                     │                               │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   NESTJS SERVER                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              Middleware Pipeline               │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────────┐ │  │
│  │  │  CORS   │→ │Validation│→ │ Auth Guard   │ │  │
│  │  │         │  │  Pipe    │  │ (JWT verify) │ │  │
│  │  └─────────┘  └─────────┘  └──────┬───────┘ │  │
│  │                                    │          │  │
│  │  ┌─────────────────────────────────▼───────┐ │  │
│  │  │            Roles Guard                   │ │  │
│  │  │     (check admin/student permission)     │ │  │
│  │  └──────────────────┬──────────────────────┘ │  │
│  │                     │                        │  │
│  │  ┌──────────────────▼──────────────────────┐ │  │
│  │  │          Controller Layer                │ │  │
│  │  │  (CourseController, StudentController,   │ │  │
│  │  │   AuthController)                        │ │  │
│  │  └──────────────────┬──────────────────────┘ │  │
│  │                     │                        │  │
│  │  ┌──────────────────▼──────────────────────┐ │  │
│  │  │           Service Layer                  │ │  │
│  │  │  (CourseService, StudentService,         │ │  │
│  │  │   AuthService)                           │ │  │
│  │  └──────────────────┬──────────────────────┘ │  │
│  │                     │                        │  │
│  └─────────────────────┼────────────────────────┘  │
│                        │                            │
└────────────────────────┼────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              SQLite Database                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ courses  │  │ students │  │  users   │         │
│  │──────────│  │──────────│  │──────────│         │
│  │ id       │  │ id       │  │ id       │         │
│  │ name     │  │ name     │  │ name     │         │
│  │ instructor│ │ email    │  │ email    │         │
│  │ seatLimit│  │ enrollDate│ │ password │         │
│  │ createdAt│  │ courseId  │ │ role     │         │
│  │ updatedAt│  │ createdAt│ │ createdAt│         │
│  └──────────┘  │ updatedAt│ │ updatedAt│         │
│                └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

### Request Lifecycle (Step by Step)

Here's exactly what happens when an admin clicks "Create Course" in the UI:

1. **UI Event Handler** — The `CourseForm` component's `handleSubmit` function is called.

2. **API Call** — `api.createCourse(data)` is called, which calls `request('/courses', { method: 'POST', body: ... })`.

3. **HTTP Request** — `fetch()` sends a POST request to `http://localhost:3000/courses` with:
   - `Content-Type: application/json`
   - `Authorization: Bearer eyJhbGciOi...` (the JWT token)
   - Body: `{"name":"Math 101","instructor":"Dr. Smith","seatLimit":30}`

4. **CORS Check** — The browser first sends an OPTIONS preflight request to verify the server allows cross-origin requests from `http://localhost:5173`. The server responds with allowed origins, methods, and headers.

5. **Actual Request Arrives at Server** — Express receives the POST request and passes it through the NestJS middleware pipeline.

6. **ValidationPipe** — The global `ValidationPipe` intercepts the request body and validates it against `CreateCourseDto`:
   - Is `name` a non-empty string? ✅
   - Is `instructor` a non-empty string? ✅
   - Is `seatLimit` an integer ≥ 1? ✅
   - Are there any unexpected fields? (forbidNonWhitelisted rejects them)
   
   If validation fails → 400 Bad Request is returned immediately.

7. **JwtAuthGuard** — Passport extracts the token from the `Authorization` header, verifies the signature using the JWT secret, and decodes the payload. If the token is invalid or missing → 401 Unauthorized.

8. **RolesGuard** — Reads the `@Roles(UserRole.ADMIN)` metadata from the route handler. Checks if the user's role (from the JWT payload) is `admin`. If not → 403 Forbidden.

9. **Controller** — `CourseController.create()` receives the validated DTO and passes it to the service.

10. **Service** — `CourseService.create()` creates a new Course entity and saves it to the database.

11. **Database** — TypeORM generates and executes: `INSERT INTO courses (name, instructor, seatLimit, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`.

12. **Response** — The saved course (with auto-generated `id`) is serialized to JSON and returned with status 201 Created.

13. **Frontend Receives Response** — The `request()` function in `api.ts` parses the JSON response and returns it to the caller.

14. **UI Updates** — The `handleCreate` function calls `fetchCourses()` which re-fetches the course list. The new course appears in the table.

---

## 5. Database Design

### Entity-Relationship Diagram

```
┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│      users       │         │     courses      │         │    students      │
│──────────────────│         │──────────────────│         │──────────────────│
│ id (PK)          │         │ id (PK)          │         │ id (PK)          │
│ name             │         │ name             │         │ name             │
│ email (UNIQUE)   │         │ instructor       │         │ email            │
│ password (hash)  │         │ seatLimit        │         │ enrollDate       │
│ role             │         │ createdAt        │         │ courseId (FK) ────┼──→ courses.id
│ createdAt        │         │ updatedAt        │         │ createdAt        │
│ updatedAt        │         │                  │         │ updatedAt        │
└──────────────────┘         └──────────────────┘         └──────────────────┘
                                                                      │
                                                                      │
                                                          One course has many students
                                                          Each student belongs to one course
```

### Why This Design?

**Separate `users` from `students`:** A user account (for login) is different from
a student enrollment record. One user (admin) doesn't need to be enrolled in any
course. A student record represents an enrollment, not a person.

**Foreign key on students:** The `courseId` column on the `students` table creates
the relationship. This is enforced at the database level — you cannot create a
student with a `courseId` that doesn't exist in the `courses` table.

**Cascade delete:** When a course is deleted, all students enrolled in that course
are automatically deleted too. This prevents orphaned student records pointing to
non-existent courses.

**Timestamps:** `createdAt` and `updatedAt` are auto-managed by TypeORM. Useful for
auditing and sorting (newest first).

**Role column on users:** Stores `admin` or `student`. Defaults to `student` for all
new registrations. Only the seeded account has `admin`.

### Auto-Sync vs Migrations

The project uses `synchronize: true` in the TypeORM config. This means TypeORM
automatically creates or modifies tables to match your entity definitions on every
startup. This is convenient for development but dangerous in production (it can
drop columns). For production, you would use migrations instead.

---

## 6. Backend Deep Dive

### Module Organization

Each module is a self-contained unit with its own files:

```
src/courses/
├── course.entity.ts       → Database table definition
├── course.controller.ts   → HTTP route handlers
├── course.service.ts      → Business logic
├── course.module.ts       → Module configuration (wires everything together)
├── course.service.spec.ts → Unit tests
└── dto/
    ├── create-course.dto.ts  → Validation rules for POST
    └── update-course.dto.ts  → Validation rules for PATCH
```

The module file (`course.module.ts`) tells NestJS:
- Which entity to inject (`Course`)
- Which controller handles routes (`CourseController`)
- Which service contains the logic (`CourseService`)

### Dependency Injection

NestJS uses dependency injection (DI) — a pattern where objects receive their
dependencies from outside rather than creating them internally.

```typescript
// WITHOUT DI (tight coupling):
class CourseService {
  private repo = new CourseRepository(); // Hard-coded dependency
}

// WITH DI (loose coupling):
class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>, // Injected by NestJS
  ) {}
}
```

Benefits:
- **Testability** — In tests, you can inject mock repositories
- **Flexibility** — Swap implementations without changing the service
- **Decoupling** — Services don't know or care how their dependencies work

### The Repository Pattern

TypeORM provides a `Repository` for each entity. It's a data access abstraction:

| Method | What It Does | SQL Equivalent |
|--------|-------------|----------------|
| `findOne({ where: { id } })` | Find one record by criteria | `SELECT * FROM courses WHERE id = ?` |
| `find({ where, skip, take })` | Find multiple records with options | `SELECT * FROM courses LIMIT ? OFFSET ?` |
| `findAndCount({ where, skip, take })` | Find records + total count | Same as above but also `SELECT COUNT(*)` |
| `count({ where })` | Count records matching criteria | `SELECT COUNT(*) FROM courses WHERE ...` |
| `create(data)` | Create entity instance (not saved yet) | N/A (in-memory only) |
| `save(entity)` | Persist to database | `INSERT` or `UPDATE` |
| `remove(entity)` | Delete from database | `DELETE FROM courses WHERE id = ?` |

### Swagger / OpenAPI Integration

The `@nestjs/swagger` package auto-generates API documentation from decorators:

```typescript
@ApiTags('Courses')           // Groups endpoints under "Courses"
@Controller('courses')
export class CourseController {
  @Post()
  @ApiOperation({ summary: 'Create a new course' })  // Description
  @ApiBearerAuth()              // Shows lock icon (requires token)
  @ApiQuery({ name: 'page' })  // Documents query parameters
  create(@Body() dto: CreateCourseDto) { ... }
}
```

The Swagger UI at `/docs` lets you:
- See all endpoints organized by tags
- Read descriptions and parameter docs
- Test endpoints directly (with authentication)
- See request/response schemas

---

## 7. Authentication System

### What is JWT?

JWT (JSON Web Token) is a compact, URL-safe token format. A JWT has three parts:

```
eyJhbGciOiJIUzI1NiIs.eyJzdWIiOjEsImVtYWlsIjoiYWRtaW5AY2FtcHVzLmNvbSIsInJvbGUiOiJhZG1pbiJ9.signature
│_________________________│ │________________________________________________________│ │__________│
        Header                    Payload (user data, signed)                        Signature
```

- **Header:** Algorithm used (`HS256`)
- **Payload:** User data (`{ sub: 1, email: "admin@campus.com", role: "admin" }`)
- **Signature:** Cryptographic hash proving the token hasn't been tampered with

### Authentication Flow

```
Registration:
  Client → POST /auth/register { name, email, password }
  Server → Hash password with bcrypt (10 rounds)
  Server → Save user to database
  Server → Generate JWT with { id, email, role: "student" }
  Server → Return { user: { id, name, email, role }, token: "eyJ..." }

Login:
  Client → POST /auth/login { email, password }
  Server → Find user by email
  Server → Compare password hash with bcrypt.compare()
  Server → Generate JWT with { id, email, role }
  Server → Return { user: { id, name, email, role }, token: "eyJ..." }

Subsequent Requests:
  Client → GET /courses (with header: Authorization: Bearer eyJ...)
  Server → JwtStrategy extracts token from header
  Server → Verifies signature with JWT_SECRET
  Server → Decodes payload → attaches { id, email, role } to request.user
  Server → Controller can access request.user to know who's asking
```

### Password Security

Passwords are never stored in plain text. bcrypt is used for hashing:

```typescript
// Hashing (during registration):
const hashed = await bcrypt.hash('admin123', 10);
// Result: "$2a$10$N9qo8uLOickgx2ZMRZoMye..." (60-character hash)

// Verification (during login):
const valid = await bcrypt.compare('admin123', user.password);
// Returns true if 'admin123' matches the hash
```

The `10` is the "salt rounds" — higher means more secure but slower. 10 is the
standard recommendation.

### Token Expiration

Tokens expire after 24 hours (configured in `auth.module.ts`). After expiration,
all API calls return 401. The frontend detects this and auto-logs the user out.

### Why Not Session-Based Auth?

Session-based auth stores user data on the server (in memory, Redis, etc.) and gives
the client a session ID cookie. JWT is preferred here because:

- **Stateless** — Server doesn't need to store anything. Multiple server instances
  work without shared state.
- **Self-contained** — The token carries all needed info (user id, role).
- **Simpler** — No session store to manage.

---

## 8. Role-Based Access Control

### The Two Roles

| Role | Can View | Can Create | Can Edit | Can Delete | Can Enroll |
|------|----------|------------|----------|------------|------------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |
| Student | ✅ | ❌ | ❌ | ❌ | ❌ |

### How It Works (Backend)

Three pieces work together:

1. **`@Roles()` decorator** — Marks a route handler with the required role:
   ```typescript
   @Post()
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.ADMIN)  // ← This decorator
   create(@Body() dto: CreateCourseDto) { ... }
   ```

2. **`RolesGuard`** — A guard that reads the decorator's metadata and checks the
   user's role from the JWT payload:
   ```typescript
   // If the route requires ADMIN and the user is STUDENT → throw 403
   if (!requiredRoles.includes(user.role)) {
     throw new ForbiddenException('Admin access required');
   }
   ```

3. **JWT payload includes role** — When generating the token, the role is included:
   ```typescript
   this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });
   ```

### Guard Execution Order

On a protected admin-only endpoint, guards run in this order:

```
1. JwtAuthGuard → Verifies token exists and is valid → Attaches user to request
2. RolesGuard   → Reads user.role from request → Checks against @Roles() metadata
3. Controller   → Only runs if both guards pass
```

If step 1 fails → 401 (not authenticated)
If step 2 fails → 403 (authenticated but not authorized)

### Seeded Admin Account

On the very first startup (when the users table is empty), the system automatically
creates an admin account:

```
Email: admin@campus.com
Password: admin123
Role: admin
```

This ensures there's always at least one admin who can manage the system. All
subsequent registrations create student accounts.

### Frontend Role Handling

The frontend also respects roles:

- The `AuthContext` exposes `isAdmin` based on the user's role
- Admin-only buttons (Create, Edit, Delete, Enroll) are conditionally rendered
- Students see a clean read-only interface

This is a UX improvement — the backend still enforces the restriction even if
someone bypasses the frontend (defense in depth).

---

## 9. API Design

### RESTful Conventions

The API follows REST (Representational State Transfer) conventions:

| Operation | HTTP Method | URL | Status Code |
|-----------|-------------|-----|-------------|
| List all | GET | `/courses` | 200 |
| Get one | GET | `/courses/1` | 200 |
| Create | POST | `/courses` | 201 |
| Update | PATCH | `/courses/1` | 200 |
| Delete | DELETE | `/courses/1` | 200 |

Why PATCH instead of PUT?
- **PUT** replaces the entire resource (all fields required)
- **PATCH** updates only the provided fields (partial update)

PATCH is more practical — you can update just the course name without resending
the instructor and seat limit.

### URL Structure

```
/courses              → Collection of courses
/courses/:id          → Single course
/courses/:id/students → Students enrolled in a course (nested resource)
/students             → Collection of all students
/students/:id         → Single student
/auth/register        → User registration
/auth/login           → User login
```

### Request/Response Format

**Request bodies** are always JSON with `Content-Type: application/json`.

**Response bodies** follow consistent patterns:

Success (single resource):
```json
{
  "id": 1,
  "name": "Math 101",
  "instructor": "Dr. Smith",
  "seatLimit": 30,
  "students": [...],
  "createdAt": "2026-08-20T10:00:00.000Z",
  "updatedAt": "2026-08-20T10:00:00.000Z"
}
```

Success (list with pagination):
```json
{
  "data": [...],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

Error:
```json
{
  "statusCode": 409,
  "message": "Course is full. Cannot enroll more students.",
  "error": "Conflict"
}
```

Validation error:
```json
{
  "statusCode": 400,
  "message": ["name should not be empty", "seatLimit must be a positive integer"],
  "error": "Bad Request"
}
```

---

## 10. Validation Strategy

### Where Validation Happens

Validation occurs at multiple levels:

1. **DTO level** — Decorators on DTO properties define the rules
2. **Global ValidationPipe** — Intercepts all requests and validates against DTOs
3. **Service level** — Business logic checks (is the course full? does the course exist?)
4. **Database level** — Constraints (NOT NULL, UNIQUE, foreign keys)

### DTO Decorators Explained

```typescript
export class CreateCourseDto {
  @IsString()          // Must be a string type
  @IsNotEmpty()        // Cannot be empty string ""
  @MaxLength(255)      // Maximum 255 characters
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  instructor: string;

  @IsInt()             // Must be an integer (not float)
  @Min(1)              // Minimum value is 1
  seatLimit: number;
}
```

### Update DTOs Use @IsOptional

```typescript
export class UpdateCourseDto {
  @IsOptional()        // Field can be omitted entirely
  @IsString()
  @IsNotEmpty()
  name?: string;        // The ? means it's optional in TypeScript
}
```

This allows partial updates: you can send `{"name": "New Name"}` without including
instructor or seatLimit.

### Whitelist and forbidNonWhitelisted

```typescript
new ValidationPipe({
  whitelist: true,           // Strips unknown properties
  forbidNonWhitelisted: true, // Throws 400 if unknown properties exist
  transform: true,           // Auto-transforms payload to DTO type
});
```

If you send `{"name": "Math", "hacker": "injection"}`, the `hacker` field is
stripped (whitelist) and a 400 error is returned (forbidNonWhitelisted). This
prevents mass assignment attacks.

---

## 11. Error Handling

### Exception Filters

NestJS has built-in exception handling. When you throw an exception, NestJS
catches it and converts it to an appropriate HTTP response:

```typescript
throw new NotFoundException('Course not found');
// → 404 { "statusCode": 404, "message": "Course not found", "error": "Not Found" }

throw new ConflictException('Course is full');
// → 409 { "statusCode": 409, "message": "Course is full", "error": "Conflict" }

throw new ForbiddenException('Admin access required');
// → 403 { "statusCode": 403, "message": "Admin access required", "error": "Forbidden" }
```

### Error Flow

```
Client sends invalid request
    → ValidationPipe catches it → 400 Bad Request
    → JwtAuthGuard catches missing token → 401 Unauthorized
    → RolesGuard catches wrong role → 403 Forbidden
    → Service throws NotFoundException → 404 Not Found
    → Service throws ConflictException → 409 Conflict
    → Unexpected error → 500 Internal Server Error
```

### Frontend Error Handling

The frontend's `request()` function handles errors centrally:

```typescript
if (!res.ok) {
  // On 401, auto-logout the user
  if (res.status === 401 && onAuthError) {
    setAuthToken(null);
    onAuthError();
  }
  // Parse error response and throw it
  const error = await res.json();
  throw error;
}
```

Each page component catches errors from API calls and shows toast notifications:

```typescript
try {
  await api.createCourse(data);
  setToast({ message: 'Course created successfully', type: 'success' });
} catch (err) {
  setToast({ message: 'Failed to create course', type: 'error' });
}
```

---

## 12. Pagination and Search

### Why Pagination?

Without pagination, listing 10,000 courses would:
- Send 10,000 records over the network (slow)
- Render 10,000 table rows (browser freezes)
- Query 10,000 rows from the database (memory waste)

Pagination loads only one page at a time (default: 10 items).

### How Pagination Works

**Request:** `GET /courses?page=2&limit=10`

**Backend Logic:**
```typescript
const take = Math.min(limit, 50);      // Cap at 50
const skip = (page - 1) * take;        // Page 2 → skip 10

const [data, total] = await courseRepo.findAndCount({
  skip,    // OFFSET 10
  take,    // LIMIT 10
  order: { createdAt: 'DESC' },  // Newest first
});
```

**Response:**
```json
{
  "data": [...10 courses...],
  "meta": {
    "total": 25,       // Total records in database
    "page": 2,         // Current page
    "limit": 10,       // Items per page
    "totalPages": 3    // ceil(25 / 10)
  }
}
```

The frontend uses `totalPages` to render pagination buttons (← 1 2 3 →).

### How Search Works

**Request:** `GET /courses?search=math`

**Backend Logic:**
```typescript
const where = search
  ? [
      { name: Like('%math%') },         // Course name contains "math"
      { instructor: Like('%math%') },   // OR instructor contains "math"
    ]
  : undefined;  // No filter = return all
```

The `Like` operator performs a case-insensitive LIKE query. The `%` wildcards match
any characters before and after the search term.

SQL LIKE wildcard characters (`%` and `_`) in the search input are escaped to prevent
injection: `search.replace(/%/g, '\\%').replace(/_/g, '\\_')`.

### Debounced Search

The search bar uses a 300ms debounce — it waits 300ms after the user stops typing
before sending the search request. This prevents sending a request on every
keystroke.

---

## 13. The Seat Limit Edge Case

This is the core business rule that the project brief specifically asks to handle.

### The Problem

A course has 30 seats. 30 students are enrolled. A 31st student tries to enroll.
The system must reject this with a meaningful error.

### Where It's Enforced

**On student enrollment (create):**
```typescript
const currentEnrollment = await this.studentRepo.count({
  where: { courseId: dto.courseId },
});
if (currentEnrollment >= course.seatLimit) {
  throw new ConflictException('Course is full. Cannot enroll more students.');
}
```

**On student transfer (update):**
When a student transfers to a different course, the system checks the target
course's capacity.

**On seat limit reduction (course update):**
When an admin reduces a course's seat limit, the system checks that the new limit
is not below the current enrollment count:
```typescript
if (dto.seatLimit < currentEnrollment) {
  throw new ConflictException(
    `Cannot reduce seat limit to ${dto.seatLimit}. ${currentEnrollment} student(s) currently enrolled.`
  );
}
```

### Why This Matters

Without this check, the data would be inconsistent — a course showing "30/30
seats" would still allow enrollment, creating 31 students for 30 seats. The
seat badge in the UI would show negative available seats, and the enrollment
counter would be wrong.

### Race Condition Consideration

In a high-concurrency environment, two requests could both read the count as 29,
both pass the check, and both enroll — resulting in 31 students for 30 seats.
In this project's scope (SQLite, single-server), this is not a practical concern.
For production systems, you'd use database transactions with serializable
isolation.

---

## 14. Frontend Deep Dive

### React Component Hierarchy

```
App
├── AuthProvider (context for auth state)
│   ├── AppRoutes
│   │   ├── LoginPage / RegisterPage (public routes)
│   │   └── ProtectedRoute
│   │       └── Layout (sidebar + main area)
│   │           ├── CoursesPage
│   │           │   ├── SearchBar
│   │           │   ├── CourseTable
│   │           │   ├── CourseForm (modal)
│   │           │   ├── ConfirmDialog
│   │           │   ├── Pagination
│   │           │   └── Toast
│   │           ├── CourseDetailPage
│   │           │   ├── StudentTable
│   │           │   ├── EnrollForm (modal)
│   │           │   ├── EditStudentForm (modal)
│   │           │   ├── ConfirmDialog
│   │           │   ├── Pagination
│   │           │   └── Toast
│   │           └── StudentsPage
│   │               ├── SearchBar
│   │               ├── StudentTable
│   │               ├── EnrollForm (modal with course selector)
│   │               ├── EditStudentForm (modal)
│   │               ├── ConfirmDialog
│   │               ├── Pagination
│   │               └── Toast
```

### Shared Components

These components are reused across pages:

**Modal** — Overlay dialog with backdrop. Handles ESC key to close and body scroll
lock. Any content can be placed inside it.

**ConfirmDialog** — A Modal pre-configured for confirmation prompts. Shows a
message and "Cancel"/"Confirm" buttons. Used before destructive actions (delete).

**Toast** — Auto-dismissing notification (3 seconds). Shows success (green) or
error (red) messages. Uses a ref to prevent timer resets on re-render.

**SearchBar** — Text input with debounced search (300ms). Calls the parent's
search handler after the user stops typing.

**Pagination** — Page navigation with Previous/Next buttons and page numbers.
Shows "X of Y total" information.

### Page Components

Each page component follows the same pattern:

```typescript
function SomePage() {
  // 1. State declarations
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // 2. Data fetching
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.someEndpoint();
      setData(res.data);
    } catch {
      setToast({ message: 'Failed to load', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dependencies]);

  // 3. Effects
  useEffect(() => { fetchData(); }, [fetchData]);

  // 4. Event handlers (create, update, delete)
  const handleCreate = async (data) => {
    try {
      await api.create(data);
      setToast({ message: 'Success', type: 'success' });
      fetchData(); // Refresh the list
    } catch (err) {
      setToast({ message: 'Failed', type: 'error' });
    }
  };

  // 5. JSX (loading skeleton, empty state, table, modals, toast)
  if (loading) return <Skeleton />;
  if (data.length === 0) return <EmptyState />;
  return <div>...table...modals...toast</div>;
}
```

---

## 15. Frontend State Management

### No External State Library

The project uses React's built-in hooks instead of Redux or Zustand. This is
appropriate for an application of this size.

### State Categories

| State | Where | Purpose |
|-------|-------|---------|
| `user` | AuthContext | Current logged-in user (persisted to localStorage) |
| `courses` | CoursesPage | List of courses from the API |
| `students` | CourseDetailPage/StudentsPage | List of students from the API |
| `page` / `totalPages` | All list pages | Pagination state |
| `search` | All list pages | Current search term |
| `loading` | All pages | Whether data is being fetched |
| `toast` | All pages | Current notification to display |
| `formOpen` / `editCourse` / `deleteCourse` | CoursesPage | Modal/dialog state |

### Why useCallback?

```typescript
const fetchCourses = useCallback(async () => {
  // ...
}, [page, search]);
```

`useCallback` memoizes the function — it only creates a new function when `page`
or `search` changes. Without it, every re-render would create a new function,
triggering `useEffect` to re-run and causing an infinite fetch loop.

### Why the Module-Level Token Variable?

In `api.ts`:
```typescript
let authToken: string | null = localStorage.getItem('auth_token');
```

This is a module-level variable (not React state) because:
1. It needs to be accessible outside of React components (in the `request()` function)
2. It doesn't need to trigger re-renders when changed
3. It's simpler than passing it through context or props

---

## 16. Frontend Routing

### Route Definitions

```tsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={user ? <Navigate to="/courses" /> : <AuthRoutes />} />
    <Route path="/register" element={user ? <Navigate to="/courses" /> : <AuthRoutes />} />

    {/* Protected routes (wrapped in Layout with sidebar) */}
    <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/courses/:id" element={<CourseDetailPage />} />
      <Route path="/students" element={<StudentsPage />} />
      <Route path="*" element={<Navigate to="/courses" />} />  {/* Catch-all */}
    </Route>
  </Routes>
</BrowserRouter>
```

### Route Protection

The `ProtectedRoute` component checks if the user is logged in:

```typescript
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;         // Still checking auth
  if (!user) return <Navigate to="/login" />;  // Not logged in
  return <>{children}</>;           // Authenticated
}
```

### Nested Routes

The `/courses/:id` route is nested inside the Layout route. This means the sidebar
always appears when viewing course details — the `Outlet` component in Layout
renders the child route's content in the main area.

---

## 17. Frontend UI Design

### Design System

The UI follows a **Linear/Vercel-inspired** design language:

- **Color palette** — Dark sidebar (#0a0a0a), light content area (#fafafa)
- **Typography** — Inter font family (clean, modern, highly legible)
- **Spacing** — Consistent 4px grid system
- **Shadows** — Subtle, layered shadows for depth
- **Border radius** — 8px for cards, 6px for buttons, 4px for inputs
- **Animations** — Subtle transitions on hover, focus, and state changes

### CSS Custom Properties

All design tokens are defined as CSS variables at the top of `App.css`:

```css
:root {
  --bg-primary: #fafafa;      /* Main background */
  --bg-secondary: #ffffff;    /* Card background */
  --text-primary: #0a0a0a;    /* Main text */
  --text-secondary: #6b7280;  /* Muted text */
  --color-primary: #0a0a0a;   /* Buttons, accents */
  --color-danger: #ef4444;    /* Delete, errors */
  --color-success: #22c55e;   /* Success states */
  --color-warning: #f59e0b;   /* Warning states */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
}
```

### Responsive Design

Two breakpoints handle mobile adaptation:

- **768px** — Sidebar collapses to icon-only (64px width), main content reflows
- **480px** — Sidebar hidden entirely, full-width content

### Loading States

Skeleton loaders (pulsing gray bars) replace content while data loads. This is
better than spinners because:
- They preserve layout structure (no jumping content)
- They feel faster (content appears in place)
- They reduce perceived wait time

### Empty States

When no data exists, pages show a centered message with an SVG illustration and
a call-to-action button (e.g., "Create your first course"). This is better than
showing an empty table with no context.

### Seat Badge Colors

The seat badge uses color to communicate availability at a glance:
- **Green** — Plenty of seats available (>50% remaining)
- **Yellow** — Filling up (≤50% remaining)
- **Red** — Almost full or completely full (≤10% remaining or 0)

---

## 18. Frontend-Backend Communication

### The API Service Layer

All HTTP requests go through a single `request()` function in `api.ts`:

```typescript
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  // 1. Add Content-Type header
  // 2. Add Authorization header if token exists
  // 3. Send the request
  // 4. Handle errors (401 → auto-logout, others → throw)
  // 5. Handle empty responses (DELETE returns no body)
  // 6. Parse and return JSON
}
```

Benefits:
- **Centralized** — Auth headers, error handling, and response parsing in one place
- **Type-safe** — Generic `<T>` parameter ensures type-safe responses
- **Consistent** — Every API call follows the same pattern

### The 401 Interceptor

When any API call returns 401 (Unauthorized):
1. The token is cleared from memory and localStorage
2. The `onAuthError` callback fires, clearing the user state
3. React Router redirects to the login page

This handles expired tokens gracefully — the user doesn't need to manually log
out and back in.

### Empty Response Handling (The Delete Bug Fix)

DELETE endpoints return HTTP 200 with no body. The original `request()` function
called `res.json()` on all responses, which threw a SyntaxError on empty bodies.
The fix:

```typescript
const text = await res.text();
if (!text) return undefined as T;  // No body → return undefined
return JSON.parse(text);           // Has body → parse JSON
```

---

## 19. CORS Configuration

### What is CORS?

CORS (Cross-Origin Resource Sharing) is a browser security mechanism. By default,
a web page at `http://localhost:5173` (Vite dev server) cannot make requests to
`http://localhost:3000` (NestJS server) because they're different "origins."

### How It's Configured

```typescript
app.enableCors({
  origin: 'http://localhost:5173',          // Only allow this origin
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],  // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'],  // Allowed headers
});
```

### Preflight Requests

For non-simple requests (those with custom headers like `Authorization`), the
browser sends an OPTIONS request first (the "preflight") to check if the server
allows the actual request. The server responds with CORS headers, and only then
does the browser send the real request.

---

## 20. Testing Strategy

### Unit Tests (Jest)

Unit tests verify individual services in isolation using mocked dependencies:

```typescript
// course.service.spec.ts
const mockRepo = {
  findAndCount: jest.fn().mockReturnValue([[mockCourse], 1]),
  findOne: jest.fn().mockReturnValue(mockCourse),
  // ...
};

const module = await Test.createTestingModule({
  providers: [
    CourseService,
    { provide: getRepositoryToken(Course), useValue: mockRepo },
  ],
}).compile();

const service = module.get(CourseService);
```

This tests the service's logic without touching the database. If the service
calls `courseRepo.findOne()`, it gets the mocked response.

### Test Coverage

| Test File | Tests | What's Covered |
|-----------|-------|----------------|
| `course.service.spec.ts` | 8 | Create, findAll, findOne (404), update (404 + seat conflict), remove (404), findStudents |
| `student.service.spec.ts` | 9 | Create (404 + full), findAll, findOne (404), update (404 + transfer full), remove (404) |
| `auth.service.spec.ts` | 6 | Register (duplicate), Login (wrong email, wrong password) |

### E2E Tests (test-e2e.sh)

The E2E test script tests the full HTTP flow against a running server:
- Auth (register, login, wrong credentials)
- Course CRUD (create, read, update, delete)
- Student CRUD (enroll, read, update, unenroll)
- Seat limit enforcement (fill to capacity, reject enrollment)
- Search filtering
- Pagination
- CORS headers
- Swagger docs availability

---

## 21. Docker and Deployment

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Builder (full Node.js, installs all deps, compiles TypeScript)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # Install ALL dependencies
COPY . .
RUN npm run build             # Compile TypeScript → dist/

# Stage 2: Production (minimal Node.js, only prod deps)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev         # Only production dependencies
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Why Multi-Stage?

- **Builder stage** needs devDependencies (TypeScript compiler, NestJS CLI)
- **Production stage** only needs runtime dependencies
- **Result** — Final image is ~150MB instead of ~400MB

### .dockerignore

Excludes `node_modules`, `dist`, `frontend`, `.git`, `*.md`, `*.sh` from the
Docker build context. This keeps the image small and prevents local state from
leaking into the container.

---

## 22. Swagger API Documentation

### Accessing Swagger UI

Navigate to `http://localhost:3000/docs` in your browser. You'll see an interactive
API documentation page.

### Features

- **Try It Out** — Click "Try it out" on any endpoint to send real requests
- **Authentication** — Click "Authorize" to enter your JWT token; all subsequent
  requests will include it
- **Schema** — View request/response schemas for every endpoint
- **Error examples** — See what error responses look like

### How It's Generated

Swagger decorators on controllers and DTOs generate the OpenAPI specification:

```typescript
@ApiTags('Courses')                    // Groups under "Courses"
@Controller('courses')
export class CourseController {
  @Post()
  @ApiOperation({ summary: 'Create a new course' })  // Endpoint description
  @ApiBearerAuth()                      // Requires JWT token
  @ApiResponse({ status: 201, description: 'Course created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateCourseDto) { ... }
}
```

---

## 23. File Structure Explained

### Backend

```
src/
├── auth/                          → Authentication module
│   ├── dto/auth.dto.ts            → Register and login validation rules
│   ├── strategies/jwt.strategy.ts → JWT verification logic
│   ├── user.entity.ts             → User database table (id, name, email, password, role)
│   ├── auth.controller.ts         → POST /auth/register, POST /auth/login
│   ├── auth.service.ts            → Register/login logic, admin seeding, password hashing
│   ├── auth.module.ts             → Wires up JWT module, Passport, User entity
│   ├── auth.constants.ts          → Shared JWT secret constant
│   ├── auth.service.spec.ts       → Unit tests for auth
│   ├── jwt-auth.guard.ts          → Guard that validates JWT tokens
│   ├── roles.guard.ts             → Guard that checks user roles
│   └── roles.decorator.ts         → @Roles() decorator for marking admin-only routes
│
├── courses/                       → Course module
│   ├── dto/create-course.dto.ts   → Validation for creating courses
│   ├── dto/update-course.dto.ts   → Validation for updating courses
│   ├── course.entity.ts           → Course database table
│   ├── course.controller.ts       → All /courses endpoints
│   ├── course.service.ts          → Business logic (CRUD, pagination, search)
│   ├── course.module.ts           → Module configuration
│   └── course.service.spec.ts     → Unit tests
│
├── students/                      → Student module
│   ├── dto/create-student.dto.ts  → Validation for enrolling students
│   ├── dto/update-student.dto.ts  → Validation for updating students
│   ├── student.entity.ts          → Student database table
│   ├── student.controller.ts      → All /students endpoints
│   ├── student.service.ts         → Business logic (enrollment, seat checks)
│   ├── student.module.ts          → Module configuration
│   └── student.service.spec.ts    → Unit tests
│
├── app.module.ts                  → Root module (connects DB, imports all modules)
└── main.ts                        → Entry point (CORS, ValidationPipe, Swagger, listen)
```

### Frontend

```
frontend/src/
├── components/
│   ├── Layout/Layout.tsx          → Sidebar navigation + main content wrapper
│   ├── Course/CourseTable.tsx      → Table listing courses with seat badges
│   ├── Course/CourseForm.tsx       → Form for creating/editing courses
│   ├── Student/StudentTable.tsx    → Table listing students
│   ├── Student/EnrollForm.tsx      → Form for enrolling students
│   ├── Student/EditStudentForm.tsx → Form for editing student info
│   ├── shared/Modal.tsx           → Reusable overlay dialog
│   ├── shared/ConfirmDialog.tsx   → Confirmation prompt (delete, etc.)
│   ├── shared/Toast.tsx           → Auto-dismissing notification
│   ├── shared/Pagination.tsx      → Page navigation controls
│   └── shared/SearchBar.tsx       → Debounced search input
│
├── context/AuthContext.tsx         → Auth state (user, token, login/logout)
├── pages/CoursesPage.tsx          → Course list with CRUD operations
├── pages/CourseDetailPage.tsx     → Single course + enrolled students
├── pages/StudentsPage.tsx         → All students with enroll/edit
├── pages/LoginPage.tsx            → Login form
├── pages/RegisterPage.tsx         → Registration form
├── services/api.ts                → HTTP client (all API calls)
├── types/index.ts                 → TypeScript interfaces
├── App.tsx                        → Root component with routing
└── App.css                        → All styles (design system)
```

---

## 24. Request Lifecycle (Detailed)

### A Complete Request: Enrolling a Student

```
1. User clicks "Enroll Student" button on CourseDetailPage
   ↓
2. Modal opens with EnrollForm
   ↓
3. User fills in name, email, enrollDate
   ↓
4. User clicks "Enroll" → EnrollForm calls onSubmit({ name, email, courseId })
   ↓
5. CourseDetailPage.handleEnroll() is called
   ↓
6. handleEnroll calls api.enrollStudent({ name, email, courseId })
   ↓
7. api.ts request() function:
   a. Sets Content-Type: application/json
   b. Attaches Authorization: Bearer <token>
   c. Sends POST http://localhost:3000/students
   ↓
8. Browser sends CORS preflight OPTIONS request
   ↓
9. Server responds with CORS headers (allows origin, methods, headers)
   ↓
10. Browser sends actual POST request
    ↓
11. NestJS receives request, processes middleware pipeline:
    a. ValidationPipe validates CreateStudentDto
    b. JwtAuthGuard verifies JWT → attaches user to request
    c. RolesGuard checks user.role === 'admin' → passes
    ↓
12. StudentController.create() receives validated DTO
    ↓
13. StudentService.create() executes business logic:
    a. Find course by courseId → 404 if not found
    b. Count current enrollment → check against seatLimit
    c. If full → throw ConflictException (409)
    d. Create student entity with enrollDate defaulting to today
    e. Save to database
    ↓
14. Saved student returned as JSON with status 201
    ↓
15. Frontend receives response:
    a. request() parses JSON → returns to caller
    b. handleEnroll shows success toast
    c. fetchStudents() re-fetches the student list
    d. fetchCourse() re-fetches course (to update seat count)
    ↓
16. UI re-renders with updated student list and seat count
```

---

## 25. Security Considerations

### What's Protected

- **Passwords** — Hashed with bcrypt (not stored in plain text)
- **JWT tokens** — Signed with a secret key; cannot be forged
- **Write endpoints** — Require valid JWT token
- **Admin endpoints** — Require admin role in JWT
- **Input validation** — All inputs validated at DTO level
- **Whitelist mode** — Unknown fields rejected
- **CORS** — Only allows requests from the frontend origin
- **SQL injection** — Prevented by TypeORM parameterized queries
- **XSS** — React auto-escapes rendered content

### What's Not (Acceptable for This Scope)

- **Rate limiting** — No throttling on login attempts (brute force possible)
- **HTTPS** — Running on HTTP (fine for localhost)
- **CSRF** — JWT tokens are not vulnerable to CSRF (not cookie-based)
- **Input length limits on password** — Only min length (6) is enforced
- **Account lockout** — No lockout after failed attempts

---

## 26. Scaling Considerations

This project is designed for a single-developer evaluation scope. For production:

| Concern | Current | Production |
|---------|---------|------------|
| Database | SQLite (file-based) | PostgreSQL/MySQL (server-based) |
| Auth secret | Hardcoded default | Environment variable |
| CORS origin | Hardcoded localhost | Environment variable |
| Schema sync | `synchronize: true` | Migrations |
| Rate limiting | None | `@nestjs/throttler` |
| Logging | Console | Structured logging (Winston) |
| Docker | Basic Dockerfile | Docker Compose with DB |
| CI/CD | None | GitHub Actions |
| Testing | Unit + manual E2E | Integration tests + CI pipeline |

---

## 27. How to Demo the Application

### For the Walkthrough

1. **Start both servers:**
   ```bash
   # Terminal 1 (backend)
   npm run build && node dist/main

   # Terminal 2 (frontend)
   cd frontend && npm run dev
   ```

2. **Show Swagger docs** — Navigate to `http://localhost:3000/docs`

3. **Login as admin** — `admin@campus.com` / `admin123`

4. **Create a course** — Show form validation, seat limit field

5. **Enroll students** — Show seat count updating, badge color changes

6. **Fill a course to capacity** — Enroll up to the seat limit, then try one more
   → show the 409 "Course is full" error

7. **Register a student account** — Show that new users get student role, see
   read-only UI (no create/edit/delete buttons)

8. **Log back in as admin** — Show admin UI with full controls

9. **Delete a course** — Show the confirmation dialog and cascade behavior

10. **Search** — Type in the search bar to filter courses/students

11. **Pagination** — Create enough data to show multiple pages

12. **Mobile view** — Resize the browser to show responsive sidebar collapse

### Key Points to Mention

- Role-based access control (admin vs student)
- Seat limit enforcement (the edge case from the brief)
- JWT authentication on write operations
- Validation on all inputs
- Consistent error responses
- Incremental git history (not one dump)
- Unit tests for business logic
- Docker support for deployment

---

> This document covers the complete architecture, design decisions, and
> implementation details of the Course Enrollment system. It's intended
> as a companion to the codebase — read the code for specifics, read this
> document for understanding.
