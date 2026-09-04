import { CreateOrganizacaoDto } from './create-organizacao.dto';
import { OrganizacaoStatus } from '@prisma/client-admin';
declare const UpdateOrganizacaoDto_base: import("@nestjs/common").Type<Partial<CreateOrganizacaoDto>>;
export declare class UpdateOrganizacaoDto extends UpdateOrganizacaoDto_base {
    status?: OrganizacaoStatus;
}
export {};
