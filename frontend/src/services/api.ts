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

let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

let onAuthError: (() => void) | null = null;

export function setOnAuthError(callback: (() => void) | null) {
  onAuthError = callback;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 && onAuthError) {
      setAuthToken(null);
      onAuthError();
    }
    const error = await res.json().catch(() => ({
      statusCode: res.status,
      message: res.statusText,
      error: 'Error',
    }));
    throw error;
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text);
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ user: { id: number; name: string; email: string }; token: string }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    ),

  register: (name: string, email: string, password: string) =>
    request<{ user: { id: number; name: string; email: string }; token: string }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ name, email, password }) },
    ),

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
