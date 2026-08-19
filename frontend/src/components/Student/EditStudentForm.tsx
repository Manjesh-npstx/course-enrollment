import { useState, useEffect } from 'react';
import type { Student, UpdateStudentDto } from '../../types';

interface EditStudentFormProps {
  student: Student;
  onSubmit: (data: UpdateStudentDto) => Promise<void>;
  onClose: () => void;
}

export function EditStudentForm({ student, onSubmit, onClose }: EditStudentFormProps) {
  const [name, setName] = useState(student.name);
  const [email, setEmail] = useState(student.email);
  const [enrollDate, setEnrollDate] = useState(student.enrollDate);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(student.name);
    setEmail(student.email);
    setEnrollDate(student.enrollDate);
  }, [student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        enrollDate,
      });
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
