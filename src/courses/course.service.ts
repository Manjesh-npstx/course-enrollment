import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { Student } from '../students/student.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

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

  /** Retrieve all courses with their enrolled students */
  async findAll(): Promise<Course[]> {
    return this.courseRepo.find({ relations: { students: true } });
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

  /** List all students enrolled in a specific course — throws 404 if course not found */
  async findStudentsByCourseId(courseId: number): Promise<Student[]> {
    await this.findOne(courseId); // Validates course exists
    return this.studentRepo.find({
      where: { courseId },
      relations: { course: true },
    });
  }
}
