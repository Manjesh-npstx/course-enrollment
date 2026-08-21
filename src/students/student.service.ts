import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, DataSource } from 'typeorm';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

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
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * Enroll a new student in a course.
   * Uses a serialized transaction to prevent race conditions where two
   * concurrent requests could both pass the seat check and over-enroll.
   */
  async create(dto: CreateStudentDto): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const course = await manager.findOne(Course, {
        where: { id: dto.courseId },
      });
      if (!course) {
        throw new NotFoundException(
          `Course with ID ${dto.courseId} not found`,
        );
      }

      const currentEnrollment = await manager.count(Student, {
        where: { courseId: dto.courseId },
      });
      if (currentEnrollment >= course.seatLimit) {
        throw new ConflictException(
          'Course is full. Cannot enroll more students.',
        );
      }

      const studentData = {
        ...dto,
        enrollDate: dto.enrollDate || new Date().toISOString().split('T')[0],
      };

      const student = manager.create(Student, studentData);
      return manager.save(Student, student);
    });
  }

  /**
   * Retrieve all students with pagination and optional search.
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 10, max: 50)
   * @param search - Optional search term (matches name or email, case-insensitive)
   */
  async findAll(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<PaginatedResult<Student>> {
    const take = Math.min(limit, 50);
    const skip = (page - 1) * take;

    // Build where conditions for search (escape LIKE wildcards)
    const where = search
      ? (() => {
          const escaped = search.replace(/%/g, '\\%').replace(/_/g, '\\_');
          return [{ name: Like(`%${escaped}%`) }, { email: Like(`%${escaped}%`) }];
        })()
      : undefined;

    const [data, total] = await this.studentRepo.findAndCount({
      where,
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

  /** Retrieve a single student by ID — throws 404 if not found */
  async findOne(id: number): Promise<Student> {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: { course: true },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  /**
   * Update a student's information.
   * If transferring to a new course, uses a serialized transaction to
   * prevent two concurrent transfers from over-enrolling the target course.
   */
  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    return this.dataSource.transaction(async (manager) => {
      const student = await manager.findOne(Student, {
        where: { id },
        relations: { course: true },
      });
      if (!student) {
        throw new NotFoundException(`Student with ID ${id} not found`);
      }

      if (dto.courseId && dto.courseId !== student.courseId) {
        const newCourse = await manager.findOne(Course, {
          where: { id: dto.courseId },
        });
        if (!newCourse) {
          throw new NotFoundException(
            `Course with ID ${dto.courseId} not found`,
          );
        }

        const currentEnrollment = await manager.count(Student, {
          where: { courseId: dto.courseId },
        });
        if (currentEnrollment >= newCourse.seatLimit) {
          throw new ConflictException(
            'Target course is full. Cannot transfer student.',
          );
        }
      }

      Object.assign(student, dto);
      return manager.save(Student, student);
    });
  }

  /** Remove a student (unenroll) — throws 404 if not found */
  async remove(id: number): Promise<void> {
    const student = await this.findOne(id);
    await this.studentRepo.remove(student);
  }

  /** Find all students enrolled in a specific course */
  async findByCourseId(courseId: number): Promise<Student[]> {
    return this.studentRepo.find({
      where: { courseId },
      relations: { course: true },
    });
  }
}
