import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { DomainError } from '../../../common/errors/domain-error';
import { TenantPrismaService } from '../../../tenant/tenant-prisma.service';
import type {
  AnimalPage,
  AnimalRelations,
  AnimalRepository,
  AnimalView,
  CreateAnimalRecord,
  UpdateAnimalRecord,
} from '../application/ports/animal.repository';
import type {
  AnimalEntryType,
  AnimalSex,
  AnimalStatus,
} from '../domain/animal';

const ANIMAL_SELECT = {
  id: true,
  fazendaId: true,
  loteId: true,
  racaId: true,
  pastoId: true,
  clienteId: true,
  nome: true,
  numeroBrinco: true,
  sexo: true,
  status: true,
  tipoEntrada: true,
  nascimento: true,
  dataEntrada: true,
  pesoEntrada: true,
  pesoAtual: true,
  precoKilo: true,
  valorCompra: true,
  valorCustoTotal: true,
  matriz: true,
  castrado: true,
  observacao: true,
  ativo: true,
} as const;

type PersistedAnimal = Prisma.AnimalGetPayload<{
  select: typeof ANIMAL_SELECT;
}>;

const isoDate = (value: Date | null): string | null =>
  value?.toISOString().slice(0, 10) ?? null;

const decimalNumber = (value: { toString(): string } | null): number | null =>
  value === null ? null : Number(value.toString());

const toAnimal = (value: PersistedAnimal): AnimalView => ({
  id: value.id,
  fazendaId: value.fazendaId,
  loteId: value.loteId,
  racaId: value.racaId,
  pastoId: value.pastoId,
  clienteId: value.clienteId,
  nome: value.nome,
  numeroBrinco: value.numeroBrinco,
  sexo: value.sexo as AnimalSex | null,
  status: value.status as AnimalStatus,
  tipoEntrada: value.tipoEntrada as AnimalEntryType,
  nascimento: isoDate(value.nascimento),
  dataEntrada: isoDate(value.dataEntrada) ?? '',
  pesoEntrada: decimalNumber(value.pesoEntrada),
  pesoAtual: decimalNumber(value.pesoAtual),
  precoKilo: decimalNumber(value.precoKilo),
  valorCompra: decimalNumber(value.valorCompra),
  valorCustoTotal: decimalNumber(value.valorCustoTotal),
  matriz: value.matriz,
  castrado: value.castrado,
  observacao: value.observacao,
  ativo: value.ativo,
});

const dateOnly = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' &&
  error !== null &&
  'code' in error &&
  error.code === 'P2002';

