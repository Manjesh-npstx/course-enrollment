import { useState, useEffect } from 'react';
import type { Course, Student, UpdateStudentDto } from '../../types';

interface EditStudentFormProps {
  student: Student;
  courses?: Course[];
  isAdmin?: boolean;
  onSubmit: (data: UpdateStudentDto) => Promise<void>;
  onClose: () => void;
}

export function EditStudentForm({ student, courses = [], isAdmin = false, onSubmit, onClose }: EditStudentFormProps) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [enrollDate, setEnrollDate] = useState(student.enrollDate);
  const [courseId, setCourseId] = useState(student.courseId);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(student.name);
    setEmail(student.email);
    setEnrollDate(student.enrollDate);
    setCourseId(student.courseId);
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data: UpdateStudentDto = {
      name: name.trim(),
      email: email.trim(),
      enrollDate,
    };

    if (isAdmin && courseId !== student.courseId) {
      data.courseId = courseId;
    }

    try {
      await onSubmit(data);
      onClose();
    } catch (err: any) {
      const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      setError(msg || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {error && <div className="form-error">{error}</div>}

      <div className="form-group">
        <label>Student Name</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          className="input"
          type="email"
          placeholder="e.g. john@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Enrollment Date</label>
        <input
          className="input"
          type="date"
          value={enrollDate}
          onChange={(e) => setEnrollDate(e.target.value)}
        />
      </div>

      {isAdmin && courses.length > 0 && (
        <div className="form-group">
          <label>Transfer to Course</label>
          <select
            className="input"
            value={courseId}
            onChange={(e) => setCourseId(Number(e.target.value))}
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.instructor})</option>
            ))}
          </select>
        </div>
      )}

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : 'Update Student'}
        </button>
      </div>
    </form>
  );
}
