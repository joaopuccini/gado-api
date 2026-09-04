import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AdminPrismaService } from '../admin-prisma.service';
import { CreateOrganizacaoDto } from './dto/create-organizacao.dto';
import { UpdateOrganizacaoDto } from './dto/update-organizacao.dto';
import { PrismaClient as TenantPrismaClient } from '@prisma/client';

@Injectable()
export class OrganizacoesService {
  constructor(private readonly prisma: AdminPrismaService) {}

  async create(createOrganizacaoDto: CreateOrganizacaoDto) {
    // 1. Verifica se subdominio ou CNPJ ja existe
    const existingOrg = await this.prisma.organizacao.findFirst({
      where: {
        OR: [
          { subdomain: createOrganizacaoDto.subdomain },
          ...(createOrganizacaoDto.cnpj ? [{ cnpj: createOrganizacaoDto.cnpj }] : []),
        ],
      },
    });

    if (existingOrg) {
      throw new ConflictException('Organização já existe com este subdomínio ou CNPJ');
    }

    const schemaName = `tenant_${createOrganizacaoDto.subdomain}`;

    // 2. Cria a organizacao e o TenantRegistry numa transaction
    return await this.prisma.$transaction(async (tx) => {
      const org = await tx.organizacao.create({
        data: {
          razaoSocial: createOrganizacaoDto.razaoSocial,
          nomeFantasia: createOrganizacaoDto.nomeFantasia,
          cnpj: createOrganizacaoDto.cnpj,
          email: createOrganizacaoDto.email,
          telefone: createOrganizacaoDto.telefone,
          subdomain: createOrganizacaoDto.subdomain,
          schemaName: schemaName,
          status: 'TRIAL',
        },
      });

      const registry = await tx.tenantRegistry.create({
        data: {
          organizacaoId: org.id,
          subdomain: createOrganizacaoDto.subdomain,
          schemaName: schemaName,
          status: 'PROVISIONANDO',
        },
      });

      // Aqui poderíamos emitir um evento ou agendar um job para:
      // a. CREATE SCHEMA tenant_x
      // b. Rodar migrations
      // c. Executar seed default
      
      // Simulando a criação imediata (síncrona) para testes locais:
      try {
         const tenantDb = new TenantPrismaClient();
         await tenantDb.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);
         await tenantDb.$disconnect();
         
         await tx.tenantRegistry.update({
           where: { id: registry.id },
           data: { status: 'ATIVO', provisionedAt: new Date() }
         });
      } catch (e) {
         console.error('Erro ao provisionar schema', e);
      }

      return org;
    });
  }

  async findAll() {
    return await this.prisma.organizacao.findMany({
      include: { tenantRegistry: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const org = await this.prisma.organizacao.findUnique({
      where: { id },
      include: { tenantRegistry: true },
    });
    if (!org) {
      throw new NotFoundException(`Organização #${id} não encontrada`);
    }
    return org;
  }

  async update(id: string, updateOrganizacaoDto: UpdateOrganizacaoDto) {
    try {
      return await this.prisma.organizacao.update({
        where: { id },
        data: updateOrganizacaoDto,
      });
    } catch (e) {
      throw new NotFoundException(`Organização #${id} não encontrada`);
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.organizacao.update({
        where: { id },
        data: { status: 'CANCELADO' },
      });
    } catch (e) {
      throw new NotFoundException(`Organização #${id} não encontrada`);
    }
  }
}
