# Plano Mestre e Arquitetura - Projeto Gado

Este documento foi gerado para contextualizar qualquer desenvolvedor ou Inteligência Artificial sobre o estado atual dos repositórios e o plano de ação para a migração do sistema legado para a nova stack.

---

## 1. Arquitetura Atual e Repositórios

*   **`gado-api` (Produção - Back-end):** API em Node.js, NestJS e Prisma (PostgreSQL). Módulos de negócio criados: `admin`, `animais`, `auth`, `caixa`, `clientes`, `custos`, `dashboard`, `fazendas`, `financeiro`, `lotes`, `manejo`, `pastos`, `racas`, `vacinacao`, `vendas`.
*   **`gado-web` (Produção - Front-end):** React, Vite, Tailwind CSS, Radix UI. Possui rotas Iniciais para `/login`, `/admin/dashboard`, `/app/dashboard`, `/app/mapa`, `/app/animais`.
*   **`gado-front-end` (Legado - Operacional):** HTML estático do Bootstrap Studio contendo as telas antigas da gestão da fazenda (animais, lotes, caixa, pastos, etc). Servirá apenas de referência visual.
*   **`gado-painel-financeiro-front-end` (Legado - SaaS):** HTML estático focado na venda do software, planos, mensalidades e gestão administrativa. Apenas referência visual.

---

## 2. Padrão de Qualidade UX/UI para o `gado-web`

*   **Design System:** Tailwind CSS estrito para consistência.
*   **Acessibilidade/Componentes:** Radix UI (modais, dropdowns).
*   **Validação:** Zod + React Hook Form (feedback visual de erros).
*   **Micro-interações:** Spinners, Toasts, Skeletons durante loadings.
*   **Gráficos:** Recharts para visualização de dados financeiros e zootécnicos.

---

## 3. Fases de Migração (Telas HTML Legadas ➔ React `gado-web`)

### Fase 1: Identidade e Acesso (Módulo Auth)
*   **Telas:** Login, Registro.
*   **API:** `auth`, `tenant`.
*   **Objetivo:** Layout dividido com imagem premium, formulários validados.

### Fase 2: SaaS e Painel Administrativo (Módulo Admin)
*   **Telas:** Dashboard SaaS, Planos, Mensalidades, Fazendas (Clientes), Usuários.
*   **API:** `admin`, `financeiro`, `tenant`, `dashboard`.
*   **Objetivo:** Recriar as telas do `gado-painel-financeiro-front-end`. Cards de pricing interativos, tabelas de status de pagamento (tags: pago, pendente).

### Fase 3: Operacional - Rebanho e Manejo (Módulo Fazenda)
*   **Telas:** Animais, Lotes, Pastos, Raças, Manejo, Vacinação.
*   **API:** `animais`, `lotes`, `pastos`, `racas`, `manejo`, `vacinacao`.
*   **Objetivo:** Recriar telas do `gado-front-end`. Slide-over para prontuário de animal, drag-and-drop para mover entre lotes, mapas via Leaflet integrados com pastos.

### Fase 4: Operacional - Financeiro e Logística
*   **Telas:** Caixa, Custos, Venda de Animais, Clientes/Parceiros.
*   **API:** `caixa`, `custos`, `financeiro`, `vendas`, `clientes`.
*   **Objetivo:** Dashboards financeiros dinâmicos (Recharts), entrada e saída de caixa com UX simplificada.

---

## Próximos Passos (Instrução para a IA)
A partir deste documento, a IA deve perguntar ao usuário qual Fase deve ser iniciada, criar os componentes React correspondentes no projeto `gado-web`, estilizando com Tailwind CSS e Radix UI, e fazendo a ponte com os endpoints adequados na `gado-api`.
