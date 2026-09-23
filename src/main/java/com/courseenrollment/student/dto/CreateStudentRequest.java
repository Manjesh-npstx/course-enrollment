package com.courseenrollment.student.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateStudentRequest {

    @Schema(example = "Alice Johnson")
    @NotBlank(message = "name should not be empty")
    @Size(max = 255, message = "name must be shorter than or equal to 255 characters")
    private String name;

    @Schema(example = "alice@example.com")
    @NotBlank(message = "email should not be empty")
    @Email(message = "email must be an email")
    private String email;

    @Schema(example = "2026-01-15")
    private String enrollDate;

    @Schema(example = "1")
    @NotNull(message = "courseId should not be empty")
    private Long courseId;

    public CreateStudentRequest() {
    }

    public CreateStudentRequest(String name, String email, String enrollDate, Long courseId) {
        this.name = name;
        this.email = email;
        this.enrollDate = enrollDate;
        this.courseId = courseId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getEnrollDate() {
        return enrollDate;
    }

    public void setEnrollDate(String enrollDate) {
        this.enrollDate = enrollDate;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }
}
