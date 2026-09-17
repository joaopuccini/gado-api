import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AdminPrismaService } from '../../../admin/admin-prisma.service';
import { AdminLoginUseCase } from './admin-login.use-case';

jest.mock('bcrypt', () => ({
    compare: jest.fn(),
}));

describe('AdminLoginUseCase', () => {
    let useCase: AdminLoginUseCase;
    let adminPrisma: AdminPrismaService;
    let jwtService: JwtService;

    const mockAdminPrisma = {
        adminUser: {
            findUnique: jest.fn(),
        },
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdminLoginUseCase,
                { provide: AdminPrismaService, useValue: mockAdminPrisma },
                { provide: JwtService, useValue: mockJwtService },
            ],
        }).compile();

        useCase = module.get<AdminLoginUseCase>(AdminLoginUseCase);
        adminPrisma = module.get<AdminPrismaService>(AdminPrismaService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(useCase).toBeDefined();
    });

    describe('execute', () => {
        const mockDto = { email: 'admin@gado.com', password: 'password123' };
        const mockAdminUser = {
            id: 'uuid-123',
            email: 'admin@gado.com',
            senhaHash: 'hashed_password',
            role: 'SUPERADMIN',
            ativo: true,
        };

        it('should throw UnauthorizedException if user not found', async () => {
            mockAdminPrisma.adminUser.findUnique.mockResolvedValue(null);

            await expect(useCase.execute(mockDto)).rejects.toThrow(UnauthorizedException);
            expect(mockAdminPrisma.adminUser.findUnique).toHaveBeenCalledWith({
                where: { email: mockDto.email.toLowerCase() },
            });
        });

        it('should throw UnauthorizedException if user is inactive', async () => {
            mockAdminPrisma.adminUser.findUnique.mockResolvedValue({ ...mockAdminUser, ativo: false });

            await expect(useCase.execute(mockDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password does not match', async () => {
            mockAdminPrisma.adminUser.findUnique.mockResolvedValue(mockAdminUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(useCase.execute(mockDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should return a token with aud: gado-admin on success', async () => {
            mockAdminPrisma.adminUser.findUnique.mockResolvedValue(mockAdminUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('mock_token');

            const result = await useCase.execute(mockDto);

            expect(result).toEqual({ token: 'mock_token' });
            expect(mockJwtService.sign).toHaveBeenCalledWith({
                sub: mockAdminUser.id,
                email: mockAdminUser.email,
                role: mockAdminUser.role,
                aud: 'gado-admin',
            });
        });
    });
});
