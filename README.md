# Course Enrollment API

A robust RESTful API for managing course enrollments built with **Spring Boot 3 (Java 21)**, **Spring Data JPA**, **Hibernate**, and **SQLite**. Includes a modern **React** frontend (Vite, React 19), stateless **JWT authentication** with role-based access control, Swagger OpenAPI documentation, comprehensive unit tests, and full CRUD operations with transactional seat limit enforcement.

## Features

- **Full CRUD operations** for Courses and Students
- **JWT authentication & RBAC** — register/login, role-based route protection (`admin` vs `student`)
- **Default Seeded Admin** — `admin@campus.com` / `admin123`
- **Seat limit enforcement** — transactional check rejects enrollment (HTTP 409) when a course is full
- **Concurrent safety** — prevents race conditions during enrollment and course capacity updates
- **Request validation** using Jakarta Validation (`@NotBlank`, `@Email`, `@Min`, `@Size`)
- **Pagination and search filtering** on course and student lists
- **Parent-Child listing** — `GET /courses/{id}/students` with pagination
- **Structured error responses** (400, 401, 403, 404, 409) matching client contracts
- **Swagger / OpenAPI 3.0 API docs** at `/docs`
- **React 19 frontend** with clean UI, auth management, course/student management, and transfer capabilities
- **Multi-stage Dockerfile** for containerized production deployment

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Java 21 | Programming Language |
| Spring Boot 3.3.4 | Backend framework |
| Spring Data JPA / Hibernate 6 | ORM & data access |
| SQLite | File-based database (`database.sqlite`) |
| Spring Security | Authentication & Authorization |
| JJWT 0.12.6 | JWT token generation and validation |
| SpringDoc OpenAPI 2.6.0 | Interactive Swagger documentation at `/docs` |
| JUnit 5 + Mockito | Automated unit testing |
| React 19 + Vite | Modern frontend SPA |
| TypeScript | Frontend language |

## Project Setup

### Prerequisites

- Java 21+ (Oracle JDK or Eclipse Temurin)
- Maven 3.9+ (or use the included `./mvnw` wrapper)
- Node.js 18+ (for frontend)

### Running the Backend

```bash
# Using Maven wrapper
./mvnw spring-boot:run

# Or package and run jar
./mvnw clean package
java -jar target/course-enrollment-0.0.1-SNAPSHOT.jar
```

The server starts on `http://localhost:3000` by default. Set the `PORT` environment variable to override (e.g. `PORT=8080 ./mvnw spring-boot:run`).

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### Running Tests

```bash
# Run unit tests (JUnit 5 + Mockito)
./mvnw test

# Run End-to-End integration test suite (35 assertions)
bash test-e2e.sh
```

### Docker

```bash
# Build image
docker build -t course-enrollment .

# Run container
docker run -p 3000:3000 course-enrollment
```

## API Endpoints

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | No | Register a new user (`student` or `admin`) |
| `POST` | `/auth/login` | No | Login and receive JWT token |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/courses` | Admin | Create a course |
| `GET` | `/courses` | Public | List courses (paginated) |
| `GET` | `/courses/{id}` | Public | Get a course by ID |
| `PATCH` | `/courses/{id}` | Admin | Update course details / seat limit |
| `DELETE` | `/courses/{id}` | Admin | Delete a course and its students |
| `GET` | `/courses/{id}/students` | Public | List students enrolled in a course |

### Students

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/students` | Admin | Enroll a student in a course |
| `GET` | `/students` | Public | List all students (paginated) |
| `GET` | `/students/{id}` | Public | Get a student by ID |
| `PATCH` | `/students/{id}` | Admin | Update student details / transfer course |
| `DELETE` | `/students/{id}` | Admin | Unenroll a student |

### Interactive API Documentation

Visit **`http://localhost:3000/docs`** to test endpoints via Swagger UI.

## Query Parameters

All `GET` list endpoints (`/courses`, `/students`, `/courses/{id}/students`) support:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | 1-based page number |
| `limit` | `10` | Items per page (max: 50) |
| `search` | — | Substring filter (courses: name/instructor; students: name/email) |

**Example:** `GET /courses?search=math&page=1&limit=5`

### Paginated Response Format

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

## Examples (curl)

All write endpoints require an admin JWT token. Obtain one by logging in:

```bash
# Login as admin
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@campus.com","password":"admin123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Or register a new student account
TOKEN=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"pass123"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
```

### Create a Course (Admin)

```bash
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Math 101","instructor":"Dr. Smith","seatLimit":30}'
```

### Enroll a Student (Admin)

```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"John Doe","email":"john@example.com","courseId":1}'
```

### Seat Limit Enforcement Edge Case

