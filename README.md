# Course Enrollment API

A RESTful API for managing course enrollments built with **NestJS**, **TypeORM**, and **SQLite**. Includes a **React** frontend with professional UI, JWT authentication, and full CRUD operations.

## Features

- Full CRUD operations for Courses and Students
- **JWT authentication** — register/login, token-based route protection
- **Seat limit enforcement** — rejects enrollment when a course is full
- Request validation on all endpoints
- Pagination and search filtering
- Structured error responses (400, 401, 404, 409)
- One-to-many relationship between Courses and Students
- React frontend with auth, course management, student management
- **Swagger API docs** at `/docs`

## Tech Stack

| Technology | Purpose |
|------------|---------|
| NestJS | Backend framework |
| TypeORM | ORM for database operations |
| SQLite | File-based database |
| class-validator | Request validation |
| Passport + JWT | Authentication |
| bcryptjs | Password hashing |
| React 19 | Frontend |
| Vite | Frontend bundler |
| React Router | Client-side routing |
| TypeScript | Language |

## Project Setup

```bash
# Install dependencies
npm install

# Start development server (backend)
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Frontend
cd frontend
npm install
npm run dev    # http://localhost:5173
```

Server runs on `http://localhost:3000` by default. Set `PORT` env variable to change.

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
| `POST` | `/auth/register` | No | Register a new user |
| `POST` | `/auth/login` | No | Login and receive JWT token |

### Courses

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/courses` | Yes | Create a course |
| `GET` | `/courses` | No | List courses (paginated) |
| `GET` | `/courses/:id` | No | Get a course |
| `PATCH` | `/courses/:id` | Yes | Update a course |
| `DELETE` | `/courses/:id` | Yes | Delete a course |
| `GET` | `/courses/:id/students` | No | List students in a course |

### Students

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/students` | Yes | Enroll a student |
| `GET` | `/students` | No | List students (paginated) |
| `GET` | `/students/:id` | No | Get a student |
| `PATCH` | `/students/:id` | Yes | Update a student |
| `DELETE` | `/students/:id` | Yes | Unenroll a student |

**Auth:** Send `Authorization: Bearer <token>` header for protected endpoints.

## Query Parameters

All `GET` list endpoints support:

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page (max: 50) |
| `search` | — | Filter by name/instructor/email |

**Example:** `GET /courses?search=math&page=1&limit=5`

### Response Format

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

### Create a course

```bash
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Math 101","instructor":"Dr. Smith","seatLimit":30}'
```

### Enroll a student

```bash
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","courseId":1}'
```

### Test seat limit (set seatLimit to 2, enroll 3 students)

```bash
# Create course with 2 seats
curl -X POST http://localhost:3000/courses \
  -H "Content-Type: application/json" \
  -d '{"name":"Physics","instructor":"Dr. Jones","seatLimit":2}'

# Enroll 2 students (both succeed)
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@test.com","courseId":1}'

curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@test.com","courseId":1}'

# Third enrollment FAILS with 409 Conflict
curl -X POST http://localhost:3000/students \
  -H "Content-Type: application/json" \
  -d '{"name":"Charlie","email":"charlie@test.com","courseId":1}'
# Response: {"message":"Course is full. Cannot enroll more students.","error":"Conflict","statusCode":409}
```

### Pagination

```bash
# Get page 2 with 5 items per page
curl "http://localhost:3000/courses?page=2&limit=5"
```

### Search

```bash
# Search courses by name or instructor
curl "http://localhost:3000/courses?search=Smith"

# Search students by name or email
curl "http://localhost:3000/students?search=alice"
```

## Error Responses

| Status | Meaning | Example |
|--------|---------|---------|
| `400` | Validation failure | Missing required field, invalid email |
| `401` | Unauthorized | Missing or invalid JWT token |
| `404` | Entity not found | Course/Student ID doesn't exist |
| `409` | Business rule violation | Course is full |
| `500` | Server error | Unexpected failure |

## Validation Rules

### Course

| Field | Rules |
|-------|-------|
| `name` | Required, string, max 255 chars |
| `instructor` | Required, string, max 255 chars |
| `seatLimit` | Required, integer, minimum 1 |

### Student

| Field | Rules |
|-------|-------|
| `name` | Required, string, max 255 chars |
| `email` | Required, valid email format |
| `enrollDate` | Optional, ISO date (defaults to today) |
| `courseId` | Required, must reference existing course |

## Project Structure

```
src/
├── auth/
│   ├── dto/
│   │   └── auth.dto.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   ├── user.entity.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── auth.constants.ts
│   └── jwt-auth.guard.ts
├── courses/
│   ├── dto/
│   │   ├── create-course.dto.ts
│   │   └── update-course.dto.ts
│   ├── course.entity.ts
│   ├── course.controller.ts
│   ├── course.service.ts
│   └── course.module.ts
├── students/
│   ├── dto/
│   │   ├── create-student.dto.ts
│   │   └── update-student.dto.ts
│   ├── student.entity.ts
│   ├── student.controller.ts
│   ├── student.service.ts
│   └── student.module.ts
├── app.module.ts
└── main.ts
frontend/
├── src/
│   ├── components/
│   │   ├── Layout/
│   │   ├── Course/
│   │   └── Student/
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── CoursesPage.tsx
│   │   ├── CourseDetailPage.tsx
│   │   └── StudentsPage.tsx
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── App.css
```

## License

MIT
