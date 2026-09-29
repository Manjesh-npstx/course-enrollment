package com.courseenrollment.course.controller;

import com.courseenrollment.auth.enums.UserRole;
import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.course.dto.CreateCourseRequest;
import com.courseenrollment.course.dto.UpdateCourseRequest;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.enums.CourseStatus;
import com.courseenrollment.course.service.CourseService;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.service.StudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Courses")
@RestController
@RequestMapping("/courses")
public class CourseController {

    private final CourseService courseService;
    private final StudentService studentService;

    public CourseController(CourseService courseService, StudentService studentService) {
        this.courseService = courseService;
        this.studentService = studentService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Create a new course (Instructor creates PENDING course; Admin creates APPROVED course)")
    public ResponseEntity<Course> create(
            @Valid @RequestBody CreateCourseRequest req,
            Authentication auth
    ) {
        String email = auth != null ? auth.getName() : null;
        UserRole role = determineUserRole(auth);
        Course course = courseService.create(req, email, role);
        return ResponseEntity.status(HttpStatus.CREATED).body(course);
    }

    @GetMapping
    @Operation(summary = "List courses (Students/Public see APPROVED courses; Admin sees all or filters by status; Instructor sees approved + own pending)")
    public ResponseEntity<PaginatedResponse<Course>> findAll(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            Authentication auth
    ) {
        String email = auth != null ? auth.getName() : null;
        String roleStr = getPrimaryAuthority(auth);
        PaginatedResponse<Course> response = courseService.findAll(page, limit, search, status, email, roleStr);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-courses")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Get courses relevant to the authenticated user (Enrolled courses for student; Created courses for instructor; All for admin)")
    public ResponseEntity<PaginatedResponse<Course>> getMyCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            Authentication auth
    ) {
        String email = auth != null ? auth.getName() : "";
        String roleStr = getPrimaryAuthority(auth);
        PaginatedResponse<Course> response = courseService.getMyCourses(email, roleStr, page, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/enrolled")
    @PreAuthorize("isAuthenticated()")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Alias for /my-courses for student enrolled courses")
    public ResponseEntity<PaginatedResponse<Course>> getEnrolledCourses(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int limit,
            Authentication auth
    ) {
        return getMyCourses(page, limit, auth);
    }

    @PostMapping("/{id}/enroll")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Enroll currently authenticated student in an approved course")
    public ResponseEntity<Student> enrollInCourse(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            Authentication auth
    ) {
        String email = auth != null ? auth.getName() : null;
        String name = (body != null && body.containsKey("name")) ? body.get("name") : email;
        Student student = studentService.enrollSelf(id, email, name);
        return ResponseEntity.status(HttpStatus.CREATED).body(student);
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Approve a course (Admin only)")
    public ResponseEntity<Course> approveCourse(@PathVariable Long id) {
        Course course = courseService.approve(id);
        return ResponseEntity.ok(course);
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Reject a course (Admin only)")
    public ResponseEntity<Course> rejectCourse(@PathVariable Long id) {
        Course course = courseService.reject(id);
        return ResponseEntity.ok(course);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update course status directly (Admin only)")
    public ResponseEntity<Course> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String statusStr = body.get("status");
        Course course = courseService.updateStatus(id, CourseStatus.fromValue(statusStr));
        return ResponseEntity.ok(course);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a course by ID")
    public ResponseEntity<Course> findOne(@PathVariable Long id) {
        Course course = courseService.findOne(id);
        return ResponseEntity.ok(course);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'INSTRUCTOR')")
    @SecurityRequirement(name = "BearerAuth")
    @Operation(summary = "Update a course (Admin or course instructor)")
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

    private UserRole determineUserRole(Authentication auth) {
        if (auth == null) {
            return UserRole.STUDENT;
        }
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if ("ROLE_ADMIN".equalsIgnoreCase(ga.getAuthority())) {
                return UserRole.ADMIN;
            }
            if ("ROLE_INSTRUCTOR".equalsIgnoreCase(ga.getAuthority())) {
                return UserRole.INSTRUCTOR;
            }
        }
        return UserRole.STUDENT;
    }

    private String getPrimaryAuthority(Authentication auth) {
        if (auth == null || auth.getAuthorities() == null) {
            return null;
        }
        for (GrantedAuthority ga : auth.getAuthorities()) {
            if (ga.getAuthority().startsWith("ROLE_")) {
                return ga.getAuthority();
            }
        }
        return null;
    }
}
