package com.courseenrollment.student.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateStudentRequest {

    @Schema(example = "Alice Updated")
    @Size(max = 255, message = "name must be shorter than or equal to 255 characters")
    private String name;

    @Schema(example = "alice-new@example.com")
    @Email(message = "email must be an email")
    private String email;

    @Schema(example = "2026-02-01")
    private String enrollDate;

    @Schema(example = "2")
    private Long courseId;

    public UpdateStudentRequest() {
    }

    public UpdateStudentRequest(String name, String email, String enrollDate, Long courseId) {
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
