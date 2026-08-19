import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { Student } from '../students/student.entity';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';

/**
 * Course module — manages course CRUD and student listing per course.
 * Imports Student entity for the findStudentsByCourseId operation.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Course, Student])],
  controllers: [CourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule {}
