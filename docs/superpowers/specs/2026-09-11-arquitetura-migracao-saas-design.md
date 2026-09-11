# Arquitetura da Migração Legado para Gado SaaS

**Status:** aprovado conceitualmente em 2026-09-11

**Escopo:** `gado`, `gado-painel-financeiro-back`, `gado-front-end`, `gado-painel-financeiro-front-end`, `gado-api` e `gado-web`

**Objetivo:** consolidar as capacidades legadas em uma arquitetura SaaS multi-tenant, testável, versionada e dividida entre operação da fazenda e administração interna do produto.

---

## 1. Decisões aprovadas

1. O backend continuará sendo um único `gado-api`, organizado como monólito modular.
2. O frontend continuará em um único repositório `gado-web`, mas produzirá duas aplicações e dois deploys independentes:
   - `gado-app`: operação da fazenda e autosserviço do cliente proprietário;
   - `gado-admin`: administração interna do SaaS, acessível somente à equipe do produto.
3. Proprietários e demais usuários dos clientes não acessarão o `gado-admin`.
4. O onboarding de um novo cliente provisionará automaticamente toda a infraestrutura necessária, inclusive schema, migrations, dados-base, proprietário e fazenda principal.
5. Nenhuma funcionalidade será considerada migrada apenas porque existe uma tabela, pasta, controller ou tela. A migração exige regra funcional, isolamento, autorização, testes e interface utilizável.

### 1.1 Alternativas consideradas

| Alternativa | Benefícios | Custos/riscos | Decisão |
|---|---|---|---|
| Um repositório frontend com dois apps | Compartilha design system e contratos, preserva deploys e bundles separados | Exige configurar workspace e limites de importação | Escolhida |
| Dois repositórios frontend independentes | Isolamento organizacional máximo | Duplica configuração, componentes e evolução de contratos | Rejeitada nesta fase |
| Uma única SPA com rotas por perfil | Menor mudança inicial | Mistura públicos, bundles e ciclos de deploy; aumenta risco operacional | Rejeitada |

Para o backend, foram considerados monólito modular e serviços independentes. O monólito modular foi escolhido porque preserva transações de negócio, simplifica o provisionamento e permite consolidar contratos antes de introduzir custos distribuídos. As fronteiras serão explícitas para possibilitar extração futura se escala, equipe ou disponibilidade exigirem.

## 2. Resultado da varredura

### 2.1 Repositórios encontrados

| Projeto | Papel atual | Stack | Situação |
|---|---|---|---|
| `gado` | Backend operacional legado | Express, Sequelize, PostgreSQL | Referência de comportamento e dados |
| `gado-front-end` | Frontend operacional legado | HTML, Bootstrap, jQuery | Referência de fluxos e telas |
| `gado-painel-financeiro-back` | Backend SaaS/financeiro legado | Express, Sequelize, PostgreSQL | Referência de contratos, tenants e cobrança |
| `gado-painel-financeiro-front-end` | Painel SaaS legado | HTML, Bootstrap, jQuery | Referência das operações internas |
| `gado-api` | Backend-alvo | NestJS, Prisma, PostgreSQL | Estrutura ampla, implementação parcial |
| `gado-web` | Frontend-alvo | React, Vite, TypeScript, Tailwind | Protótipo inicial |

Não existe uma pasta chamada `gado-financeiro-back`. A análise considera `gado-painel-financeiro-back` como o backend financeiro citado no pedido.

### 2.2 Critério de maturidade

| Estado | Significado |
|---|---|
| Migrado | Backend, frontend, regras, autorização, isolamento e testes de aceite concluídos |
| Parcial | Há implementação, mas falta paridade, segurança, contrato, teste ou tela |
| Esqueleto | Há model/module/service, mas nenhuma API utilizável |
| Ausente | A capacidade legada ainda não possui implementação equivalente |

No estado atual, nenhum módulo de ponta a ponta atende ao critério completo de “Migrado”.

## 3. Inventário operacional legado e cobertura atual

