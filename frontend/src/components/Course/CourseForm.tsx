import { useState, useEffect } from 'react';
import type { Course, CreateCourseDto, UpdateCourseDto } from '../../types';

interface CourseFormProps {
  course?: Course | null;
  onSubmit: (data: CreateCourseDto | UpdateCourseDto) => Promise<void>;
  onClose: () => void;
}

export function CourseForm({ course, onSubmit, onClose }: CourseFormProps) {
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [seatLimit, setSeatLimit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (course) {
      setName(course.name);
      setInstructor(course.instructor);
      setSeatLimit(String(course.seatLimit));
    }
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        name: name.trim(),
        instructor: instructor.trim(),
        seatLimit: Number(seatLimit),
      };
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
        <label>Course Name</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Advanced Mathematics"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Instructor</label>
        <input
          className="input"
          type="text"
          placeholder="e.g. Dr. Smith"
          value={instructor}
          onChange={(e) => setInstructor(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Seat Limit</label>
        <input
          className="input"
          type="number"
          min="1"
          placeholder="e.g. 30"
          value={seatLimit}
          onChange={(e) => setSeatLimit(e.target.value)}
          required
        />
      </div>

      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : course ? 'Update Course' : 'Create Course'}
        </button>
      </div>
    </form>
  );
}