@Injectable()
export class PrismaAnimalRepository implements AnimalRepository {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async list(
    fazendaId: number,
    page: number,
    limit: number,
  ): Promise<AnimalPage> {
    const client = this.tenantPrisma.getClient();
    const where = { fazendaId, ativo: true } as const;
    const [values, total] = await Promise.all([
      client.animal.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        select: ANIMAL_SELECT,
      }),
      client.animal.count({ where }),
    ]);
    return { data: values.map(toAnimal), page, limit, total };
  }

  async find(id: number, fazendaId: number): Promise<AnimalView | null> {
    const value = await this.tenantPrisma.getClient().animal.findFirst({
      where: { id, fazendaId, ativo: true },
      select: ANIMAL_SELECT,
    });
    return value ? toAnimal(value) : null;
  }

  async validateRelations(relations: AnimalRelations): Promise<boolean> {
    const client = this.tenantPrisma.getClient();
    const [breeds, batches, pastures, clients] = await Promise.all([
      client.raca.count({ where: { id: relations.racaId, ativo: true } }),
      client.lote.count({
        where: {
          id: relations.loteId,
          fazendaId: relations.fazendaId,
          ativo: true,
        },
      }),
      client.pasto.count({
        where: {
          id: relations.pastoId,
          fazendaId: relations.fazendaId,
          ativo: true,
        },
      }),
      relations.clienteId === null
        ? Promise.resolve(1)
        : client.cliente.count({
            where: { id: relations.clienteId, ativo: true },
          }),
    ]);
    return [breeds, batches, pastures, clients].every((count) => count === 1);
  }

  async create(input: CreateAnimalRecord): Promise<AnimalView> {
    try {
      return await this.tenantPrisma
        .getClient()
        .$transaction(async (transaction) => {
          const animal = await transaction.animal.create({
            data: this.createData(input),
            select: ANIMAL_SELECT,
          });
          if (
            (input.tipoEntrada === 'COMPRA_OLHO' ||
              input.tipoEntrada === 'COMPRA_KILO') &&
            input.valorCompra !== null &&
            input.valorCompra > 0
          ) {
            await transaction.caixa.create({
              data: {
                fazendaId: input.fazendaId,
                registradoPorId: input.registradoPorId,
                descricao: `Compra do animal ${input.numeroBrinco ?? animal.id}`,
                valor: input.valorCompra,
                operacao: 'SAIDA',
                dataOperacao: dateOnly(input.dataEntrada),
                observacao: `animalId=${animal.id}`,
                ativo: true,
              },
            });
          }
          return toAnimal(animal);
        });
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          'earTagAlreadyExists',
          'Já existe um animal com este brinco na fazenda.',
          undefined,
          error,
        );
      }
      throw error;
    }
  }

  async update(
    id: number,
    fazendaId: number,
    input: UpdateAnimalRecord,
  ): Promise<AnimalView> {
    try {
      const result = await this.tenantPrisma.getClient().animal.updateMany({
        where: { id, fazendaId, ativo: true },
        data: this.updateData(input),
      });
      if (result.count !== 1) {
        throw new DomainError('animalNotFound', 'Animal não encontrado.');
      }
      return await this.requireAnimal(id, fazendaId, true);
    } catch (error: unknown) {
      if (isUniqueViolation(error)) {
        throw new DomainError(
          'earTagAlreadyExists',
          'Já existe um animal com este brinco na fazenda.',
          undefined,
          error,
        );
      }
      throw error;
    }
  }

  async deactivate(id: number, fazendaId: number): Promise<AnimalView> {
    const result = await this.tenantPrisma.getClient().animal.updateMany({
      where: { id, fazendaId, ativo: true },
      data: { ativo: false },
    });
    if (result.count !== 1) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
    return await this.requireAnimal(id, fazendaId, false);
  }

  private createData(
    input: CreateAnimalRecord,
  ): Prisma.AnimalUncheckedCreateInput {
    return {
      fazendaId: input.fazendaId,
      loteId: input.loteId,
      racaId: input.racaId,
      pastoId: input.pastoId,
      clienteId: input.clienteId,
      nome: input.nome,
      numeroBrinco: input.numeroBrinco,
      sexo: input.sexo,
      status: input.status,
      tipoEntrada: input.tipoEntrada,
      nascimento: input.nascimento ? dateOnly(input.nascimento) : null,
      dataEntrada: dateOnly(input.dataEntrada),
      pesoEntrada: input.pesoEntrada,
      pesoAtual: input.pesoAtual,
      precoKilo: input.precoKilo,
      valorCompra: input.valorCompra,
      valorCustoTotal: input.valorCustoTotal,
      matriz: input.matriz,
      castrado: input.castrado,
      observacao: input.observacao,
      ativo: true,
    };
  }

  private updateData(
    input: UpdateAnimalRecord,
  ): Prisma.AnimalUpdateManyMutationInput {
    return {
      ...(input.loteId !== undefined ? { loteId: input.loteId } : {}),
      ...(input.racaId !== undefined ? { racaId: input.racaId } : {}),
      ...(input.pastoId !== undefined ? { pastoId: input.pastoId } : {}),
      ...(input.clienteId !== undefined ? { clienteId: input.clienteId } : {}),
      ...(input.nome !== undefined ? { nome: input.nome } : {}),
      ...(input.numeroBrinco !== undefined
        ? { numeroBrinco: input.numeroBrinco }
        : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.pesoAtual !== undefined ? { pesoAtual: input.pesoAtual } : {}),
    };
  }

  private async requireAnimal(
    id: number,
    fazendaId: number,
    ativo: boolean,
  ): Promise<AnimalView> {
    const value = await this.tenantPrisma.getClient().animal.findFirst({
      where: { id, fazendaId, ativo },
      select: ANIMAL_SELECT,
    });
    if (!value) {
      throw new DomainError('animalNotFound', 'Animal não encontrado.');
    }
    return toAnimal(value);
  }
}
