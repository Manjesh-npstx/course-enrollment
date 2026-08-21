import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CourseService } from './course.service';
import { Course } from './course.entity';
import { Student } from '../students/student.entity';

const mockCourse = {
  id: 1,
  name: 'React 101',
  instructor: 'Jane Smith',
  seatLimit: 5,
  students: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockStudent = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  courseId: 1,
  enrollDate: '2026-01-01',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPaginatedResult = {
  data: [mockCourse],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

function createMockRepo(overrides: Record<string, any> = {}) {
  return {
    find: jest.fn().mockResolvedValue([mockCourse]),
    findOne: jest.fn().mockResolvedValue(mockCourse),
    findAndCount: jest.fn().mockResolvedValue([[mockCourse], 1]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockImplementation((...args) => {
      const dto = args.length === 2 ? args[1] : args[0];
      return { id: 1, ...dto, students: [] };
    }),
    save: jest.fn().mockImplementation((...args) => {
      const entity = args.length === 2 ? args[1] : args[0];
      return Promise.resolve(entity);
    }),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockDataSource(courseRepo: ReturnType<typeof createMockRepo>, studentRepo: ReturnType<typeof createMockRepo>) {
  const mockManager = {
    findOne: jest.fn()
      .mockImplementation((target) => {
        if (target.name === 'Course') return courseRepo.findOne();
        return studentRepo.findOne();
      }),
    count: jest.fn()
      .mockImplementation((target) => {
        if (target.name === 'Student') return studentRepo.count();
        return courseRepo.count();
      }),
    create: courseRepo.create,
    save: courseRepo.save,
  };

  return {
    transaction: jest.fn().mockImplementation(async (cb) => cb(mockManager)),
    manager: mockManager,
  };
}

describe('CourseService', () => {
  let service: CourseService;
  let courseRepo: ReturnType<typeof createMockRepo>;
  let studentRepo: ReturnType<typeof createMockRepo>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    courseRepo = createMockRepo();
    studentRepo = createMockRepo({
      findAndCount: jest.fn().mockResolvedValue([[mockStudent], 1]),
    });
    dataSource = createMockDataSource(courseRepo, studentRepo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: getRepositoryToken(Course), useValue: courseRepo },
        { provide: getRepositoryToken(Student), useValue: studentRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(CourseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a course', async () => {
      const dto = { name: 'React 101', instructor: 'Jane', seatLimit: 5 };
      const result = await service.create(dto);
      expect(courseRepo.create).toHaveBeenCalledWith(dto);
      expect(courseRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('React 101');
    });
  });

  describe('findAll', () => {
    it('should return paginated courses', async () => {
      const result = await service.findAll(1, 10);
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(courseRepo.findAndCount).toHaveBeenCalled();
    });

    it('should apply search filter', async () => {
      await service.findAll(1, 10, 'React');
      const callArgs = courseRepo.findAndCount.mock.calls[0][0];
      expect(callArgs.where).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a course by id', async () => {
      const result = await service.findOne(1);
      expect(result.id).toBe(1);
    });

    it('should throw NotFoundException for missing course', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the course', async () => {
      const result = await service.update(1, { name: 'Updated' });
      expect(result.name).toBe('Updated');
      expect(courseRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.update(999, { name: 'X' })).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if seat limit reduced below enrollment', async () => {
      studentRepo.count.mockResolvedValue(10);
      await expect(service.update(1, { seatLimit: 5 })).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should remove a course', async () => {
      await service.remove(1);
      expect(courseRepo.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findStudentsByCourseId', () => {
    it('should return students for a course', async () => {
      const result = await service.findStudentsByCourseId(1);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('John Doe');
      expect(result.meta.total).toBe(1);
    });

    it('should throw NotFoundException if course not found', async () => {
      courseRepo.findOne.mockResolvedValue(null);
      await expect(service.findStudentsByCourseId(999)).rejects.toThrow(NotFoundException);
    });
  });
});
