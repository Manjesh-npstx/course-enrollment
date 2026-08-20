import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Course, CreateCourseDto, UpdateCourseDto } from '../types';
import { CourseTable } from '../components/Course/CourseTable';
import { CourseForm } from '../components/Course/CourseForm';
import { SearchBar } from '../components/shared/SearchBar';
import { Pagination } from '../components/shared/Pagination';
import { Modal } from '../components/shared/Modal';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast } from '../components/shared/Toast';
import { useAuth } from '../context/AuthContext';

export function CoursesPage() {
  const { isAdmin } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCourses(page, 10, search);
      setCourses(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch {
      setToast({ message: 'Failed to load courses', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleCreate = async (data: CreateCourseDto | UpdateCourseDto) => {
    try {
      await api.createCourse(data as CreateCourseDto);
      setToast({ message: 'Course created successfully', type: 'success' });
      fetchCourses();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setToast({ message: msg || 'Failed to create course', type: 'error' });
      throw err;
    }
  };

  const handleUpdate = async (data: CreateCourseDto | UpdateCourseDto) => {
    if (!editCourse) return;
    try {
      await api.updateCourse(editCourse.id, data as UpdateCourseDto);
      setToast({ message: 'Course updated successfully', type: 'success' });
      fetchCourses();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setToast({ message: msg || 'Failed to update course', type: 'error' });
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteCourse) return;
    setDeleting(true);
    try {
      await api.deleteCourse(deleteCourse.id);
      setToast({ message: 'Course deleted successfully', type: 'success' });
      setDeleteCourse(null);
      fetchCourses();
    } catch {
      setToast({ message: 'Failed to delete course', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Courses</h1>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditCourse(null); setFormOpen(true); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Course
          </button>
        )}
      </div>

      <div className="card">
        <SearchBar placeholder="Search courses..." onSearch={handleSearch} />

        {loading ? (
          <div className="table-skeleton">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-row" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <p>No courses found</p>
            {isAdmin && (
              <button className="btn btn-primary" onClick={() => { setEditCourse(null); setFormOpen(true); }}>
                Create your first course
              </button>
            )}
          </div>
        ) : (
          <>
            <CourseTable
              courses={courses}
              onEdit={(c) => { setEditCourse(c); setFormOpen(true); }}
              onDelete={setDeleteCourse}
              isAdmin={isAdmin}
            />
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editCourse ? 'Edit Course' : 'New Course'}>
        <CourseForm
          course={editCourse}
          onSubmit={editCourse ? handleUpdate : handleCreate}
          onClose={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteCourse}
        onClose={() => setDeleteCourse(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete "${deleteCourse?.name}"? This will also remove all enrolled students.`}
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
