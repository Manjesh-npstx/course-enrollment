import type { Course } from '../../types';

interface CourseTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
}

function getSeatBadge(course: Course) {
  const enrolled = course.students?.length ?? 0;
  const remaining = course.seatLimit - enrolled;

  if (remaining <= 0) return <span className="badge badge-danger">Full</span>;
  if (remaining <= course.seatLimit * 0.1) return <span className="badge badge-danger">{remaining}/{course.seatLimit} seats</span>;
  if (remaining <= course.seatLimit * 0.5) return <span className="badge badge-warning">{remaining}/{course.seatLimit} seats</span>;
  return <span className="badge badge-success">{remaining}/{course.seatLimit} seats</span>;
}

export function CourseTable({ courses, onEdit, onDelete }: CourseTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Instructor</th>
          <th>Seats</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => (
          <tr key={course.id}>
            <td className="td-bold">
              <a href={`/courses/${course.id}`} className="table-link">{course.name}</a>
            </td>
            <td>{course.instructor}</td>
            <td>{getSeatBadge(course)}</td>
            <td>
              <div className="action-buttons">
                <button className="btn btn-icon btn-ghost" title="Edit" onClick={() => onEdit(course)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button className="btn btn-icon btn-ghost btn-danger-icon" title="Delete" onClick={() => onDelete(course)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
