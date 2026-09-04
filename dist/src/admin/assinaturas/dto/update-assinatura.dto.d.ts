import { CreateAssinaturaDto } from './create-assinatura.dto';
import { AssinaturaStatus } from '@prisma/client-admin';
declare const UpdateAssinaturaDto_base: import("@nestjs/common").Type<Partial<CreateAssinaturaDto>>;
export declare class UpdateAssinaturaDto extends UpdateAssinaturaDto_base {
    status?: AssinaturaStatus;
}
export {};
