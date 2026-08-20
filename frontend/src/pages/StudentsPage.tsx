import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Course, Student, CreateStudentDto, UpdateStudentDto } from '../types';
import { StudentTable } from '../components/Student/StudentTable';
import { EditStudentForm } from '../components/Student/EditStudentForm';
import { EnrollForm } from '../components/Student/EnrollForm';
import { SearchBar } from '../components/shared/SearchBar';
import { Pagination } from '../components/shared/Pagination';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast } from '../components/shared/Toast';
import { useAuth } from '../context/AuthContext';

export function StudentsPage() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getStudents(page, 10, search);
      setStudents(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setToast({ message: 'Failed to load students', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.getCourses(1, 100);
      setCourses(res.data);
    } catch {
      setToast({ message: 'Failed to load courses', type: 'error' });
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteStudent) return;
    setDeleting(true);
    try {
      await api.deleteStudent(deleteStudent.id);
      setToast({ message: 'Student removed successfully', type: 'success' });
      setDeleteStudent(null);
      fetchStudents();
    } catch {
      setToast({ message: 'Failed to remove student', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  const handleEditStudent = async (data: UpdateStudentDto) => {
    if (!editStudent) return;
    try {
      await api.updateStudent(editStudent.id, data);
      setToast({ message: 'Student updated successfully', type: 'success' });
      setEditStudent(null);
      fetchStudents();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setToast({ message: msg || 'Failed to update student', type: 'error' });
      throw err;
    }
  };

  const handleEnroll = async (data: CreateStudentDto) => {
    try {
      await api.enrollStudent(data);
      setToast({ message: 'Student enrolled successfully', type: 'success' });
      setEnrollOpen(false);
      setSelectedCourseId(null);
      fetchStudents();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setToast({ message: msg || 'Failed to enroll student', type: 'error' });
      throw err;
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setSelectedCourseId(null); setEnrollOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Enroll Student
          </button>
        )}
      </div>

      <div className="card">
        <SearchBar placeholder="Search by name or email..." onSearch={handleSearch} />

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
            <p>No students found</p>
          </div>
        ) : (
          <>
            <StudentTable students={students} showCourse={true} onEdit={isAdmin ? setEditStudent : undefined} onDelete={isAdmin ? setDeleteStudent : undefined} />
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={enrollOpen} onClose={() => { setEnrollOpen(false); setSelectedCourseId(null); }} title="Enroll Student">
        {!selectedCourseId ? (
          <div className="form">
            <div className="form-group">
              <label>Select Course</label>
              <select
                className="input"
                value=""
                onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              >
                <option value="">Choose a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.instructor})</option>
                ))}
              </select>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={() => { setEnrollOpen(false); setSelectedCourseId(null); }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <EnrollForm courseId={selectedCourseId} onSubmit={handleEnroll} onClose={() => { setEnrollOpen(false); setSelectedCourseId(null); }} />
        )}
      </Modal>

      <Modal open={!!editStudent} onClose={() => setEditStudent(null)} title="Edit Student">
        {editStudent && <EditStudentForm student={editStudent} onSubmit={handleEditStudent} onClose={() => setEditStudent(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDelete}
        title="Remove Student"
        message={`Are you sure you want to remove "${deleteStudent?.name}" from "${deleteStudent?.course?.name}"?`}
        confirmLabel="Remove"
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
