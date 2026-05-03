import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
export declare abstract class BaseTenantService<CreateDto, UpdateDto> {
    protected readonly prisma: PrismaService;
    protected abstract readonly logger: Logger;
    protected abstract readonly modelName: string;
    constructor(prisma: PrismaService);
    protected abstract getDelegate(): any;
    protected withTenant<T>(operation: () => Promise<T>): Promise<T>;
    create(dto: CreateDto): Promise<unknown>;
    findAll(options?: {
        skip?: number;
        take?: number;
        where?: any;
        include?: any;
    }): Promise<{
        data: any;
        total: any;
    }>;
    findOne(id: number, include?: any): Promise<any>;
    update(id: number, dto: UpdateDto): Promise<unknown>;
    remove(id: number): Promise<unknown>;
}
