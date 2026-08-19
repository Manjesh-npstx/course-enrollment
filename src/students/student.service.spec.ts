import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { StudentService } from './student.service';
import { Student } from './student.entity';
import { Course } from '../courses/course.entity';

const mockCourse = { id: 1, name: 'React 101', instructor: 'Jane', seatLimit: 2, students: [] };
const mockStudent = { id: 1, name: 'Alice', email: 'alice@test.com', courseId: 1, enrollDate: '2026-01-01', course: mockCourse, createdAt: new Date(), updatedAt: new Date() };

function createMockRepo(overrides: Record<string, any> = {}) {
  return {
    find: jest.fn().mockResolvedValue([mockStudent]),
    findOne: jest.fn().mockResolvedValue(mockStudent),
    findAndCount: jest.fn().mockResolvedValue([[mockStudent], 1]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto, course: mockCourse })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve(entity)),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('StudentService', () => {
  let service: StudentService;
  let studentRepo: ReturnType<typeof createMockRepo>;
  let courseRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    studentRepo = createMockRepo();
    courseRepo = createMockRepo({ findOne: jest.fn().mockResolvedValue(mockCourse) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: getRepositoryToken(Course), useValue: courseRepo },
      ],
    }).compile();

    service = module.get(StudentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should enroll a student in a course', async () => {
      const dto = { name: 'Alice', email: 'alice@test.com', courseId: 1 };
      const result = await service.create(dto);
      expect(result.name).toBe('Alice');
      expect(studentRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.create({ name: 'X', email: 'x@x.com', courseId: 999 })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if course is full', async () => {
      courseRepo.findOne.mockResolvedValue({ ...mockCourse, seatLimit: 1 });
      studentRepo.count.mockResolvedValue(1);
      await expect(service.create({ name: 'X', email: 'x@x.com', courseId: 1 })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated students', async () => {
      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for missing student', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a student', async () => {
      const result = await service.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException if student not found', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.update(999, { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when transferring to a full course', async () => {
      courseRepo.findOne.mockResolvedValue({ ...mockCourse, id: 2, seatLimit: 1 });
      studentRepo.count.mockResolvedValue(1);
      await expect(service.update(1, { courseId: 2 })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a student', async () => {
      await service.remove(1);
      expect(studentRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if student not found', async () => {
      studentRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
