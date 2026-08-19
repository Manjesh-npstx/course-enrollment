import { IsString, IsNotEmpty, IsInt, Min, MaxLength, IsOptional } from 'class-validator';

/**
 * DTO for updating an existing course.
 * All fields are optional — only provided fields will be updated.
 * Used by PATCH /courses/:id endpoint.
 */
export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  instructor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  seatLimit?: number;
}
