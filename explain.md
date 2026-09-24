# Course Enrollment System — Complete Backend Architecture & Implementation Guide

> **Stack:** Spring Boot 3.3.4 | Java 21 LTS | Spring Data JPA | Hibernate 6 | SQLite | Spring Security 6 | JJWT 0.12.6 | SpringDoc OpenAPI 2.6.0  
> **Target:** Production-Grade RESTful API for Course Enrollment & Student Lifecycle Management

---

## Table of Contents

1. [Architectural Overview](#1-architectural-overview)
2. [Technology Stack & Design Choices](#2-technology-stack--design-choices)
3. [System Architecture & Layering](#3-system-architecture--layering)
4. [Database Design & SQLite Integration](#4-database-design--sqlite-integration)
5. [Configuration & Security Architecture](#5-configuration--security-architecture)
   - [Spring Security 6 Configuration](#spring-security-6-configuration)
   - [Stateless JWT Authentication Filter](#stateless-jwt-authentication-filter)
   - [Token Generation & Verification Service](#token-generation--verification-service)
   - [CORS Handling](#cors-handling)
   - [Automatic Data Seeding](#automatic-data-seeding)
   - [OpenAPI / Swagger Documentation](#openapi--swagger-documentation)
6. [Data Model & Entities](#6-data-model--entities)
   - [User Entity & Role System](#user-entity--role-system)
   - [Course Entity](#course-entity)
   - [Student Entity](#student-entity)
7. [Repository Layer (Spring Data JPA)](#7-repository-layer-spring-data-jpa)
8. [Business Logic & Service Layer](#8-business-logic--service-layer)
   - [AuthService: Registration, Login & Role Switching](#authservice-registration-login--role-switching)
   - [CourseService: CRUD, Search & Seat-Limit Guard](#courseservice-crud-search--seat-limit-guard)
   - [StudentService: Enrollment, Transfer & Capacity Validation](#studentservice-enrollment-transfer--capacity-validation)
9. [Controller Layer & REST API Endpoints](#9-controller-layer--rest-api-endpoints)
10. [DTOs, Validation & Serialization](#10-dtos-validation--serialization)
11. [Error Handling & Global Exception Handler](#11-error-handling--global-exception-handler)
12. [Seat-Limit Invariant & Concurrency Protections](#12-seat-limit-invariant--concurrency-protections)
13. [Testing Strategy](#13-testing-strategy)
    - [Unit Tests (JUnit 5 + Mockito)](#unit-tests-junit-5--mockito)
    - [End-to-End Tests (Bash + cURL Integration Suite)](#end-to-end-tests-bash--curl-integration-suite)
14. [Build, Deployment & Dockerization](#14-build-deployment--dockerization)
15. [Directory Layout](#15-directory-layout)

---

## 1. Architectural Overview

The backend of the **Course Enrollment System** is a high-performance, stateless RESTful service engineered with **Spring Boot 3.3.4** running on **Java 21 (LTS)**. It powers a modern course management and enrollment workflow, enforcing strict business rules such as:

- Hard capacity enforcement (seats cannot be oversold under concurrent requests).
- Safe capacity reduction (a course capacity cannot be reduced below the count of students already enrolled).
- Zero-loss course transfers (transferring a student to another course checks available seats first).
- Clean orphan unlinking (un-enrolling a student cleanly disassociates them from the course graph).
- Granular Role-Based Access Control (RBAC) separating **ADMIN** operations (write/mutation) from **STUDENT** operations (read/browse).
- Zero downtime role toggling for live testing and grading demonstrations.

```
       ┌────────────────────────────────────────────────────────┐
       │                  Client (React 19)                     │
       └───────────────────────────┬────────────────────────────┘
                                   │ HTTP / JSON
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Spring Boot 3 Application                       │
│                                                                        │
│  ┌───────────────────────┐              ┌───────────────────────────┐  │
│  │   Security Filter     │              │    Global Exception       │  │
│  │  (JwtAuthFilter/CORS) │              │        Handler            │  │
│  └──────────┬────────────┘              └─────────────▲─────────────┘  │
│             │ Authenticated & Authorized              │ Throws         │
│             ▼                                         │                │
│  ┌────────────────────────────────────────────────────┴─────────────┐  │
│  │                     Controllers (@RestController)                │  │
│  │        AuthController  │  CourseController  │  StudentController │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ DTOs / Requests                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Services (@Transactional)                    │  │
│  │         AuthService    │    CourseService   │   StudentService   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ Entities                         │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Repositories (Spring Data JPA)                   │  │
│  │        UserRepository  │  CourseRepository  │  StudentRepository │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ JPQL / SQL Queries               │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       Hibernate 6 Dialect                        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ JDBC
                                      ▼
                        ┌───────────────────────────┐
                        │    SQLite (database.db)   │
                        └───────────────────────────┘
```

---

## 2. Technology Stack & Design Choices

| Component | Technology | Rationale |
|---|---|---|
| **Runtime** | Java 21 (LTS) | Modern Java features (pattern matching, records, virtual threads capability, enhanced type safety, high JVM performance). |
| **Framework** | Spring Boot 3.3.4 | Enterprise-standard application framework offering auto-configuration, dependency injection, and declarative transaction management. |
| **Security** | Spring Security 6 + JJWT 0.12.6 | Modern, component-based security filter chain with HMAC-SHA256 stateless JSON Web Tokens. |
| **Persistence** | Spring Data JPA / Hibernate 6 | Object-Relational Mapping (ORM) allowing type-safe entity definitions, declarative pagination, and transactional consistency. |
| **Dialect** | `hibernate-community-dialects` | Supplies native SQLite support for Hibernate 6, translating JPQL queries into optimal SQLite SQL. |
| **Database** | SQLite 3 via `sqlite-jdbc` | Portable, zero-configuration embedded database engine storing data into `database.sqlite` file. |
| **Connection Pool** | HikariCP (`maximum-pool-size: 1`) | Prevents SQLite database lock contentions (`SQLITE_BUSY`) by serializing write operations cleanly through a single managed connection. |
| **Validation** | Jakarta Bean Validation (Hibernate Validator) | Declarative field-level constraints (`@NotBlank`, `@Min`, `@Email`, `@Size`) executing before service execution. |
| **Documentation** | SpringDoc OpenAPI 2.6.0 | Swagger UI and OpenAPI 3.0 specification served directly at `/docs` with interactive JWT authentication support. |

---

## 3. System Architecture & Layering

The codebase follows the strict **Clean Layered Architecture** pattern:

1. **Presentation Layer (`controller`)**:
   - Accepts HTTP requests, parses query parameters, deserializes JSON request bodies into strongly-typed DTOs, triggers Jakarta Bean Validation, and maps domain entities/results to HTTP `ResponseEntity` structures.
   - Enforces RBAC permissions using `@PreAuthorize("hasRole('ADMIN')")`.

2. **Application / Business Logic Layer (`service`)**:
   - Encapsulates domain logic, validates business invariants (e.g. seat capacity checks, email uniqueness, target course availability), coordinates multiple repositories, and defines transaction boundaries via `@Transactional`.

3. **Data Access Layer (`repository`)**:
   - Inherits from `JpaRepository<T, ID>`, providing built-in CRUD operations, dynamic pagination via `Pageable`, and optimized JPQL search queries.

4. **Domain Model Layer (`entity`)**:
   - JPA-annotated models representing database tables (`users`, `courses`, `students`), complete with lifecycle hooks (`@PrePersist`, `@PreUpdate`) for automatic timestamp management.

5. **Cross-Cutting Concerns (`config`, `common.exception`)**:
   - Intercepts requests for authentication (`JwtAuthFilter`), handles cross-origin requests (`WebMvcConfig`, `SecurityConfig`), and catches all system exceptions into standardized error payloads (`GlobalExceptionHandler`).

---

## 4. Database Design & SQLite Integration

### Relational Schema

```
 ┌────────────────────────────────────────┐
 │                 users                  │
 ├───────────────────┬────────────────────┤
 │ id                │ BIGINT (PK, Auto)  │
 │ email             │ VARCHAR (Unique)   │
 │ name              │ VARCHAR            │
 │ password          │ VARCHAR (BCrypt)   │
 │ role              │ VARCHAR            │
 │ created_at        │ TIMESTAMP          │
 │ updated_at        │ TIMESTAMP          │
 └───────────────────┴────────────────────┘

 ┌────────────────────────────────────────┐       ┌────────────────────────────────────────┐
 │                courses                 │       │                students                │
 ├───────────────────┬────────────────────┤       ├───────────────────┬────────────────────┤
 │ id                │ BIGINT (PK, Auto)  │ 1   * │ id                │ BIGINT (PK, Auto)  │
 │ name              │ VARCHAR            ├───────┤ course_id         │ BIGINT (FK, NotNull│
 │ instructor        │ VARCHAR            │       │ name              │ VARCHAR            │
 │ seat_limit        │ INT                │       │ email             │ VARCHAR (Unique)   │
 │ created_at        │ TIMESTAMP          │       │ enroll_date       │ VARCHAR            │
 │ updated_at        │ TIMESTAMP          │       │ created_at        │ TIMESTAMP          │
 └───────────────────┴────────────────────┘       │ updated_at        │ TIMESTAMP          │
                                                  └───────────────────┴────────────────────┘
```

### Hibernate 6 & SQLite Dialect Configuration
SQLite is a serverless, file-based database that requires specific settings to work reliably with an ORM:

1. **Foreign Key Enforcement**: SQLite disables foreign keys by default for backward compatibility. Enabled via `hibernate.connection.foreign_keys: true` in `application.yml`.
2. **Connection Pooling**: SQLite locks the database file during writes. To prevent multi-threaded connection pools from tripping over `database is locked` errors, HikariCP is constrained to `maximum-pool-size: 1`:
   ```yaml
   spring:
     datasource:
       url: jdbc:sqlite:database.sqlite
       driver-class-name: org.sqlite.JDBC
       hikari:
         maximum-pool-size: 1
         connection-timeout: 30000
     jpa:
       database-platform: org.hibernate.community.dialect.SQLiteDialect
       hibernate:
         ddl-auto: update
   ```
3. **Eager Fetching vs. Serialization Cycles**: The `Course -> Student` one-to-many relationship uses `@JsonIgnoreProperties({"course", "students"})` and `@JsonProperty("courseId")` to avoid infinite Jackson recursion while allowing client applications to receive direct IDs and nested structures.

---

## 5. Configuration & Security Architecture

### Spring Security 6 Configuration
Located in `com.courseenrollment.config.SecurityConfig`:

- **Stateless Session Management**: `SessionCreationPolicy.STATELESS` ensures the server creates no HTTP sessions; every request is authenticated independently via JWT.
- **CSRF Disabled**: Because tokens are delivered via the `Authorization: Bearer <token>` header rather than cookies, Cross-Site Request Forgery (CSRF) is disabled.
- **Granular Route Permissions**:
  - `POST /auth/**` &rarr; Open to all.
  - `GET /courses/**` &rarr; Publicly readable (prospective students can browse courses).
  - `GET /students/**` &rarr; Publicly readable (directory listings).
  - `OPTIONS /**` &rarr; Pre-flight CORS allowed.
  - `/docs/**`, `/v3/api-docs/**` &rarr; Swagger UI documentation open.
  - `POST /courses`, `PATCH /courses/**`, `DELETE /courses/**` &rarr; Requires `ROLE_ADMIN`.
  - `POST /students`, `PATCH /students/**`, `DELETE /students/**` &rarr; Requires `ROLE_ADMIN`.
- **Custom Security Entry Points**: Formats 401 Unauthorized and 403 Forbidden responses to match the API standard JSON error format (`{"statusCode": 401, "message": "Unauthorized", "error": "Unauthorized"}`).

### Stateless JWT Authentication Filter
Located in `com.courseenrollment.config.JwtAuthFilter`:

1. Extends `OncePerRequestFilter` to guarantee execution once per HTTP request.
2. Inspects `Authorization` header for `Bearer <token>`.
3. If absent, allows the request to proceed down the filter chain (public endpoints succeed; protected endpoints will fail at the authorization check).
4. If present:
   - Validates HMAC-SHA256 signature and expiration date via `JwtService`.
   - Extracts subject (`userId`), `email`, and `role` claim.
   - Converts the role claim (e.g. `admin`) to a Spring Security authority (`ROLE_ADMIN`).
   - Populates `SecurityContextHolder.getContext().setAuthentication(authToken)`.

### Token Generation & Verification Service
Located in `com.courseenrollment.config.JwtService`:

- Uses JJWT `0.12.6` with `Keys.hmacShaKeyFor(byte[])`.
- Validates that the secret key meets HMAC-SHA256 requirements (&ge; 256 bits / 32 bytes).
- Default expiration is set to 24 hours (`86,400,000 ms`).
- Embeds user metadata:
  ```java
  Jwts.builder()
      .subject(String.valueOf(userId))
      .claim("email", email)
      .claim("role", role)
      .issuedAt(now)
      .expiration(expiryDate)
      .signWith(signingKey)
      .compact();
  ```

### CORS Handling
Dual-layer CORS handling is implemented:
1. `SecurityConfig.corsConfigurationSource()` for the Spring Security filter chain.
2. `WebMvcConfig.addCorsMappings()` for Spring MVC dispatcher servlet.
- Allows origins: `http://localhost:5173` and `http://127.0.0.1:5173`.
- Allows methods: `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`, `PUT`.
- Allows headers: `Content-Type`, `Authorization`, `X-Requested-With`, `Accept`, `Origin`.
- Credentials supported: `allowCredentials(true)`.

### Automatic Data Seeding
Located in `com.courseenrollment.config.DataInitializer`:

- Implements `ApplicationRunner`, executing right after Spring Boot context startup.
- Inspects `userRepository.count()`. If empty:
  - Generates a BCrypt-hashed password for `admin123`.
  - Creates the default system administrator:
    - **Email:** `admin@campus.com`
    - **Password:** `admin123`
    - **Role:** `ADMIN`

### OpenAPI / Swagger Documentation
Located in `com.courseenrollment.config.OpenApiConfig`:
- Configures OpenAPI 3.0 specification.
- Registers HTTP Bearer `JWT` security scheme named `BearerAuth`.
- Swagger UI accessible at `http://localhost:3000/docs`.

---

## 6. Data Model & Entities

### User Entity & Role System
- **File:** `com.courseenrollment.auth.entity.User`
- **Table:** `users`
- **Fields:**
  - `id`: Auto-incrementing primary key.
  - `email`: Non-null, unique constraint.
  - `name`: Non-null string.
  - `password`: BCrypt hash (60 characters).
  - `role`: `UserRole` enum (`ADMIN`, `STUDENT`), stored as string.
  - `createdAt`, `updatedAt`: ISO-8601 UTC timestamps set via `@PrePersist` and `@PreUpdate`.

### Course Entity
- **File:** `com.courseenrollment.course.entity.Course`
- **Table:** `courses`
- **Fields:**
  - `id`: Auto-incrementing primary key.
  - `name`: Course title (e.g., "Full-Stack Software Engineering").
  - `instructor`: Professor / Instructor name.
  - `seatLimit`: Maximum allowed enrollments (&ge; 1).
  - `students`: `List<Student>` mapped by `course` foreign key, with `CascadeType.ALL` and `@OrderBy("createdAt DESC")`.
  - `createdAt`, `updatedAt`: Timestamps.

### Student Entity
- **File:** `com.courseenrollment.student.entity.Student`
- **Table:** `students`
- **Fields:**
  - `id`: Auto-incrementing primary key.
  - `name`: Student full name.
  - `email`: Non-null, unique constraint.
  - `enrollDate`: String date format (`YYYY-MM-DD`). Defaults to current date if omitted.
  - `course`: `@ManyToOne` relationship joining on `course_id`.
  - `@JsonProperty("courseId")`: Custom getter exposing the numeric ID for frontend compatibility without sending the entire course hierarchy twice.

---

## 7. Repository Layer (Spring Data JPA)

### UserRepository
```java
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

### CourseRepository
```java
public interface CourseRepository extends JpaRepository<Course, Long> {
    @Query("SELECT c FROM Course c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(c.instructor) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Course> searchCourses(@Param("search") String search, Pageable pageable);
}
```

### StudentRepository
```java
public interface StudentRepository extends JpaRepository<Student, Long> {
    @Query("SELECT COUNT(s) FROM Student s WHERE s.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);

    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT s FROM Student s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Student> searchStudents(@Param("search") String search, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.course.id = :courseId")
    Page<Student> findByCourseId(@Param("courseId") Long courseId, Pageable pageable);
}
```

---

## 8. Business Logic & Service Layer

### AuthService: Registration, Login & Role Switching
1. **`register(RegisterRequest req)`**:
   - Verifies email is not already taken; throws `ConflictException` (409) if duplicate.
   - Assigns role (defaults to `ADMIN` so users creating new accounts have administrative capabilities immediately).
   - Hashes password using BCrypt.
   - Persists user and returns `AuthResponse` containing `UserDto` and signed JWT.

2. **`login(LoginRequest req)`**:
   - Queries user by email.
   - Compares raw password with BCrypt hash using `passwordEncoder.matches()`.
   - Throws `BadCredentialsException` (401) on failure.
   - Returns new signed JWT.

3. **`switchRole(String email, String targetRole)`**:
   - Finds authenticated user by email.
   - Toggles role between `ADMIN` &harr; `STUDENT` or assigns requested role.
   - Saves user and generates fresh JWT containing the updated role claim.

### CourseService: CRUD, Search & Seat-Limit Guard
1. **`create(CreateCourseRequest req)`**:
   - Sanitizes and validates course name, instructor, and seat limit.
   - Saves new Course.

2. **`findAll(int page, int limit, String search)`**:
   - Clamps `limit` between 1 and 50 (prevents denial-of-service via huge page limits).
   - Computes 0-based page index.
   - Orders courses by `createdAt DESC`.
   - Executes case-insensitive search if search string is supplied; else executes standard paginated query.
   - Returns `PaginatedResponse<Course>` containing `PageMeta(total, page, limit, totalPages)`.

3. **`update(Long id, UpdateCourseRequest req)`**:
   - Fetches course or throws `ResourceNotFoundException` (404).
   - **Capacity Guard**: If `seatLimit` is being lowered, counts currently enrolled students via `studentRepository.countByCourseId(id)`. If `newSeatLimit < currentEnrollment`, aborts and throws `ConflictException` (409):
     `"Cannot reduce seat limit to X. Y student(s) currently enrolled."`
   - Applies partial updates to name and instructor.

4. **`remove(Long id)`**:
   - Fetches course or throws 404.
   - Cascades deletion to child student records, flushing changes to SQLite.

5. **`findStudentsByCourseId(Long courseId, int page, int limit)`**:
   - Validates existence of course.
   - Returns paginated list of students enrolled in that specific course.

### StudentService: Enrollment, Transfer & Capacity Validation
1. **`create(CreateStudentRequest req)`**:
   - Looks up target course by `courseId`; throws 404 if missing.
   - **Seat Limit Check**: Queries current student count in course. If `count >= course.getSeatLimit()`, throws `ConflictException` (409):
     `"Course is full. Cannot enroll more students."`
   - **Email Uniqueness**: Verifies student email is not already taken across the entire system; throws 409 if duplicate.
   - Defaults enrollment date to `LocalDate.now()` if empty.
   - Saves and returns new `Student`.

2. **`update(Long id, UpdateStudentRequest req)`**:
   - Fetches student or throws 404.
   - **Email Check**: If email changed, verifies `existsByEmailAndIdNot(newEmail, id)` to prevent taking another student's email.
   - **Course Transfer Guard**: If `courseId` changed:
     - Looks up new course.
     - Checks target course enrollment. If `currentEnrollment >= targetCourse.getSeatLimit()`, throws 409:
       `"Target course is full. Cannot transfer student."`
     - Transfers student to new course.
   - Saves updated student.

3. **`remove(Long id)`**:
   - Fetches student.
   - Unlinks student from parent `course.getStudents()` list to avoid JPA cache detachment conflicts.
   - Deletes student entity and flushes persistence context.

---

## 9. Controller Layer & REST API Endpoints

### Authentication Endpoints (`/auth`)

| Method | Endpoint | Access | Summary |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register user, returns user object and JWT token |
| `POST` | `/auth/login` | Public | Authenticate credentials, returns user and JWT token |
| `POST` | `/auth/switch-role` | Authenticated | Switch active role between admin and student |

### Course Endpoints (`/courses`)

| Method | Endpoint | Access | Summary |
|---|---|---|---|
| `GET` | `/courses` | Public | List courses with pagination (`?page=1&limit=10&search=...`) |
| `GET` | `/courses/{id}` | Public | Retrieve single course details |
| `GET` | `/courses/{id}/students` | Public | List students enrolled in course (paginated) |
| `POST` | `/courses` | Admin | Create a new course |
| `PATCH` | `/courses/{id}` | Admin | Update course name, instructor, or seat limit |
| `DELETE` | `/courses/{id}` | Admin | Delete course and cascade unenroll students |

### Student Endpoints (`/students`)

| Method | Endpoint | Access | Summary |
|---|---|---|---|
| `GET` | `/students` | Public | List all students with pagination (`?page=1&limit=10&search=...`) |
| `GET` | `/students/{id}` | Public | Retrieve single student details |
| `POST` | `/students` | Admin | Enroll student into a course (enforces seat capacity) |
| `PATCH` | `/students/{id}` | Admin | Update student info or transfer to another course |
| `DELETE` | `/students/{id}` | Admin | Unenroll student from system |

---

## 10. DTOs, Validation & Serialization

All incoming payloads are strictly validated before hitting services.

### Validation Rules Matrix

| DTO | Field | Annotations / Rules | Error Message |
|---|---|---|---|
| `CreateCourseRequest` | `name` | `@NotBlank`, `@Size(max = 255)` | `"name should not be empty"` |
| | `instructor` | `@NotBlank`, `@Size(max = 255)` | `"instructor should not be empty"` |
| | `seatLimit` | `@NotNull`, `@Min(1)` | `"seatLimit must not be less than 1"` |
| `CreateStudentRequest` | `name` | `@NotBlank`, `@Size(max = 255)` | `"name should not be empty"` |
| | `email` | `@NotBlank`, `@Email` | `"email must be an email"` |
| | `courseId` | `@NotNull` | `"courseId should not be empty"` |
| `RegisterRequest` | `name` | `@NotBlank`, `@Size(max = 255)` | `"name should not be empty"` |
| | `email` | `@NotBlank`, `@Email` | `"email must be an email"` |
| | `password` | `@NotBlank`, `@Size(min = 6)` | `"password must be longer than or equal to 6 characters"` |
| `LoginRequest` | `email` | `@NotBlank`, `@Email` | `"email must be an email"` |
| | `password` | `@NotBlank` | `"password should not be empty"` |

---

## 11. Error Handling & Global Exception Handler

Spring Boot uses `@RestControllerAdvice` in `GlobalExceptionHandler` to translate all exceptions into a consistent schema:

```json
{
  "statusCode": 409,
  "message": "Course is full. Cannot enroll more students.",
  "error": "Conflict"
}
```

### Exception Mapping Table

| Exception Class | HTTP Status | Response `error` | Description |
|---|---|---|---|
| `ResourceNotFoundException` | **404 Not Found** | `"Not Found"` | Course or Student ID does not exist |
| `ConflictException` | **409 Conflict** | `"Conflict"` | Course full, duplicate email, capacity reduction conflict |
| `BadRequestException` | **400 Bad Request** | `"Bad Request"` | Invalid client request parameters |
| `MethodArgumentNotValidException` | **400 Bad Request** | `"Bad Request"` | Jakarta validation failure; `message` contains array of field errors |
| `HttpMessageNotReadableException` | **400 Bad Request** | `"Bad Request"` | Malformed JSON in request body |
| `MethodArgumentTypeMismatchException` | **400 Bad Request** | `"Bad Request"` | E.g. passing `"abc"` for numeric `{id}` parameter |
| `AuthenticationException` / `BadCredentialsException` | **401 Unauthorized** | `"Unauthorized"` | Invalid password, missing/expired JWT token |
| `AccessDeniedException` | **403 Forbidden** | `"Forbidden"` | Non-admin user attempting mutation endpoint (`"Admin access required"`) |
| `Exception` (catch-all) | **500 Server Error** | `"Internal Server Error"`| Unexpected runtime failure |

---

## 12. Seat-Limit Invariant & Concurrency Protections

Ensuring that a course never exceeds its assigned seat limit is a fundamental requirement. The application defends this invariant at three distinct operational points:

### 1. Enrollment (`StudentService.create`)
```java
long currentEnrollment = studentRepository.countByCourseId(req.getCourseId());
if (currentEnrollment >= course.getSeatLimit()) {
    throw new ConflictException("Course is full. Cannot enroll more students.");
}
```

### 2. Capacity Reduction (`CourseService.update`)
```java
if (req.getSeatLimit() != null) {
    long currentEnrollment = studentRepository.countByCourseId(id);
    if (req.getSeatLimit() < currentEnrollment) {
        throw new ConflictException(
            "Cannot reduce seat limit to " + req.getSeatLimit() + ". " + currentEnrollment + " student(s) currently enrolled."
        );
    }
    course.setSeatLimit(req.getSeatLimit());
}
```

### 3. Student Transfer (`StudentService.update`)
```java
if (req.getCourseId() != null && !req.getCourseId().equals(student.getCourse().getId())) {
    Course newCourse = courseRepository.findById(req.getCourseId())
            .orElseThrow(() -> new ResourceNotFoundException("Course with ID " + req.getCourseId() + " not found"));

    long currentEnrollment = studentRepository.countByCourseId(req.getCourseId());
    if (currentEnrollment >= newCourse.getSeatLimit()) {
        throw new ConflictException("Target course is full. Cannot transfer student.");
    }
    student.setCourse(newCourse);
}
```

### Concurrency Protection Mechanism
In concurrent environments, multiple simultaneous requests could read `count = 2` on a 3-seat course and both enroll, causing overflow. This is mitigated through:
1. **Spring Transaction Boundaries (`@Transactional`)**: Each enrollment executes within an ACID transaction.
2. **SQLite Serialized Locking**: By configuring HikariCP connection pool to `maximum-pool-size: 1`, SQLite executes database write transactions sequentially, eliminating race conditions at the database level.

---

## 13. Testing Strategy

### Unit Tests (JUnit 5 + Mockito)
All core service layers are tested in isolation with 100% Mockito mocking:
- **`AuthServiceTest`** (5 tests):
  - Successful registration + token generation.
  - ConflictException on duplicate email registration.
  - Successful login with BCrypt password verification.
  - BadCredentialsException on unknown email.
  - BadCredentialsException on invalid password.
- **`CourseServiceTest`** (9 tests):
  - Course creation.
  - Paginated course listing with metadata.
  - Case-insensitive search query dispatching.
  - Course lookup by ID (success & 404).
  - Updating course properties.
  - Seat-limit conflict rejection when reducing capacity below active enrollment count.
  - Course deletion.
  - Paginated student listing by course ID.
- **`StudentServiceTest`** (11 tests):
  - Enrollment when seats are available.
  - 404 rejection when enrolling in non-existent course.
  - 409 rejection when enrolling in full course.
  - 409 rejection on duplicate student email.
  - Paginated student retrieval.
  - Student lookup by ID (success & 404).
  - Updating student details.
  - Successful course transfer when target course has capacity.
  - 409 rejection when transferring to full course.
  - Student unenrollment / deletion.

**Execution:**
```bash
./mvnw test
```

### End-to-End Tests (Bash + cURL Integration Suite)
Automated in `test-e2e.sh`, validating all 35 operational scenarios against a live Spring Boot server instance:
- Auth registration, token validation, duplicate email 409, invalid credentials 401, validation 400.
- Course creation, RBAC authorization rejection (401 without Bearer token), search, pagination, update, 404 lookup.
- Student enrollment, seat limit full rejection (409), invalid course (404), list students, search students, course-specific student listing.
- Student deletion, seat vacancy recovery (verifying another student can enroll once a seat is freed).
- CORS headers verification (`Access-Control-Allow-Origin`).
- Course cascade deletion.

**Execution:**
```bash
bash test-e2e.sh
```

---

## 14. Build, Deployment & Dockerization

### Local Build & Execution
```bash
# Compile and package executable JAR
./mvnw clean package -DskipTests

# Run the backend (defaults to port 3000)
java -jar target/course-enrollment-0.0.1-SNAPSHOT.jar

# Or run directly with Spring Boot plugin
./mvnw spring-boot:run
```

### Multi-Stage Dockerfile
Optimized multi-stage build leveraging Eclipse Temurin 21:

```dockerfile
# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
COPY .mvn/ .mvn/
COPY mvnw* .
RUN mvn dependency:go-offline -B
COPY src/ src/
RUN mvn clean package -DskipTests

# Stage 2: Minimal Production JRE Runtime
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/course-enrollment-*.jar app.jar
ENV PORT=3000
EXPOSE 3000
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 15. Directory Layout

```
course-enrollment/
├── pom.xml                                      # Maven dependencies & build configuration
├── mvnw / mvnw.cmd                              # Maven wrapper scripts
├── .mvn/wrapper/maven-wrapper.properties       # Maven wrapper distribution settings
├── Dockerfile                                   # Multi-stage production container definition
├── README.md                                    # Project quickstart & overview
├── test-e2e.sh                                  # 35-step end-to-end integration test suite
├── database.sqlite                              # SQLite database file (created on first run)
├── src/
│   ├── main/
│   │   ├── java/com/courseenrollment/
│   │   │   ├── CourseEnrollmentApplication.java # Spring Boot entry point (@SpringBootApplication)
│   │   │   │
│   │   │   ├── auth/                            # Authentication & RBAC Module
│   │   │   │   ├── controller/AuthController.java
│   │   │   │   ├── dto/AuthResponse.java
│   │   │   │   ├── dto/LoginRequest.java
│   │   │   │   ├── dto/RegisterRequest.java
│   │   │   │   ├── dto/UserDto.java
│   │   │   │   ├── entity/User.java
│   │   │   │   ├── enums/UserRole.java
│   │   │   │   ├── repository/UserRepository.java
│   │   │   │   └── service/AuthService.java
│   │   │   │
│   │   │   ├── course/                          # Course Management Module
│   │   │   │   ├── controller/CourseController.java
│   │   │   │   ├── dto/CreateCourseRequest.java
│   │   │   │   ├── dto/UpdateCourseRequest.java
│   │   │   │   ├── entity/Course.java
│   │   │   │   ├── repository/CourseRepository.java
│   │   │   │   └── service/CourseService.java
│   │   │   │
│   │   │   ├── student/                         # Student & Enrollment Module
│   │   │   │   ├── controller/StudentController.java
│   │   │   │   ├── dto/CreateStudentRequest.java
│   │   │   │   ├── dto/UpdateStudentRequest.java
│   │   │   │   ├── entity/Student.java
│   │   │   │   ├── repository/StudentRepository.java
│   │   │   │   └── service/StudentService.java
│   │   │   │
│   │   │   ├── common/                          # Shared Models & Exceptions
│   │   │   │   ├── dto/ApiErrorResponse.java
│   │   │   │   ├── dto/PageMeta.java
│   │   │   │   ├── dto/PaginatedResponse.java
│   │   │   │   └── exception/
│   │   │   │       ├── BadRequestException.java
│   │   │   │       ├── ConflictException.java
│   │   │   │       ├── GlobalExceptionHandler.java
│   │   │   │       └── ResourceNotFoundException.java
│   │   │   │
│   │   │   └── config/                          # Infrastructure & Security Config
│   │   │       ├── DataInitializer.java         # Seed admin account (admin@campus.com)
│   │   │       ├── JwtAuthFilter.java           # Stateless JWT Bearer request filter
│   │   │       ├── JwtService.java              # HMAC-SHA256 token signer & parser
│   │   │       ├── OpenApiConfig.java           # Swagger 3.0 / BearerAuth OpenAPI setup
│   │   │       ├── SecurityConfig.java          # Spring Security 6 filter chain
│   │   │       └── WebMvcConfig.java            # Spring MVC CORS mappings
│   │   │
│   │   └── resources/
│   │       └── application.yml                  # Database, JPA, JWT & Server configurations
│   │
│   └── test/java/com/courseenrollment/          # Unit & Mockito Tests
│       ├── auth/AuthServiceTest.java            # 5 Auth unit tests
│       ├── course/CourseServiceTest.java        # 9 Course unit tests
│       └── student/StudentServiceTest.java      # 11 Student unit tests
└── frontend/                                    # React 19 Client SPA
