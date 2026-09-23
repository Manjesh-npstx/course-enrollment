package com.courseenrollment.course.controller;

import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.course.dto.CreateCourseRequest;
import com.courseenrollment.course.dto.UpdateCourseRequest;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.service.CourseService;
import com.courseenrollment.student.entity.Student;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Courses")
@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Create a new course")
    public ResponseEntity<Course> create(@Valid @RequestBody CreateCourseRequest req) {
        Course course = courseService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(course);
    }

    @GetMapping
    @Operation(summary = "List all courses (paginated)")
    public ResponseEntity<PaginatedResponse<Course>> findAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search
    ) {
        PaginatedResponse<Course> response = courseService.findAll(page, limit, search);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a course by ID")
    public ResponseEntity<Course> findOne(@PathVariable Long id) {
        Course course = courseService.findOne(id);
        return ResponseEntity.ok(course);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update a course")
    public ResponseEntity<Course> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest req
    ) {
        Course course = courseService.update(id, req);
        return ResponseEntity.ok(course);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Delete a course")
    public ResponseEntity<Void> remove(@PathVariable Long id) {
        courseService.remove(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/students")
    @Operation(summary = "List students enrolled in a course")
    public ResponseEntity<PaginatedResponse<Student>> findStudents(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        PaginatedResponse<Student> response = courseService.findStudentsByCourseId(id, page, limit);
        return ResponseEntity.ok(response);
    }
}
