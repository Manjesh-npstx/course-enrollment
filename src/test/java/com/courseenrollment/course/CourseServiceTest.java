package com.courseenrollment.course;

import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.common.exception.ResourceNotFoundException;
import com.courseenrollment.course.dto.CreateCourseRequest;
import com.courseenrollment.course.dto.UpdateCourseRequest;
import com.courseenrollment.course.entity.Course;
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

import java.util.Collections;
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
    }

    @Test
    @DisplayName("create should save and return course")
    void create_success() {
        CreateCourseRequest req = new CreateCourseRequest("React 101", "Jane Smith", 5);
        when(courseRepository.save(any(Course.class))).thenReturn(mockCourse);

        Course created = courseService.create(req);

        assertThat(created).isNotNull();
        assertThat(created.getName()).isEqualTo("React 101");
        assertThat(created.getSeatLimit()).isEqualTo(5);
        verify(courseRepository).save(any(Course.class));
    }

    @Test
    @DisplayName("findAll should return paginated courses")
    void findAll_success() {
        Page<Course> page = new PageImpl<>(List.of(mockCourse));
        when(courseRepository.findAll(any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.findAll(1, 10, null);

        assertThat(result).isNotNull();
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getMeta().getTotal()).isEqualTo(1);
        assertThat(result.getMeta().getPage()).isEqualTo(1);
    }

    @Test
    @DisplayName("findAll with search term should query searchCourses")
    void findAll_withSearch() {
        Page<Course> page = new PageImpl<>(List.of(mockCourse));
        when(courseRepository.searchCourses(eq("React"), any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Course> result = courseService.findAll(1, 10, "React");

        assertThat(result.getData()).hasSize(1);
        verify(courseRepository).searchCourses(eq("React"), any(Pageable.class));
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