| Capacidade legada | Evidência principal | Estado no `gado-api` | Estado no `gado-web` | Lacuna determinante |
|---|---|---|---|---|
| Login e seleção de fazenda | `RouteUsuarios.js`, `fazendas_selecionar.html` | Parcial | Login simulado; seletor ausente | `LoginDto` não aceita seleção; sessão e rotas não são protegidas |
| Animais | `RouteAnimais.js`, `animais.html` | Parcial | Lista/criação parcial | DTO legado, modelo Prisma e payload React usam nomes incompatíveis |
| Raças | `RouteRacas.js`, `racas.html` | Parcial | Ausente | Falta tela, contrato paginado e testes |
| Lotes | `RouteLotes.js`, `lotes.html` | Parcial | Ausente | Falta tela, regras de exclusão e testes |
| Pastos | `RoutePastos.js`, `pastos.html` | Parcial | Lista/criação com mapa | Falta edição, exclusão, autorização e validação geográfica |
| Pesagens/Kilos | `RouteKilos.js`, `kilos.html` | Ausente; apenas model `Pesagem` | Ausente | Não há módulo, controller, service ou DTO |
| Manejo reprodutivo | `RouteManejoReproducao.js`, `manejo.html` | Parcial | Ausente | DTO usa campos legados sem mapeamento; regras de sexo e ciclo não existem |
| Vacinação | `RouteVacinacao.js` e scripts JS | Parcial | Ausente | DTO incompatível com Prisma; não há calendário nem alertas reais |
| Fotos | `RouteFotos.js` | Parcial | Ausente | CRUD genérico não resolve upload, armazenamento ou autorização |
| Movimentação entre pastos | `RouteMovimentoAnimalPasto.js` | Parcial e defeituoso | Ausente | Delegate Prisma incorreto e ausência de transação que atualize o animal |
| Movimentação entre lotes | `RouteMovimentoLote.js` | Parcial | Ausente | Registra histórico, mas não atualiza lote atual de forma atômica |
| Clientes/Parceiros | `RouteClientes.js`, `parceiros.html` | Parcial | Ausente | Campos incompatíveis, e-mail ausente no DTO e escopo de compartilhamento não explicitado |
| Categorias de custo | `RouteCustosTipo.js`, `custos_tipo.html` | Parcial | Ausente | API nova só cria e lista; faltam detalhe, edição e exclusão |
| Custos e rateio por animal | `RouteCustos.js`, `ControllerCustoAnimais.js` | Parcial | Ausente | Falta transação, edição, estorno e integração contábil consistente |
| Venda e itens por animal | `RouteVendaAnimal.js`, `ControllerVendaAnimais.js` | Parcial | Ausente | Falta transação, edição/estorno e lançamento financeiro atômico |
| Caixa | `RouteCaixa.js`, `caixa.html` | Parcial | Ausente | DTO incompatível; saldo soma valores sem considerar entrada/saída |
| Dashboard operacional | `RouteDashboard.js`, `index.html` | Parcial | Parcial | Custo por categoria retorna vazio; alertas são mockados; métricas divergem |
| Usuários da fazenda | `RouteUsuariosFazenda.js`, `usuarios.html` | Ausente; apenas models RBAC | Ausente | Sem convites, CRUD, vínculos, bloqueio ou atribuição de perfil |
| Cadastro público | `registrar_usuario.html` | Ausente para e-mail; OAuth parcial | Ausente | Não há fluxo completo de criação/provisionamento por e-mail |
| Transferência entre fazendas | inexistente no operacional antigo; proposta nova | Parcial | Ausente | Precisa validar destino, catálogos, histórico e transação com testes |

### 3.1 Regras legadas que não podem desaparecer

O legado não contém apenas CRUD. Há efeitos cruzados que precisam virar casos de uso transacionais explícitos:

- compra/cadastro de animal gera saída financeira;
- custo gera rateio por animal e saída de caixa;
- cancelamento de custo gera estorno;
- venda altera o status dos animais, calcula custo/lucro e gera entrada;
- cancelamento de venda reverte status e financeiro;
- movimentação registra origem e destino e altera a posição atual do animal;
- exclusões relevantes verificam dependências antes de serem aceitas;
- baixa de mensalidade reativa e estende o acesso da organização.

Essas regras estão acopladas entre controllers no legado e estão ausentes ou não atômicas no novo backend. A arquitetura nova as implementará como casos de uso transacionais, não como chamadas laterais entre controllers.

## 4. Inventário SaaS legado e cobertura atual

