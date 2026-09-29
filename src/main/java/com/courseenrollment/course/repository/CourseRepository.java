package com.courseenrollment.course.repository;

import com.courseenrollment.course.entity.Course;
import com.courseenrollment.course.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    @Query("SELECT c FROM Course c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.instructor) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Course> searchCourses(@Param("search") String search, Pageable pageable);

    Page<Course> findByStatus(CourseStatus status, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE (c.status = :status OR (c.status IS NULL AND :status = com.courseenrollment.course.enums.CourseStatus.APPROVED)) AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.instructor) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchCoursesByStatus(@Param("search") String search, @Param("status") CourseStatus status, Pageable pageable);

    Page<Course> findByInstructorEmail(String instructorEmail, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.instructorEmail = :instructorEmail AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.instructor) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchCoursesByInstructorEmail(@Param("search") String search, @Param("instructorEmail") String instructorEmail, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE (c.status = com.courseenrollment.course.enums.CourseStatus.APPROVED OR c.status IS NULL OR c.instructorEmail = :instructorEmail) AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.instructor) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Course> searchApprovedOrMyCourses(@Param("search") String search, @Param("instructorEmail") String instructorEmail, Pageable pageable);

    @Query("SELECT c FROM Course c WHERE c.status = com.courseenrollment.course.enums.CourseStatus.APPROVED OR c.status IS NULL OR c.instructorEmail = :instructorEmail")
    Page<Course> findApprovedOrMyCourses(@Param("instructorEmail") String instructorEmail, Pageable pageable);
}
