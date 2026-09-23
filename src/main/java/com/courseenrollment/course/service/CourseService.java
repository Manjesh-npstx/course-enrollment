package com.courseenrollment.course.service;

import com.courseenrollment.common.dto.PageMeta;
import com.courseenrollment.common.dto.PaginatedResponse;
import com.courseenrollment.common.exception.ConflictException;
import com.courseenrollment.common.exception.ResourceNotFoundException;
import com.courseenrollment.course.dto.CreateCourseRequest;
import com.courseenrollment.course.dto.UpdateCourseRequest;
import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.repository.CourseRepository;
import com.courseenrollment.student.entity.Student;
import com.courseenrollment.student.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;

    public CourseService(CourseRepository courseRepository, StudentRepository studentRepository) {
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
    }

    @Transactional
    public Course create(CreateCourseRequest req) {
        Course course = new Course(
                req.getName().trim(),
                req.getInstructor().trim(),
                req.getSeatLimit()
        );
        return courseRepository.save(course);
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Course> findAll(int page, int limit, String search) {
        int take = Math.min(Math.max(limit, 1), 50);
        int pageIndex = Math.max(page - 1, 0);

        Pageable pageable = PageRequest.of(pageIndex, take, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Course> resultPage;

        if (search != null && !search.trim().isEmpty()) {
            resultPage = courseRepository.searchCourses(search.trim(), pageable);
        } else {
            resultPage = courseRepository.findAll(pageable);
        }

        long total = resultPage.getTotalElements();
        int totalPages = (int) Math.ceil((double) total / take);
        PageMeta meta = new PageMeta(total, page, take, totalPages);

        return new PaginatedResponse<>(resultPage.getContent(), meta);
    }

    @Transactional(readOnly = true)
    public Course findOne(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course with ID " + id + " not found"));
    }

    @Transactional
    public Course update(Long id, UpdateCourseRequest req) {
        Course course = findOne(id);

        if (req.getSeatLimit() != null) {
            long currentEnrollment = studentRepository.countByCourseId(id);
            if (req.getSeatLimit() < currentEnrollment) {
                throw new ConflictException(
                        "Cannot reduce seat limit to " + req.getSeatLimit() + ". " + currentEnrollment + " student(s) currently enrolled."
                );
            }
            course.setSeatLimit(req.getSeatLimit());
        }

        if (req.getName() != null && !req.getName().trim().isEmpty()) {
            course.setName(req.getName().trim());
        }

        if (req.getInstructor() != null && !req.getInstructor().trim().isEmpty()) {
            course.setInstructor(req.getInstructor().trim());
        }

        return courseRepository.save(course);
    }

    @Transactional
    public void remove(Long id) {
        Course course = findOne(id);
        courseRepository.delete(course);
        courseRepository.flush();
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<Student> findStudentsByCourseId(Long courseId, int page, int limit) {
        // Ensure course exists
        findOne(courseId);

        int take = Math.min(Math.max(limit, 1), 50);
        int pageIndex = Math.max(page - 1, 0);

        Pageable pageable = PageRequest.of(pageIndex, take, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Student> resultPage = studentRepository.findByCourseId(courseId, pageable);

        long total = resultPage.getTotalElements();
        int totalPages = (int) Math.ceil((double) total / take);
        PageMeta meta = new PageMeta(total, page, take, totalPages);

        return new PaginatedResponse<>(resultPage.getContent(), meta);
    }
}
