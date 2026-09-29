package com.courseenrollment.student.repository;

import com.courseenrollment.course.entity.Course;
import com.courseenrollment.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    @Query("SELECT COUNT(s) FROM Student s WHERE s.course.id = :courseId")
    long countByCourseId(@Param("courseId") Long courseId);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    @Query("SELECT s FROM Student s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Student> searchStudents(@Param("search") String search, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.course.id = :courseId")
    Page<Student> findByCourseId(@Param("courseId") Long courseId, Pageable pageable);

    @Query("SELECT s FROM Student s WHERE s.course.id = :courseId")
    List<Student> findByCourseId(@Param("courseId") Long courseId);

    @Query("SELECT s.course FROM Student s WHERE LOWER(s.email) = LOWER(:email)")
    Page<Course> findEnrolledCoursesByEmail(@Param("email") String email, Pageable pageable);

    @Query("SELECT s.course FROM Student s WHERE LOWER(s.email) = LOWER(:email)")
    List<Course> findEnrolledCoursesByEmail(@Param("email") String email);

    Optional<Student> findFirstByEmailIgnoreCase(String email);
}
