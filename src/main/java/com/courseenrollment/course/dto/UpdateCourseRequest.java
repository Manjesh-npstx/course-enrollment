package com.courseenrollment.course.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public class UpdateCourseRequest {

    @Schema(example = "React Fundamentals")
    @Size(max = 255, message = "name must be shorter than or equal to 255 characters")
    private String name;

    @Schema(example = "Jane Smith")
    @Size(max = 255, message = "instructor must be shorter than or equal to 255 characters")
    private String instructor;

    @Schema(example = "40", minimum = "1")
    @Min(value = 1, message = "seatLimit must not be less than 1")
    private Integer seatLimit;

    public UpdateCourseRequest() {
    }

    public UpdateCourseRequest(String name, String instructor, Integer seatLimit) {
        this.name = name;
        this.instructor = instructor;
        this.seatLimit = seatLimit;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public Integer getSeatLimit() {
        return seatLimit;
    }

    public void setSeatLimit(Integer seatLimit) {
        this.seatLimit = seatLimit;
    }
}
