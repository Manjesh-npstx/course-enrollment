package com.courseenrollment.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @Schema(example = "John Doe")
    @NotBlank(message = "name should not be empty")
    @Size(max = 255, message = "name must be shorter than or equal to 255 characters")
    private String name;

    @Schema(example = "john@example.com")
    @NotBlank(message = "email should not be empty")
    @Email(message = "email must be an email")
    private String email;

    @Schema(example = "password123", minLength = 6)
    @NotBlank(message = "password should not be empty")
    @Size(min = 6, message = "password must be longer than or equal to 6 characters")
    private String password;

    @Schema(example = "student")
    private String role;

    public RegisterRequest() {
    }

    public RegisterRequest(String name, String email, String password) {
        this.name = name;
        this.email = email;
        this.password = password;
    }

    public RegisterRequest(String name, String email, String password, String role) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
