import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Course } from './course.entity';
import { Student } from '../students/student.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

/** Paginated response wrapper */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,

    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}

  /** Create a new course */
  async create(dto: CreateCourseDto): Promise<Course> {
    const course = this.courseRepo.create(dto);
    return this.courseRepo.save(course);
  }

  /**
   * Retrieve courses with pagination and optional search.
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 50)
   * @param search - Optional search term (matches name or instructor, case-insensitive)
   */
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResult<Course>> {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // Build where conditions for search
    const where = search
      ? [
          { name: Like(`%${search}%`) },
          { instructor: Like(`%${search}%`) },
        ]
      : undefined;

    const [data, total] = await this.courseRepo.findAndCount({
      where,
      relations: { students: true },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  /** Retrieve a single course by ID — throws 404 if not found */
  async findOne(id: number): Promise<Course> {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: { students: true },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  /** Update course details — only provided fields are changed */
  async update(id: number, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOne(id);
    Object.assign(course, dto);
    return this.courseRepo.save(course);
  }

  /** Delete a course and all its enrolled students (cascade) */
  async remove(id: number): Promise<void> {
    const course = await this.findOne(id);
    await this.courseRepo.remove(course);
  }

  /**
   * List all students enrolled in a specific course with pagination.
   * Throws 404 if course not found.
   */
  async findStudentsByCourseId(
    courseId: number,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Student>> {
    await this.findOne(courseId); // Validates course exists

    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    const [data, total] = await this.studentRepo.findAndCount({
      where: { courseId },
      relations: { course: true },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}
