package com.courseenrollment.course.entity;

import com.courseenrollment.course.enums.CourseStatus;
import com.courseenrollment.student.entity.Student;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String instructor;

    @Column(nullable = false)
    private int seatLimit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CourseStatus status = CourseStatus.APPROVED;

    @Column
    private String instructorEmail;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"course", "students"})
    @OrderBy("createdAt DESC")
    private List<Student> students = new ArrayList<>();

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.status == null) {
            this.status = CourseStatus.APPROVED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    @PostLoad
    protected void onPostLoad() {
        if (this.status == null) {
            this.status = CourseStatus.APPROVED;
        }
    }

    public Course() {
    }

    public Course(String name, String instructor, int seatLimit) {
        this.name = name;
        this.instructor = instructor;
        this.seatLimit = seatLimit;
        this.status = CourseStatus.APPROVED;
    }

    public Course(String name, String instructor, int seatLimit, CourseStatus status, String instructorEmail) {
        this.name = name;
        this.instructor = instructor;
        this.seatLimit = seatLimit;
        this.status = status != null ? status : CourseStatus.APPROVED;
        this.instructorEmail = instructorEmail;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getInstructor() {
        return instructor;
    }

    public void setInstructor(String instructor) {
        this.instructor = instructor;
    }

    public int getSeatLimit() {
        return seatLimit;
    }

    public void setSeatLimit(int seatLimit) {
        this.seatLimit = seatLimit;
    }

    public List<Student> getStudents() {
        return students;
    }

    public void setStudents(List<Student> students) {
        this.students = students != null ? students : new ArrayList<>();
    }

    public CourseStatus getStatus() {
        return status != null ? status : CourseStatus.APPROVED;
    }

    public void setStatus(CourseStatus status) {
        this.status = status != null ? status : CourseStatus.APPROVED;
    }

    public String getInstructorEmail() {
        return instructorEmail;
    }

    public void setInstructorEmail(String instructorEmail) {
        this.instructorEmail = instructorEmail;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
