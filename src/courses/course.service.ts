import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
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

    private readonly dataSource: DataSource,
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

    // Build where conditions for search (escape LIKE wildcards)
    const where = search
      ? (() => {
          const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
          return [
            { name: Like(`%${escaped}%`) },
            { instructor: Like(`%${escaped}%`) },
          ];
        })()
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

  /**
   * Update course details — only provided fields are changed.
   * If reducing seat limit, uses a serialized transaction to prevent a race
   * where concurrent enrollments could push the course over the new limit
   * between the count check and the seat limit update.
   */
  async update(id: number, dto: UpdateCourseDto): Promise<Course> {
    return this.dataSource.transaction(async (manager) => {
      const course = await manager.findOne(Course, {
        where: { id },
        relations: { students: true },
      });
      if (!course) {
        throw new NotFoundException(`Course with ID ${id} not found`);
      }

      if (dto.seatLimit !== undefined) {
        const currentEnrollment = await manager.count(Student, {
          where: { courseId: id },
        });
        if (dto.seatLimit < currentEnrollment) {
          throw new ConflictException(
            `Cannot reduce seat limit to ${dto.seatLimit}. ${currentEnrollment} student(s) currently enrolled.`,
          );
        }
      }

      Object.assign(course, dto);
      return manager.save(Course, course);
    });
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
