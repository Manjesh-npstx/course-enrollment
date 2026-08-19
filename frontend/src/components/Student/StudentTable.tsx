import type { Student } from '../../types';

interface StudentTableProps {
  students: Student[];
  showCourse?: boolean;
  onEdit?: (student: Student) => void;
  onDelete?: (student: Student) => void;
}

export function StudentTable({ students, showCourse = true, onEdit, onDelete }: StudentTableProps) {
  const showActions = onEdit || onDelete;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Enrolled</th>
          {showCourse && <th>Course</th>}
          {showActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr key={student.id}>
            <td className="td-bold">{student.name}</td>
            <td className="td-muted">{student.email}</td>
            <td>{new Date(student.enrollDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
            {showCourse && <td>{student.course?.name ?? '—'}</td>}
            {showActions && (
              <td>
                <div className="action-buttons">
                  {onEdit && (
                    <button className="btn btn-icon btn-ghost" title="Edit" onClick={() => onEdit(student)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn btn-icon btn-ghost btn-danger-icon" title="Remove" onClick={() => onDelete(student)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
