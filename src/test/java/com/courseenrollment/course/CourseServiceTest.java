package com.courseenrollment.course;

import com.courseenrollment.auth.enums.UserRole;
import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.common.exception.ResourceNotFoundException;
import com.courseenrollment.course.dto.CreateCourseRequest;
import com.courseenrollment.course.dto.UpdateCourseRequest;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.enums.CourseStatus;
import com.courseenrollment.course.repository.CourseRepository;
import com.courseenrollment.course.service.CourseService;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private CourseService courseService;

    private Course mockCourse;

    @BeforeEach
    void setUp() {
        mockCourse = new Course("React 101", "Jane Smith", 5);
        mockCourse.setId(1L);
        mockCourse.setStatus(CourseStatus.APPROVED);
    }

    @Test
    @DisplayName("create by admin should save and return course with APPROVED status")
    void create_success() {
        CreateCourseRequest req = new CreateCourseRequest("React 101", "Jane Smith", 5);
        when(courseRepository.save(any(Course.class))).thenReturn(mockCourse);

        Course created = courseService.create(req);

        assertThat(created).isNotNull();
        assertThat(created.getName()).isEqualTo("React 101");
        assertThat(created.getSeatLimit()).isEqualTo(5);
        assertThat(created.getStatus()).isEqualTo(CourseStatus.APPROVED);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    @DisplayName("create by instructor should save course with PENDING status")
    void create_instructor_creates_pending_course() {
        CreateCourseRequest req = new CreateCourseRequest("NodeJS 101", null, 20);
        Course pendingCourse = new Course("NodeJS 101", "instructor@test.com", 20, CourseStatus.PENDING, "instructor@test.com");
        when(courseRepository.save(any(Course.class))).thenReturn(pendingCourse);

        Course created = courseService.create(req, "instructor@test.com", UserRole.INSTRUCTOR);

        assertThat(created).isNotNull();
        assertThat(created.getStatus()).isEqualTo(CourseStatus.PENDING);
        assertThat(created.getInstructorEmail()).isEqualTo("instructor@test.com");
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    @DisplayName("approve should set status to APPROVED")
    void approve_course_success() {
        Course pendingCourse = new Course("NodeJS 101", "instructor@test.com", 20, CourseStatus.PENDING, "instructor@test.com");
        pendingCourse.setId(2L);
        when(courseRepository.findById(2L)).thenReturn(Optional.of(pendingCourse));
        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> inv.getArgument(0));

        Course approved = courseService.approve(2L);

        assertThat(approved.getStatus()).isEqualTo(CourseStatus.APPROVED);
        verify(courseRepository).save(pendingCourse);
    }

    @Test
    @DisplayName("reject should set status to REJECTED")
    void reject_course_success() {
        Course pendingCourse = new Course("NodeJS 101", "instructor@test.com", 20, CourseStatus.PENDING, "instructor@test.com");
        pendingCourse.setId(2L);
        when(courseRepository.findById(2L)).thenReturn(Optional.of(pendingCourse));
        when(courseRepository.save(any(Course.class))).thenAnswer(inv -> inv.getArgument(0));

        Course rejected = courseService.reject(2L);

        assertThat(rejected.getStatus()).isEqualTo(CourseStatus.REJECTED);
        verify(courseRepository).save(pendingCourse);
    }

    @Test
    @DisplayName("findAll should return approved paginated courses for public/student")
    void findAll_success() {
        Page<Course> page = new PageImpl<>(List.of(mockCourse));
        when(courseRepository.findByStatus(eq(CourseStatus.APPROVED), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.findAll(1, 10, null);

        assertThat(result).isNotNull();
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getMeta().getTotal()).isEqualTo(1);
        assertThat(result.getMeta().getPage()).isEqualTo(1);
    }

    @Test
    @DisplayName("findAll with search term should query searchCoursesByStatus for approved courses")
    void findAll_withSearch() {
        Page<Course> page = new PageImpl<>(List.of(mockCourse));
        when(courseRepository.searchCoursesByStatus(eq("React"), eq(CourseStatus.APPROVED), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.findAll(1, 10, "React");

        assertThat(result.getData()).hasSize(1);
        verify(courseRepository).searchCoursesByStatus(eq("React"), eq(CourseStatus.APPROVED), any(Pageable.class));
    }

    @Test
    @DisplayName("findAll by admin with status pending should query pending courses")
    void findAll_admin_pending() {
        Course pending = new Course("Draft", "Inst", 10, CourseStatus.PENDING, "inst@test.com");
        Page<Course> page = new PageImpl<>(List.of(pending));
        when(courseRepository.findByStatus(eq(CourseStatus.PENDING), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.findAll(1, 10, null, "pending", "admin@test.com", "ROLE_ADMIN");

        assertThat(result.getData()).hasSize(1);
        verify(courseRepository).findByStatus(eq(CourseStatus.PENDING), any(Pageable.class));
    }

    @Test
    @DisplayName("getMyCourses for student returns enrolled courses")
    void getMyCourses_student() {
        Page<Course> page = new PageImpl<>(List.of(mockCourse));
        when(studentRepository.findEnrolledCoursesByEmail(eq("student@test.com"), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.getMyCourses("student@test.com", "ROLE_STUDENT", 1, 10);

        assertThat(result.getData()).hasSize(1);
        verify(studentRepository).findEnrolledCoursesByEmail(eq("student@test.com"), any(Pageable.class));
    }

    @Test
    @DisplayName("getMyCourses for instructor returns courses taught by instructor")
    void getMyCourses_instructor() {
        Course instCourse = new Course("My Course", "Prof", 10, CourseStatus.PENDING, "prof@test.com");
        Page<Course> page = new PageImpl<>(List.of(instCourse));
        when(courseRepository.findByInstructorEmail(eq("prof@test.com"), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.getMyCourses("prof@test.com", "ROLE_INSTRUCTOR", 1, 10);

        assertThat(result.getData()).hasSize(1);
        verify(courseRepository).findByInstructorEmail(eq("prof@test.com"), any(Pageable.class));
    }

    @Test
    @DisplayName("findOne should return course by ID")
    void findOne_success() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));

        Course found = courseService.findOne(1L);

        assertThat(found).isNotNull();
        assertThat(found.getName()).isEqualTo("React 101");
    }

    @Test
    @DisplayName("findOne should throw ResourceNotFoundException when course not found")
    void findOne_notFound() {
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.findOne(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Course with ID 999 not found");
    }

    @Test
    @DisplayName("update should modify course fields")
    void update_success() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));
        when(courseRepository.save(any(Course.class))).thenReturn(mockCourse);

        UpdateCourseRequest req = new UpdateCourseRequest("React Fundamentals", null, null);
        Course updated = courseService.update(1L, req);

        assertThat(updated.getName()).isEqualTo("React Fundamentals");
        verify(courseRepository).save(mockCourse);
    }

    @Test
    @DisplayName("update should throw ConflictException if reducing seatLimit below enrollment count")
    void update_seatLimitConflict() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));
        when(studentRepository.countByCourseId(1L)).thenReturn(3L);

        UpdateCourseRequest req = new UpdateCourseRequest(null, null, 2);

        assertThatThrownBy(() -> courseService.update(1L, req))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Cannot reduce seat limit to 2");

        verify(courseRepository, never()).save(any(Course.class));
    }

    @Test
    @DisplayName("remove should delete course")
    void remove_success() {
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));

        courseService.remove(1L);

        verify(courseRepository).delete(mockCourse);
    }

    @Test
    @DisplayName("findStudentsByCourseId should return paginated students")
    void findStudentsByCourseId_success() {
        Student student = new Student("Alice", "alice@test.com", "2026-01-01", mockCourse);
        student.setId(1L);
        Page<Student> page = new PageImpl<>(List.of(student));

        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));
        when(studentRepository.findByCourseId(eq(1L), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Student> result = courseService.findStudentsByCourseId(1L, 1, 10);

        assertThat(result.getData()).hasSize(1);
        assertThat(result.getData().get(0).getName()).isEqualTo("Alice");
    }
}
