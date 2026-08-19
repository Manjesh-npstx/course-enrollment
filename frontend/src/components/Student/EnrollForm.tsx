import { useState } from 'react';
import type { CreateStudentDto } from '../../types';

interface EnrollFormProps {
  courseId?: number;
  onSubmit: (data: CreateStudentDto) => Promise<void>;
  onClose: () => void;
}

export function EnrollForm({ courseId, onSubmit, onClose }: EnrollFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [enrollDate, setEnrollDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim(),
        enrollDate,
        courseId: courseId!,
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
          {loading ? 'Enrolling...' : 'Enroll Student'}
        </button>
      </div>
    </form>
  );
}
