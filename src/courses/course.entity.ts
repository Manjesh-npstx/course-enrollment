import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Student } from '../students/student.entity';

/**
 * Course entity — represents a course that students can enroll in.
 * Parent in a one-to-many relationship with Student.
 */
@Entity()
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  /** Course name, e.g. "Advanced Mathematics" */
  @Column()
  name: string;

  /** Instructor's name, e.g. "Dr. Smith" */
  @Column()
  instructor: string;

  /** Maximum number of students allowed in this course */
  @Column()
  seatLimit: number;

  /** All students enrolled in this course — cascade deletes students when course is removed */
  @OneToMany(() => Student, (student) => student.course, { cascade: true })
  students: Student[];

  /** Auto-set on record creation */
  @CreateDateColumn()
  createdAt: Date;

  /** Auto-set on every update */
  @UpdateDateColumn()
  updatedAt: Date;
}
