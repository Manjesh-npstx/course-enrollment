export interface Course {
  id: number;
  name: string;
  instructor: string;
  seatLimit: number;
  students?: Student[];
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: number;
  name: string;
  email: string;
  enrollDate: string;
  courseId: number;
  course?: Course;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCourseDto {
  name: string;
  instructor: string;
  seatLimit: number;
}

export interface UpdateCourseDto {
  name?: string;
  instructor?: string;
  seatLimit?: number;
}

export interface CreateStudentDto {
  name: string;
  email: string;
  enrollDate?: string;
  courseId: number;
}

export interface UpdateStudentDto {
  name?: string;
  email?: string;
  enrollDate?: string;
  courseId?: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}