| Capacidade legada | Destino | Estado atual | Lacuna determinante |
|---|---|---|---|
| Login do administrador | `gado-admin` + `AdminAuthModule` | Parcial | Rotas administrativas não estão protegidas por guard próprio |
| Cadastro/contrato de cliente | Cadastro público do `gado-app` + provisionamento | Parcial via Google | Cadastro por e-mail e workflow idempotente ausentes |
| Organizações/clientes | `gado-admin` | Parcial | Provisionamento atual cria schema sem migrations confiáveis e ignora falhas |
| Planos | `gado-admin` | Parcial | Falta versionamento de benefícios/limites e testes |
| Assinaturas | `gado-admin`; resumo no autosserviço | Parcial | Falta ciclo completo, troca de plano e política de vencimento |
| Mensalidades/pagamentos | `gado-admin`; consulta no autosserviço | Parcial | Model e baixa existem, mas não há módulo/API completa de pagamentos |
| Bloqueio/desbloqueio | `gado-admin` | Parcial | Status de organização e registry podem divergir; cache/invalidação não está implementado como documentado |
| Usuários administrativos | `gado-admin` | Parcial | CRUD existe, mas endpoints estão expostos sem `AdminGuard` |
| Usuários e acessos da organização | Autosserviço do `gado-app` | Ausente | Models existem; convites, aceite, revogação e limites do plano não existem |
| Dashboard SaaS | `gado-admin` | Ausente | Tela atual usa KPIs e assinaturas mockadas; backend não tem agregações SaaS |
| Indicador CEPEA/boi gordo | `gado-app` operacional | Ausente | Integração externa legada não foi migrada; deve usar adapter, cache e fallback |
| E-mail de onboarding | Serviço de notificações | Ausente | O Nodemailer legado não possui equivalente novo |
| Reset/criação de banco | `TenantProvisioningModule` | Deve ser substituído | Endpoint destrutivo legado não será migrado; migrations versionadas assumem seu papel |

## 5. Lacunas estruturais encontradas

### 5.1 Segurança

- `AnimaisController`, `PastosController` e `DashboardController` estão com autenticação comentada.
- A matriz de RBAC existe, mas nenhum controller usa `@RequirePermissions`.
- Os controllers administrativos não possuem `AdminGuard` efetivo.
- O frontend não possui route guards, renovação/expiração de sessão ou interceptador HTTP central.
- As chamadas React não enviam token nem identificação do tenant.
- `TENANT_DEV_MODE` possui fallback permissivo e não pode ficar habilitado fora do ambiente local.

### 5.2 Contratos de API

- DTOs usam nomes legados como `id_lote`, enquanto o Prisma usa `loteId` e o frontend envia `racaId`/`loteId`.
- O `ValidationPipe` rejeita campos extras, portanto várias operações compilam, mas falham em runtime.
- Os módulos simples passam DTOs diretamente ao Prisma e dependem de `any`, ocultando incompatibilidades.
- Não há pacote ou schema único de contratos compartilhado com o frontend.

### 5.3 Persistência e isolamento

- Não existe diretório `prisma/migrations`; o estado do banco não é reproduzível por versão.
- O provisionamento social marca o tenant como ativo antes de concluir toda a infraestrutura.
- A cópia de tabelas do schema `public` não substitui migrations e pode omitir objetos e alterações futuras.
- A reescrita textual de SQL para trocar schemas é frágil e exige testes de isolamento em todas as operações Prisma.
- O pool permite até 50 clients de tenant com até 5 conexões cada; os limites deverão ser medidos contra a capacidade real do PostgreSQL/Neon.
- `Raca`, `Cliente`, `CategoriaCusto` e `Fornecedor` são compartilhados por organização, enquanto entidades operacionais usam `fazendaId`. Esta será uma decisão explícita de catálogo organizacional.

### 5.4 Qualidade e operação

- O backend possui 12 testes unitários em apenas dois arquivos.
- Existem testes E2E de tenant, RBAC e transferência, mas eles não fazem parte do ciclo unitário padrão e exigem ambiente controlado.
- Treze módulos de suprimentos, financeiro avançado e frota têm controllers vazios.
- Não há pipeline CI identificado, cobertura mínima, testes de contrato ou smoke test de migration.
- O `gado-web` não possui testes automatizados; o build local está bloqueado por instalação incompleta de dependências.

## 6. Arquitetura frontend-alvo

```text
gado-web/
├── apps/
│   ├── gado-app/                 # cliente: operação + autosserviço
│   └── gado-admin/               # equipe interna do SaaS
├── packages/
│   ├── ui/                       # tokens e componentes visuais reutilizáveis
│   ├── api-client/               # HTTP, autenticação, tenant, erros
│   ├── contracts/                # schemas e tipos gerados/compartilhados
│   ├── auth/                     # sessão, guards e autorização de interface
│   └── config/                   # lint, TypeScript e Tailwind
└── package.json                  # workspace e comandos coordenados
```

### 6.1 `gado-app`

Áreas funcionais:

