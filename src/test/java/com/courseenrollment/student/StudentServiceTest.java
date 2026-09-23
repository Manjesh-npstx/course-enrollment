package com.courseenrollment.student;

import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.common.exception.ResourceNotFoundException;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.repository.CourseRepository;
import com.courseenrollment.student.dto.CreateStudentRequest;
import com.courseenrollment.student.dto.UpdateStudentRequest;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.repository.StudentRepository;
import com.courseenrollment.student.service.StudentService;
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
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private CourseRepository courseRepository;

    @InjectMocks
    private StudentService studentService;

    private Course mockCourse;
    private Student mockStudent;

    @BeforeEach
    void setUp() {
        mockCourse = new Course("React 101", "Jane Smith", 2);
        mockCourse.setId(1L);

        mockStudent = new Student("Alice", "alice@test.com", "2026-01-01", mockCourse);
        mockStudent.setId(1L);
    }

    @Test
    @DisplayName("create should enroll a student when seats are available")
    void create_success() {
        CreateStudentRequest req = new CreateStudentRequest("Alice", "alice@test.com", "2026-01-01", 1L);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));
        when(studentRepository.countByCourseId(1L)).thenReturn(0L);
        when(studentRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(mockStudent);

        Student created = studentService.create(req);

        assertThat(created).isNotNull();
        assertThat(created.getName()).isEqualTo("Alice");
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    @DisplayName("create should throw ResourceNotFoundException when course does not exist")
    void create_courseNotFound() {
        CreateStudentRequest req = new CreateStudentRequest("Ghost", "g@g.com", null, 999L);
        when(courseRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.create(req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Course with ID 999 not found");

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("create should throw ConflictException when course is full (seat limit enforcement)")
    void create_courseFull() {
        CreateStudentRequest req = new CreateStudentRequest("Dave", "dave@test.com", null, 1L);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse)); // seatLimit = 2
        when(studentRepository.countByCourseId(1L)).thenReturn(2L); // 2 enrolled

        assertThatThrownBy(() -> studentService.create(req))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Course is full. Cannot enroll more students.");

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("create should throw ConflictException on duplicate student email")
    void create_duplicateEmail() {
        CreateStudentRequest req = new CreateStudentRequest("Alice", "alice@test.com", null, 1L);
        when(courseRepository.findById(1L)).thenReturn(Optional.of(mockCourse));
        when(studentRepository.countByCourseId(1L)).thenReturn(0L);
        when(studentRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThatThrownBy(() -> studentService.create(req))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Email already registered");

        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    @DisplayName("findAll should return paginated students")
    void findAll_success() {
        Page<Student> page = new PageImpl<>(List.of(mockStudent));
        when(studentRepository.findAll(any(Pageable.class))).thenReturn(page);

        PaginatedResponse<Student> result = studentService.findAll(1, 10, null);

        assertThat(result.getData()).hasSize(1);
        assertThat(result.getMeta().getTotal()).isEqualTo(1);
    }

    @Test
    @DisplayName("findOne should return student by ID")
    void findOne_success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));

        Student found = studentService.findOne(1L);

        assertThat(found.getName()).isEqualTo("Alice");
    }

    @Test
    @DisplayName("findOne should throw ResourceNotFoundException when student not found")
    void findOne_notFound() {
        when(studentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> studentService.findOne(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Student with ID 999 not found");
    }

    @Test
    @DisplayName("update should update student name and date")
    void update_success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(studentRepository.save(any(Student.class))).thenReturn(mockStudent);

        UpdateStudentRequest req = new UpdateStudentRequest("Alice Updated", null, null, null);
        Student updated = studentService.update(1L, req);

        assertThat(updated.getName()).isEqualTo("Alice Updated");
    }

    @Test
    @DisplayName("update should transfer student to another course when seats are available")
    void update_transferCourse_success() {
        Course targetCourse = new Course("Advanced TS", "Bob", 5);
        targetCourse.setId(2L);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(targetCourse));
        when(studentRepository.countByCourseId(2L)).thenReturn(1L);
        when(studentRepository.save(any(Student.class))).thenReturn(mockStudent);

        UpdateStudentRequest req = new UpdateStudentRequest(null, null, null, 2L);
        Student updated = studentService.update(1L, req);

        assertThat(updated.getCourse()).isEqualTo(targetCourse);
    }

    @Test
    @DisplayName("update should throw ConflictException when target course is full during transfer")
    void update_transferCourse_targetFull() {
        Course targetCourse = new Course("Advanced TS", "Bob", 1);
        targetCourse.setId(2L);

        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));
        when(courseRepository.findById(2L)).thenReturn(Optional.of(targetCourse));
        when(studentRepository.countByCourseId(2L)).thenReturn(1L); // already 1 student

        UpdateStudentRequest req = new UpdateStudentRequest(null, null, null, 2L);

        assertThatThrownBy(() -> studentService.update(1L, req))
                .isInstanceOf(ConflictException.class)
                .hasMessage("Target course is full. Cannot transfer student.");
    }

    @Test
    @DisplayName("remove should delete student")
    void remove_success() {
        when(studentRepository.findById(1L)).thenReturn(Optional.of(mockStudent));

        studentService.remove(1L);

        verify(studentRepository).delete(mockStudent);
    }
}
