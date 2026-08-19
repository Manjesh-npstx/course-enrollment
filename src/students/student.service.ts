import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,

    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  /**
   * Enroll a new student in a course.
   * Checks seat availability before enrolling — rejects with 409 if course is full.
   */
  async create(dto: CreateStudentDto): Promise<Student> {
    // Verify the course exists
    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
    }

    // Count current enrollment and enforce seat limit
    const currentEnrollment = await this.studentRepo.count({
      where: { courseId: dto.courseId },
    });
    if (currentEnrollment >= course.seatLimit) {
      throw new ConflictException(
        'Course is full. Cannot enroll more students.',
      );
    }

    // Set enrollment date to today if not provided
    const studentData = {
      ...dto,
      enrollDate: dto.enrollDate || new Date().toISOString().split('T')[0],
    };

    const student = this.studentRepo.create(studentData);
    return this.studentRepo.save(student);
  }

  /** Retrieve all students with their course information */
  async findAll(): Promise<Student[]> {
    return this.studentRepo.find({ relations: { course: true } });
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
   * If transferring to a new course, checks seat availability.
   */
  async update(id: number, dto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);

    // If changing course, verify seat availability in the new course
    if (dto.courseId && dto.courseId !== student.courseId) {
      const newCourse = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });
      if (!newCourse) {
        throw new NotFoundException(`Course with ID ${dto.courseId} not found`);
      }

      const currentEnrollment = await this.studentRepo.count({
        where: { courseId: dto.courseId },
      });
      if (currentEnrollment >= newCourse.seatLimit) {
        throw new ConflictException(
          'Target course is full. Cannot transfer student.',
        );
      }
    }

    Object.assign(student, dto);
    return this.studentRepo.save(student);
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