- autenticação, cadastro, recuperação e seleção de organização/fazenda;
- onboarding inicial da fazenda;
- dashboard e indicadores;
- rebanho, pesagens, manejo, sanidade e movimentações;
- pastos, lotes, raças, mapa e hierarquia de fazendas;
- clientes/parceiros, vendas, custos e caixa;
- equipe, convites, perfis e permissões;
- conta da organização, assinatura e limites contratados.

### 6.2 `gado-admin`

Áreas funcionais:

- autenticação administrativa independente;
- dashboard de MRR, churn, trials, inadimplência e provisionamento;
- organizações e tenants;
- planos e benefícios;
- assinaturas e pagamentos;
- administradores e suporte;
- auditoria e reprocessamento seguro de provisionamentos.

### 6.3 Isolamento de deploy

- `admin.gado.com.br` entrega apenas `gado-admin`.
- `app.gado.com.br` oferece cadastro, seleção e autosserviço.
- Após a seleção, a sessão contém organização, tenant e fazenda autorizados.
- Subdomínios de tenant podem ser usados na web; clientes mobile usam o tenant assinado no token e header validado como transporte auxiliar.
- Separar os builds reduz o risco de publicar componentes administrativos no bundle do cliente, mas a segurança continuará sendo obrigatoriamente garantida pelo backend.

## 7. Arquitetura backend-alvo

```text
src/
├── admin/                 # somente operadores internos
├── account/               # autosserviço da organização cliente
├── identity-access/       # usuários globais, convites e memberships
├── tenant-provisioning/   # lifecycle, migrations, seed e retries
├── fazendas/              # hierarquia e vínculos de acesso
├── rebanho/               # animais, raças, lotes, pesagens e fotos
├── manejo/                # reprodução, sanidade e movimentações
├── comercial/             # clientes e vendas
├── financeiro/            # custos, categorias, caixa e estornos
├── shared/                # erros, IDs, dinheiro, datas e eventos
└── infrastructure/        # Prisma, auth, tenant, logs e integrações
```

O sistema permanecerá um monólito modular. Controllers traduzem HTTP, casos de uso coordenam regras, serviços de domínio preservam invariantes e repositories encapsulam Prisma. Controllers não chamam controllers, e DTOs HTTP não são enviados diretamente ao ORM.

### 7.1 Fronteiras de API

- `/api/v1/admin/*`: somente JWT administrativo e `AdminRole`.
- `/api/v1/account/*`: proprietário/admin da organização cliente.
- `/api/v1/*`: operação da fazenda, protegida por tenant, assinatura, fazenda e RBAC.
- Swagger separado por tags `Admin - ...`, `Conta - ...` e `Operacional - ...`.

## 8. Modelo de dados e normalização

As normalizações já iniciadas serão preservadas:

- array legado `fazendas.id_usuarios` vira `UsuarioFazenda`;
- array legado `custos.id_animais` vira `CustoAnimal`;
- venda por animal vira `Venda` + `ItemVenda`;
- valores `float` viram `Decimal`;
- número de brinco deixa de ser número de ponto flutuante e passa a identificador textual;
- papéis e permissões deixam de ser colunas booleanas por módulo e passam a RBAC normalizado.

Complementos obrigatórios:

- migrations versionadas para `gado_admin` e para o schema tenant;
- constraints de unicidade compostas por escopo de organização/fazenda;
- índices orientados às consultas reais;
- `deletedAt`, `deletedBy` e motivo para exclusões auditáveis relevantes;
- ledger financeiro imutável ou lançamentos com estorno, sem saldo mutável como fonte de verdade;
- `ProvisioningRun` e etapas persistidas no admin;
- outbox para e-mail e outros efeitos externos após commit;
- política explícita de retenção e anonimização.

Catálogos como raças, clientes, categorias e fornecedores serão compartilhados dentro da organização por padrão. Dados de rebanho, caixa, estoque, frota e manejo permanecem vinculados a uma fazenda. Uma alteração de escopo será tratada por caso de uso autorizado, nunca por `fazendaId` arbitrário recebido do cliente.

## 9. Onboarding e provisionamento

### 9.1 Estados

```text
CADASTRADO
  -> PROVISIONANDO_SCHEMA
  -> APLICANDO_MIGRATIONS
  -> CRIANDO_DADOS_BASE
  -> VALIDANDO
  -> ATIVO

Qualquer etapa -> FALHA_PROVISIONAMENTO -> RETENTATIVA
```

### 9.2 Fluxo

