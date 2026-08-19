import { IsString, IsNotEmpty, IsInt, Min, MaxLength } from 'class-validator';

/**
 * DTO for creating a new course.
 * Used by POST /courses endpoint.
 */
export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  instructor: string;

  @IsInt()
  @Min(1)
  seatLimit: number;
}
