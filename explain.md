# Course Enrollment — Project Explanation

## What Is This?

A full-stack web application where administrators manage courses and enroll students into them. Built with **Spring Boot 3 (Java 21)** for the backend and **React 19** for the frontend, using **SQLite** for persistent storage and stateless **JWT** for authentication and role-based access control.

Think of it like a simplified university course registration system.

---

## How It Works (Concept)

There are two main entities:

**Course** — A class being offered (e.g. "Math 101", taught by "Dr. Smith", with 30 seats).

**Student** — A person enrolled in a course. Each student belongs to exactly one course.

The relationship is **one-to-many**: one course has many students, but each student is in only one course. This is enforced at the database level through a foreign key (`course_id`) on the student table.

The key business rule: **seat limits**. If a course has 30 seats and 30 students are enrolled, the 31st enrollment attempt is rejected with a "Course is full" error (`409 Conflict`). This is checked server-side transactionally before every enrollment.

---

## Backend Architecture (Spring Boot 3)

### Framework

Spring Boot 3.3.4 running on **Java 21**. It follows standard Spring architectural principles: **Controller layer**, **Service layer (business logic)**, **Repository layer (Spring Data JPA)**, and **Entity model**.

### Packages

| Package | Purpose |
|---------|---------|
| `com.courseenrollment.config` | SecurityConfig, JwtAuthFilter, JwtService, WebMvcConfig, OpenApiConfig, DataInitializer |
| `com.courseenrollment.course` | Course entity, repository, DTOs, service, and controller |
| `com.courseenrollment.student` | Student entity, repository, DTOs, service, and controller |
| `com.courseenrollment.auth` | User entity, repository, DTOs, service, and controller |
| `com.courseenrollment.common` | PaginatedResponse, PageMeta, ApiErrorResponse, and GlobalExceptionHandler |

### Controllers vs Services vs Repositories

- **Controller** (`@RestController`) — Receives incoming HTTP requests, performs parameter validation via `@Valid`, delegates to the service, and returns structured HTTP responses.
- **Service** (`@Service`) — Contains the business logic and transaction boundaries (`@Transactional`). Checks rules, verifies seat limits, and manages persistence.
- **Repository** (`@Repository`) — Spring Data JPA interface executing SQL/JPQL queries against the SQLite database.

Example flow for enrolling a student:
1. `StudentController.create()` receives POST `/students` with `@Valid CreateStudentRequest`
2. Passes the request to `StudentService.create()` inside `@Transactional`
3. Service checks: Does the course exist? Is it full (`countByCourseId >= seatLimit`)? Is email already taken?
4. If OK, saves the student to SQLite
5. If full, throws `ConflictException("Course is full. Cannot enroll more students.")` returning HTTP 409

### Entities (Database Tables)

JPA entities mapped to SQLite tables via Hibernate 6 Community Dialect:

**Course table (`courses`):**
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Auto-increment primary key |
| name | string | Required, max 255 chars |
| instructor | string | Required, max 255 chars |
| seat_limit | integer | Required, minimum 1 |
| created_at | datetime | Auto-set on creation |
| updated_at | datetime | Auto-updated |

**Student table (`students`):**
| Column | Type | Notes |
|--------|------|-------|
| id | integer | Auto-increment primary key |
| name | string | Required, max 255 chars |
| email | string | Required, unique, valid email |
| enroll_date | string | Defaults to current date (YYYY-MM-DD) |
| course_id | integer | Foreign key → Course |
| created_at | datetime | Auto-set on creation |
| updated_at | datetime | Auto-updated |

The `course_id` on the Student table creates the relationship. When a course is deleted, all enrolled students are cascade-deleted automatically.

### Validation

Jakarta Validation annotations on request DTOs enforce constraints before controller execution:

```java
// CreateCourseRequest
@NotBlank(message = "name should not be empty")
@Size(max = 255)
private String name;

@NotBlank(message = "instructor should not be empty")
@Size(max = 255)
private String instructor;

@NotNull(message = "seatLimit should not be empty")
@Min(value = 1, message = "seatLimit must not be less than 1")
private Integer seatLimit;
```

