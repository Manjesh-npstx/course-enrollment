import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  /** POST /courses — Create a new course */
  @Post()
  create(@Body() dto: CreateCourseDto) {
    return this.courseService.create(dto);
  }

  /** GET /courses — List all courses */
  @Get()
  findAll() {
    return this.courseService.findAll();
  }

  /** GET /courses/:id — Get a single course with enrolled students */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findOne(id);
  }

  /** PATCH /courses/:id — Update course details */
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCourseDto) {
    return this.courseService.update(id, dto);
  }

  /** DELETE /courses/:id — Delete a course (cascades to students) */
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.remove(id);
  }

  /** GET /courses/:id/students — List all students in a course */
  @Get(':id/students')
  findStudents(@Param('id', ParseIntPipe) id: number) {
    return this.courseService.findStudentsByCourseId(id);
  }
}
