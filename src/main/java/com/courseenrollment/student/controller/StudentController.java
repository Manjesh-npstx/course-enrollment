package com.courseenrollment.student.controller;

import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.student.dto.CreateStudentRequest;
import com.courseenrollment.student.dto.UpdateStudentRequest;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Students")
@RestController
@RequestMapping("/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Enroll a student in a course")
    public ResponseEntity<Student> create(@Valid @RequestBody CreateStudentRequest req) {
        Student student = studentService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(student);
    }

    @GetMapping
    @Operation(summary = "List all students (paginated)")
    public ResponseEntity<PaginatedResponse<Student>> findAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search
    ) {
        PaginatedResponse<Student> response = studentService.findAll(page, limit, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a student by ID")
    public ResponseEntity<Student> findOne(@PathVariable Long id) {
        Student student = studentService.findOne(id);
        return ResponseEntity.ok(student);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update a student")
    public ResponseEntity<Student> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStudentRequest req
    ) {
        Student student = studentService.update(id, req);
        return ResponseEntity.ok(student);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Unenroll a student")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        studentService.remove(id);
        return ResponseEntity.ok().build();
    }
}
