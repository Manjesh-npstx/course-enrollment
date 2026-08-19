import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from '../courses/course.entity';

/**
 * Student entity — represents a student enrolled in a course.
 * Child in a one-to-many relationship with Course.
 */
@Entity()
export class Student {
  @PrimaryGeneratedColumn()
  id: number;

  /** Student's full name */
  @Column()
  name: string;

  /** Student's email — must be unique across all students */
  @Column()
  email: string;

  /** Enrollment date — ISO date string (YYYY-MM-DD) */
  @Column({ type: 'date', nullable: true })
  enrollDate: string;

  /** Foreign key referencing the course this student is enrolled in */
  @Column()
  courseId: number;

  /** The course this student belongs to — cascade deletes student when course is removed */
  @ManyToOne(() => Course, (course) => course.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  /** Auto-set on record creation */
  @CreateDateColumn()
  createdAt: Date;

  /** Auto-set on every update */
  @UpdateDateColumn()
  updatedAt: Date;
}
