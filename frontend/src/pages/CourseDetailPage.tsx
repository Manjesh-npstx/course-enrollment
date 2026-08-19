import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Course, Student, CreateStudentDto } from '../types';
import { StudentTable } from '../components/Student/StudentTable';
import { EnrollForm } from '../components/Student/EnrollForm';
import { Pagination } from '../components/shared/Pagination';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast } from '../components/shared/Toast';

export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [enrollOpen, setEnrollOpen] = useState(false);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCourse = useCallback(async () => {
    try {
      const data = await api.getCourse(courseId);
      setCourse(data);
    } catch {
      setToast({ message: 'Failed to load course', type: 'error' });
    }
  }, [courseId]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCourseStudents(courseId, page, 10);
      setStudents(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setToast({ message: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [courseId, page]);

  useEffect(() => {
    fetchCourse();
    fetchStudents();
  }, [fetchCourse, fetchStudents]);

  const handleEnroll = async (data: CreateStudentDto) => {
    await api.enrollStudent(data);
    setToast({ message: 'Student enrolled successfully', type: 'success' });
    fetchStudents();
    fetchCourse();
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    setDeleting(true);
    try {
      await api.deleteStudent(deleteStudent.id);
      setToast({ message: 'Student removed successfully', type: 'success' });
      setDeleteStudent(null);
      fetchStudents();
      fetchCourse();
    } catch {
      setToast({ message: 'Failed to remove student', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const enrolled = course?.students?.length ?? 0;
  const isFull = enrolled >= (course?.seatLimit ?? 0);

  if (!course) {
    return (
      <div className="page">
        <div className="empty-state">
          <p>Course not found</p>
          <Link to="/courses" className="btn btn-primary">Back to Courses</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/courses" className="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Courses
      </Link>

      <div className="course-detail-header card">
        <h1 className="page-title">{course.name}</h1>
        <p className="course-meta">Instructor: <strong>{course.instructor}</strong></p>
        <div className="course-seats">
          {isFull ? (
            <span className="badge badge-danger">Full — {enrolled}/{course.seatLimit} seats</span>
          ) : (
            <span className="badge badge-success">{enrolled}/{course.seatLimit} seats available</span>
          )}
        </div>
      </div>

      <div className="page-header">
        <h2 className="section-title">Enrolled Students</h2>
        <button className="btn btn-primary" onClick={() => setEnrollOpen(true)} disabled={isFull}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {isFull ? 'Course Full' : 'Enroll Student'}
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="table-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>No students enrolled yet</p>
            <button className="btn btn-primary" onClick={() => setEnrollOpen(true)} disabled={isFull}>
              Enroll first student
            </button>
          </div>
        ) : (
          <>
            <StudentTable students={students} showCourse={false} onDelete={setDeleteStudent} />
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title="Enroll Student">
        <EnrollForm courseId={courseId} onSubmit={handleEnroll} onClose={() => setEnrollOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDeleteStudent}
        title="Remove Student"
        message={`Are you sure you want to remove "${deleteStudent?.name}" from this course?`}
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
