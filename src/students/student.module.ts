import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';
import { StudentService } from './student.service';
import { StudentController } from './student.controller';

/**
 * Student module — manages student enrollment and CRUD operations.
 * Imports Course entity for seat limit validation.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Student, Course])],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [StudentService],
})
export class StudentModule {}
