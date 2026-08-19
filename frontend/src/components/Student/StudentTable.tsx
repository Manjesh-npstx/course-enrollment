import type { Student } from '../../types';

interface StudentTableProps {
  students: Student[];
  showCourse?: boolean;
  onDelete?: (student: Student) => void;
}

export function StudentTable({ students, showCourse = true, onDelete }: StudentTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Enrolled</th>
          {showCourse && <th>Course</th>}
          {onDelete && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td className="td-bold">{student.name}</td>
            <td className="td-muted">{student.email}</td>
            <td>{new Date(student.enrollDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            {showCourse && <td>{student.course?.name ?? '—'}</td>}
            {onDelete && (
              <td>
                <button className="btn btn-icon btn-ghost btn-danger-icon" title="Remove" onClick={() => onDelete(student)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