1. Validar cadastro, aceite de termos e idempotency key.
2. Criar `UsuarioGlobal` e organização em uma transação administrativa.
3. Criar acesso `PROPRIETARIO`, assinatura Trial e `TenantRegistry` não ativo.
4. Persistir um `ProvisioningRun`.
5. Criar o schema com nome gerado pelo servidor.
6. Aplicar todas as migrations tenant na ordem registrada.
7. Criar permissões, perfis e catálogos-base por operações idempotentes.
8. Criar usuário local, fazenda principal e vínculo `DONO`.
9. Executar smoke queries e validar versão do schema.
10. Marcar tenant e organização como ativos.
11. Publicar evento de onboarding concluído e enviar notificações via outbox.
12. Emitir sessão somente após o estado `ATIVO`.

O endpoint retorna `202 Accepted` quando o provisionamento for assíncrono e fornece uma rota de consulta de status. Retentativas retomam da última etapa confirmada; não recriam recursos já concluídos.

## 10. Autenticação e autorização

Existirão três contextos de identidade:

1. `AdminUser`: operador interno; token administrativo sem acesso implícito a dados de tenant.
2. `UsuarioGlobal`: identidade do cliente e vínculos com organizações.
3. `Usuario`/`UsuarioFazenda`: perfil e papel operacional dentro do tenant.

Ordem de proteção de uma rota operacional:

```text
autenticação -> tenant válido -> assinatura válida -> acesso à organização
-> acesso à fazenda -> permissão do módulo -> caso de uso
```

Tokens administrativos e operacionais terão audiences diferentes. Um token operacional nunca será aceito em `/admin`, mesmo que o usuário seja proprietário. A autorização do frontend apenas controla experiência; toda decisão é refeita no backend.

## 11. Estratégia de testes e definição de pronto

### 11.1 Pirâmide obrigatória

- unitários: invariantes, cálculos, estados e policies sem banco;
- integração: repositories e casos de uso contra PostgreSQL real descartável;
- isolamento: dois tenants e duas fazendas concorrentes em toda operação CRUD;
- contrato: OpenAPI validado contra clientes gerados;
- E2E backend: onboarding, login, seleção, RBAC e fluxos financeiros;
- componentes frontend: formulário, tabela, estados de erro e permissões;
- E2E frontend: jornadas críticas do proprietário e do administrador;
- migrations: banco vazio, upgrade de versão anterior e provisionamento de novo schema.

### 11.2 Um módulo só está migrado quando

- os comportamentos legados aprovados estão catalogados;
- o contrato novo não expõe nomes ou acoplamentos do legado;
- todas as escritas são isoladas por tenant e fazenda;
- RBAC é aplicado e testado para permitir e negar;
- regras com múltiplas escritas usam transação;
- testes unitários, integração, isolamento e E2E críticos passam;
- a tela do destino cobre estados vazio, carregando, erro, sucesso e sem permissão;
- documentação OpenAPI e guia funcional estão atualizados;
- métricas, logs e auditoria permitem diagnosticar falhas;
- existe estratégia de migração e reconciliação dos dados legados.

## 12. Estratégia de migração

A migração seguirá o padrão strangler por capacidade:

1. estabilizar fundações de segurança, contratos, migrations e testes;
2. concluir identidade, onboarding, tenant e autosserviço;
3. migrar um fluxo vertical operacional por vez;
4. executar extração, transformação, carga e reconciliação por tenant;
5. colocar o módulo legado equivalente em modo somente leitura;
6. observar o fluxo novo durante uma janela definida;
7. desativar a rota e a tela legadas somente após aceite e reconciliação.

O primeiro fluxo vertical será autenticação + seleção de fazenda + animais básicos, pois valida sessão, tenant, RBAC, contratos, banco e frontend sem depender de todo o financeiro. O segundo será pesagens, completando uma lacuna integral e habilitando indicadores reais.

## 13. Fora do escopo desta arquitetura

- decomposição prematura em microserviços;
- migração literal da aparência Bootstrap;
- exposição do `gado-admin` a clientes;
- manutenção do endpoint legado de reset destrutivo de banco;
- ativação de módulos novos de suprimentos/frota antes da paridade do núcleo legado;
- escolha de gateway de pagamentos antes de o domínio de billing estar estabilizado.

## 14. Critérios de sucesso do programa

- 100% das capacidades legadas classificadas como migradas, substituídas ou formalmente descontinuadas;
- zero rota administrativa acessível com token operacional ou anonimamente;
- zero leitura ou escrita cruzada entre tenants nos testes de isolamento;
- todos os schemas em uma versão conhecida e atualizável;
- onboarding repetível, observável e recuperável após falha;
- fluxos financeiros reconciliados com o legado por tenant;
- `gado-app` e `gado-admin` implantáveis independentemente;
- legados desligados sem perda de dados nem regressão funcional aceita.