```bash
# 1. Create a course with 2 seats
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Physics 101","instructor":"Dr. Jones","seatLimit":2}'

# 2. Enroll 2 students (both succeed)
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Alice","email":"alice@test.com","courseId":1}'

curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Bob","email":"bob@test.com","courseId":1}'

# 3. Third enrollment fails with 409 Conflict
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Charlie","email":"charlie@test.com","courseId":1}'
# Response: {"statusCode":409,"message":"Course is full. Cannot enroll more students.","error":"Conflict"}
```

## Error Responses

| Status | Meaning | Example Response |
|--------|---------|------------------|
| `400` | Bad Request / Validation Failure | `{"statusCode":400,"message":["email must be an email"],"error":"Bad Request"}` |
| `401` | Unauthorized | `{"statusCode":401,"message":"Invalid credentials","error":"Unauthorized"}` |
| `403` | Forbidden | `{"statusCode":403,"message":"Admin access required","error":"Forbidden"}` |
| `404` | Entity Not Found | `{"statusCode":404,"message":"Course with ID 999 not found","error":"Not Found"}` |
| `409` | Conflict | `{"statusCode":409,"message":"Course is full. Cannot enroll more students.","error":"Conflict"}` |
| `500` | Internal Server Error | `{"statusCode":500,"message":"Internal server error","error":"Internal Server Error"}` |

## Project Structure

```
course-enrollment/
├── pom.xml                                      # Maven dependencies & build config
├── mvnw / mvnw.cmd / .mvn/                      # Maven Wrapper
├── Dockerfile                                   # Multi-stage production container
├── test-e2e.sh                                  # 35-assertion automated E2E test script
├── database.sqlite                              # SQLite database file
├── src/
│   ├── main/
│   │   ├── java/com/courseenrollment/
│   │   │   ├── CourseEnrollmentApplication.java # Application entrypoint
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java          # Stateless JWT security filter chain
│   │   │   │   ├── JwtAuthFilter.java           # Bearer token validation filter
│   │   │   │   ├── JwtService.java              # JJWT cryptographic token service
│   │   │   │   ├── WebMvcConfig.java            # Global CORS configuration
│   │   │   │   ├── OpenApiConfig.java           # Swagger / OpenAPI 3.0 configuration
│   │   │   │   └── DataInitializer.java         # Initial seed for admin account
│   │   │   ├── common/
│   │   │   │   ├── dto/
│   │   │   │   │   ├── PageMeta.java            # Pagination metadata
│   │   │   │   │   ├── PaginatedResponse.java   # Generic paginated wrapper
│   │   │   │   │   └── ApiErrorResponse.java    # Standard error response body
│   │   │   │   └── exception/
│   │   │   │       ├── BadRequestException.java
│   │   │   │       ├── ConflictException.java
│   │   │   │       ├── ResourceNotFoundException.java
│   │   │   │       └── GlobalExceptionHandler.java
│   │   │   ├── auth/
│   │   │   │   ├── entity/User.java             # User JPA entity
│   │   │   │   ├── enums/UserRole.java          # Admin / Student enum
│   │   │   │   ├── repository/UserRepository.java
│   │   │   │   ├── dto/                         # RegisterRequest, LoginRequest, AuthResponse, UserDto
│   │   │   │   ├── service/AuthService.java
│   │   │   │   └── controller/AuthController.java
│   │   │   ├── course/
│   │   │   │   ├── entity/Course.java           # Course JPA entity (1-to-many with Student)
│   │   │   │   ├── repository/CourseRepository.java
│   │   │   │   ├── dto/                         # CreateCourseRequest, UpdateCourseRequest
│   │   │   │   ├── service/CourseService.java   # Course logic, capacity checks, cascade
│   │   │   │   └── controller/CourseController.java
│   │   │   └── student/
│   │   │       ├── entity/Student.java          # Student JPA entity (many-to-1 with Course)
│   │   │       ├── repository/StudentRepository.java
│   │   │       ├── dto/                         # CreateStudentRequest, UpdateStudentRequest
│   │   │       ├── service/StudentService.java  # Enrollment, transfer, seat limits
│   │   │       └── controller/StudentController.java
│   │   └── resources/
│   │       └── application.yml                  # Port 3000, SQLite dialect, JPA, Swagger paths
│   └── test/
│       └── java/com/courseenrollment/
│           ├── auth/AuthServiceTest.java        # Unit tests for authentication
│           ├── course/CourseServiceTest.java    # Unit tests for course operations
│           └── student/StudentServiceTest.java  # Unit tests for student enrollment & seat limit
└── frontend/                                    # React 19 + TypeScript + Vite SPA
```

## License

MIT
