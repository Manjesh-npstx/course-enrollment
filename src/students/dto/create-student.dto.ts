import { IsString, IsNotEmpty, IsInt, IsEmail, IsOptional, IsDateString, MaxLength } from 'class-validator';

/**
 * DTO for enrolling a new student.
 * Used by POST /students endpoint.
 */
export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEmail()
  email: string;

  /** Optional — defaults to today's date if not provided */
  @IsOptional()
  @IsDateString()
  enrollDate?: string;

  /** Must reference an existing course */
  @IsInt()
  courseId: number;
}