If an invalid payload is sent (e.g. `{"name": "", "seatLimit": 0}`), Spring's validator rejects the request and `GlobalExceptionHandler` returns HTTP 400 Bad Request with descriptive error messages.

### Error Handling

Every error follows a consistent JSON format:

```json
{
  "statusCode": 409,
  "message": "Course is full. Cannot enroll more students.",
  "error": "Conflict"
}
```

| Status | Meaning | When |
|--------|---------|------|
| 400 | Bad Request | Validation failed (missing field, invalid email, seat limit < 1) |
| 401 | Unauthorized | Missing, invalid, or expired JWT token |
| 403 | Forbidden | Logged in as student but attempting an admin write action |
| 404 | Not Found | Course or student ID does not exist |
| 409 | Conflict | Business rule violated (course full, duplicate email, cannot reduce seatLimit below enrolled) |
| 500 | Server Error | Unexpected server error |

### Authentication & Authorization

- **Stateless JWT:** Created with JJWT (`io.jsonwebtoken`) signing HMAC-SHA256 tokens containing user `sub` (ID), `email`, and `role`.
- **Spring Security Filter:** `JwtAuthFilter` checks the `Authorization: Bearer <token>` header on every request and sets the `SecurityContext`.
- **Role-Based Access Control:**
  - `Admin` — Full access: create/edit/delete courses, enroll/edit/remove students.
  - `Student` — Read-only access: view courses and students.
- **Seeded Admin Account:** `admin@campus.com` / `admin123` auto-created on first startup via `DataInitializer`.
- **Role Switch Support:** Endpoint `POST /auth/switch-role` and UI toggles allow switching between Admin and Student modes effortlessly.

### Pagination & Search

All list endpoints support pagination and search:

```
GET /courses?page=1&limit=10&search=math
```

Response format:
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

### Swagger (API Docs)

Interactive OpenAPI 3.0 docs available at **`http://localhost:3000/docs`**. You can test every endpoint directly in the browser.

---

## Frontend Architecture (React)

### Routing

React Router handles client-side navigation:

| Path | Page | Access |
|------|------|--------|
| `/login` | Login form with 1-click Demo Admin login | Public |
| `/register` | Register form with role selection | Public |
| `/courses` | Course list + search + create/edit/delete | Authenticated |
| `/courses/:id` | Course detail + enrolled students + enroll | Authenticated |
| `/students` | Student list + enroll/edit/delete | Authenticated |

Protected routes redirect to `/login` if no valid token exists.

### Auth Flow & Role UI

- User logs in → JWT saved to `localStorage` → state stored in `AuthContext`.
- If logged in as **Admin**: Full write controls are visible ("New Course", "Enroll Student", Edit, Delete).
- If logged in as **Student**: Top notification banner and sidebar switcher inform the user of read-only mode and provide a **"⚡ Switch to Admin"** button.

---

## Data Flow Summary

```
Browser → HTTP Request → Spring Controller → Service (business logic) → Spring Data JPA → SQLite
                                    ↓
                            Validation (@Valid)
                            Auth (JwtAuthFilter)
                            Role (@PreAuthorize)
```

```
SQLite → Spring Data JPA → Service → Controller → HTTP Response → Browser (React re-render)
```

---

## How to Run

```bash
# Backend (Spring Boot 3)
./mvnw clean package
java -jar target/course-enrollment-0.0.1-SNAPSHOT.jar
# Server runs at http://localhost:3000
# Swagger at http://localhost:3000/docs

# Tests
./mvnw test
bash test-e2e.sh

# Frontend
cd frontend
npm install
npm run dev
# App at http://localhost:5173

# Docker
docker build -t course-enrollment .
docker run -p 3000:3000 course-enrollment
```

**Default admin:** `admin@campus.com` / `admin123`
