import { IsString, IsNotEmpty, IsInt, IsEmail, IsOptional, IsDateString, MaxLength } from 'class-validator';

/**
 * DTO for updating an existing student.
 * All fields are optional — only provided fields will be updated.
 * Used by PATCH /students/:id endpoint.
 */
export class UpdateStudentDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  enrollDate?: string;

  @IsOptional()
  @IsInt()
  courseId?: number;
}
