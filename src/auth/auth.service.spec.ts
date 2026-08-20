import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from './user.entity';

const mockUser = {
  id: 1,
  name: 'Admin',
  email: 'admin@test.com',
  password: '$2a$10$hashedpassword',
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2a$10$hashedpassword'),
  compare: jest.fn().mockImplementation((plain: string) =>
    Promise.resolve(plain === 'pass123'),
  ),
}));

function createMockRepo(overrides: Record<string, any> = {}) {
  return {
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation((dto) => ({ id: 1, ...dto })),
    save: jest.fn().mockImplementation((entity) => Promise.resolve({ ...mockUser, ...entity })),
    ...overrides,
  };
}

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    userRepo = createMockRepo();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      const result = await service.register({
        name: 'Admin',
        email: 'admin@test.com',
        password: 'pass123',
      });
      expect(result.user.name).toBe('Admin');
      expect(result.token).toBe('mock-jwt-token');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.register({ name: 'Dup', email: 'admin@test.com', password: 'pass123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login and return token', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      const result = await service.login({
        email: 'admin@test.com',
        password: 'pass123',
      });
      expect(result.user.email).toBe('admin@test.com');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedException for wrong email', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        service.login({ email: 'wrong@test.com', password: 'pass123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      userRepo.findOne.mockResolvedValue(mockUser);
      await expect(
        service.login({ email: 'admin@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
