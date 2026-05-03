export interface CurrentUserData {
    id: number;
    email: string;
    nome: string;
    admin: boolean;
    suporte: boolean;
    fazendaId: number;
    permissoes: Record<string, boolean>;
}
export declare const CurrentUser: (...dataOrPipes: (import("@nestjs/common").PipeTransform<any, any> | import("@nestjs/common").Type<import("@nestjs/common").PipeTransform<any, any>> | keyof CurrentUserData | undefined)[]) => ParameterDecorator;
