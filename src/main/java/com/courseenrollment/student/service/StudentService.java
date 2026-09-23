package com.courseenrollment.student.service;

import com.courseenrollment.common.dto.PageMeta;
import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.common.exception.ResourceNotFoundException;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.repository.CourseRepository;
import com.courseenrollment.student.dto.CreateStudentRequest;
import com.courseenrollment.student.dto.UpdateStudentRequest;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;

    public StudentService(StudentRepository studentRepository, CourseRepository courseRepository) {
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public Student create(CreateStudentRequest req) {
        Course course = courseRepository.findById(req.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course with ID " + req.getCourseId() + " not found"));

        long currentEnrollment = studentRepository.countByCourseId(req.getCourseId());
        if (currentEnrollment >= course.getSeatLimit()) {
            throw new ConflictException("Course is full. Cannot enroll more students.");
        }

        if (studentRepository.existsByEmail(req.getEmail().trim())) {
            throw new ConflictException("Email already registered");
        }

        String enrollDate = (req.getEnrollDate() != null && !req.getEnrollDate().trim().isEmpty())
                ? req.getEnrollDate().trim()
                : LocalDate.now().toString();

        Student student = new Student(
                req.getName().trim(),
                req.getEmail().trim(),
                enrollDate,
                course
        );

        return studentRepository.save(student);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Student> findAll(int page, int limit, String search) {
        int take = Math.min(Math.max(limit, 1), 50);
        int pageIndex = Math.max(page - 1, 0);

        Pageable pageable = PageRequest.of(pageIndex, take, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Student> resultPage;

        if (search != null && !search.trim().isEmpty()) {
            resultPage = studentRepository.searchStudents(search.trim(), pageable);
        } else {
            resultPage = studentRepository.findAll(pageable);
        }

        long total = resultPage.getTotalElements();
        int totalPages = (int) Math.ceil((double) total / take);
        PageMeta meta = new PageMeta(total, page, take, totalPages);

        return new PaginatedResponse<>(resultPage.getContent(), meta);
    }

    @Transactional(readOnly = true)
    public Student findOne(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student with ID " + id + " not found"));
    }

    @Transactional
    public Student update(Long id, UpdateStudentRequest req) {
        Student student = findOne(id);

        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            String newEmail = req.getEmail().trim();
            if (studentRepository.existsByEmailAndIdNot(newEmail, id)) {
                throw new ConflictException("Email already registered");
            }
            student.setEmail(newEmail);
        }

        if (req.getCourseId() != null && !req.getCourseId().equals(student.getCourse().getId())) {
            Course newCourse = courseRepository.findById(req.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course with ID " + req.getCourseId() + " not found"));

            long currentEnrollment = studentRepository.countByCourseId(req.getCourseId());
            if (currentEnrollment >= newCourse.getSeatLimit()) {
                throw new ConflictException("Target course is full. Cannot transfer student.");
            }
            student.setCourse(newCourse);
        }

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            student.setName(req.getName().trim());
        }

        if (req.getEnrollDate() != null && !req.getEnrollDate().trim().isEmpty()) {
            student.setEnrollDate(req.getEnrollDate().trim());
        }

        return studentRepository.save(student);
    }

    @Transactional
    public void remove(Long id) {
        Student student = findOne(id);
        Course course = student.getCourse();
        if (course != null && course.getStudents() != null) {
            course.getStudents().remove(student);
        }
        studentRepository.delete(student);
        studentRepository.flush();
    }

    @Transactional(readOnly = true)
    public List<Student> findByCourseId(Long courseId) {
        return studentRepository.findByCourseId(courseId);
    }
}
