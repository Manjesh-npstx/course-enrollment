import type {
  Course,
  Student,
  PaginatedResponse,
  CreateCourseDto,
  UpdateCourseDto,
  CreateStudentDto,
  UpdateStudentDto,
} from '../types';

const BASE = 'http://localhost:3000';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: 'Error',
    }));
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Courses
  getCourses: (page = 1, limit = 10, search = '') =>
    request<PaginatedResponse<Course>>(
      `/courses?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),

  getCourse: (id: number) =>
    request<Course>(`/courses/${id}`),

  createCourse: (data: CreateCourseDto) =>
    request<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourse: (id: number, data: UpdateCourseDto) =>
    request<Course>(`/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCourse: (id: number) =>
    request<void>(`/courses/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (page = 1, limit = 10, search = '') =>
    request<PaginatedResponse<Student>>(
      `/students?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),

  getStudent: (id: number) =>
    request<Student>(`/students/${id}`),

  getCourseStudents: (courseId: number, page = 1, limit = 10) =>
    request<PaginatedResponse<Student>>(
      `/courses/${courseId}/students?page=${page}&limit=${limit}`,
    ),

  enrollStudent: (data: CreateStudentDto) =>
    request<Student>('/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStudent: (id: number, data: UpdateStudentDto) =>
    request<Student>(`/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteStudent: (id: number) =>
    request<void>(`/students/${id}`, { method: 'DELETE' }),
};
