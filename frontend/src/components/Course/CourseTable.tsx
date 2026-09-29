import { Link } from 'react-router-dom';
import type { Course } from '../../types';

interface CourseTableProps {
  courses: Course[];
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onApprove?: (course: Course) => void;
  onReject?: (course: Course) => void;
  onEnroll?: (course: Course) => void;
  isAdmin?: boolean;
  isInstructor?: boolean;
  isStudent?: boolean;
  currentUserEmail?: string;
  enrolledCourseIds?: number[];
}

function getSeatBadge(course: Course) {
  const enrolled = course.students?.length ?? 0;
  const remaining = course.seatLimit - enrolled;

  if (remaining <= 0) return <span className="badge badge-danger">Full ({course.seatLimit}/{course.seatLimit})</span>;
  if (remaining <= course.seatLimit * 0.1) return <span className="badge badge-danger">{remaining} left ({enrolled}/{course.seatLimit})</span>;
  if (remaining <= course.seatLimit * 0.5) return <span className="badge badge-warning">{remaining} left ({enrolled}/{course.seatLimit})</span>;
  return <span className="badge badge-success">{remaining} left ({enrolled}/{course.seatLimit})</span>;
}

function getStatusBadge(status?: string) {
  const s = (status || 'approved').toLowerCase();
  if (s === 'approved') return <span className="badge badge-success">Approved</span>;
  if (s === 'pending') return <span className="badge badge-warning">Pending Approval</span>;
  if (s === 'rejected') return <span className="badge badge-danger">Rejected</span>;
  return <span className="badge badge-secondary">{status}</span>;
}

export function CourseTable({
  courses,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onEnroll,
  isAdmin = false,
  isInstructor = false,
  isStudent = false,
  currentUserEmail,
  enrolledCourseIds = [],
}: CourseTableProps) {
  const showActions = isAdmin || isInstructor || isStudent;

  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Instructor</th>
          <th>Status</th>
          <th>Seats</th>
          {showActions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => {
          const isOwnCourse = isInstructor && course.instructorEmail === currentUserEmail;
          const isPending = (course.status || '').toLowerCase() === 'pending';
          const isEnrolled = enrolledCourseIds.includes(course.id);
          const enrolledCount = course.students?.length ?? 0;
          const isFull = enrolledCount >= course.seatLimit;

          return (
            <tr key={course.id}>
              <td className="td-bold">
                <Link to={`/courses/${course.id}`} className="table-link">{course.name}</Link>
              </td>
              <td>{course.instructor}</td>
              <td>{getStatusBadge(course.status)}</td>
              <td>{getSeatBadge(course)}</td>
              {showActions && (
                <td>
                  <div className="action-buttons" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Admin Actions */}
                    {isAdmin && (
                      <>
                        {isPending && onApprove && (
                          <button
                            className="btn btn-icon btn-ghost btn-success-icon"
                            title="Approve Course"
                            onClick={() => onApprove(course)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </button>
                        )}
                        {isPending && onReject && (
                          <button
                            className="btn btn-icon btn-ghost btn-danger-icon"
                            title="Reject Course"
                            onClick={() => onReject(course)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
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
                      </>
                    )}

                    {/* Instructor Actions */}
                    {!isAdmin && isInstructor && (
                      <>
                        {isOwnCourse ? (
                          <button className="btn btn-icon btn-ghost" title="Edit Course" onClick={() => onEdit(course)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>View Only</span>
                        )}
                      </>
                    )}

                    {/* Student Actions */}
                    {isStudent && (
                      <>
                        {isEnrolled ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>✓ Enrolled</span>
                        ) : isFull ? (
                          <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>Full</span>
                        ) : (course.status || '').toLowerCase() === 'approved' && onEnroll ? (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                            onClick={() => onEnroll(course)}
                          >
                            Enroll
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
