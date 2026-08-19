import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type { Student } from '../types';
import { StudentTable } from '../components/Student/StudentTable';
import { SearchBar } from '../components/shared/SearchBar';
import { Pagination } from '../components/shared/Pagination';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import { Toast } from '../components/shared/Toast';

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
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
            <StudentTable students={students} showCourse={true} onDelete={setDeleteStudent} />
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteStudent}
        onClose={() => setDeleteStudent(null)}
        onConfirm={handleDelete}
        title="Remove Student"
        message={`Are you sure you want to remove "${deleteStudent?.name}" from "${deleteStudent?.course?.name}"?`}
        loading={deleting}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
