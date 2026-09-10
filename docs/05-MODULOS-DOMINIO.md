# 📦 Módulos de Domínio — Detalhamento

> Detalha cada módulo operacional do tenant: endpoints, DTOs, e regras de negócio.

---

## 1. Animais (`/animais`)

**Módulo principal** — CRUD completo de animais com suporte a transferência entre fazendas.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/animais` | GET | `animais:ler` | Lista animais (filtrados pelo tenant/fazenda) |
| `/animais/:id` | GET | `animais:ler` | Detalhe de um animal |
| `/animais` | POST | `animais:criar` | Cadastra novo animal |
| `/animais/:id` | PATCH | `animais:editar` | Atualiza dados do animal |
| `/animais/:id` | DELETE | `animais:excluir` | Soft delete (ativo=false) |
| `/animais/:id/transferir` | POST | `animais:editar` | Transfere animal entre fazendas |

### Campos principais do Animal:
- `nome`, `brinco`, `sisbov`, `sexo` (MACHO/FEMEA)
- `status` (ATIVO, VENDIDO, MORTO, TRANSFERIDO)
- `dataNascimento`, `pesoAtual`, `pesoEntrada`
- `valorCompra`, `valorCustoTotal`
- Relações: `raca`, `lote`, `pasto`, `fazenda`

---

## 2. Lotes (`/lotes`)

Agrupamento lógico de animais para manejo.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/lotes` | GET | `lotes:ler` | Lista lotes |
| `/lotes` | POST | `lotes:criar` | Cria lote |
| `/lotes/:id` | PATCH | `lotes:editar` | Edita lote |
| `/lotes/:id` | DELETE | `lotes:excluir` | Remove lote |

---

## 3. Pastos (`/pastos`)

Áreas de pastagem com suporte a geolocalização (GeoJSON).

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/pastos` | GET | `pastos:ler` | Lista pastos |
| `/pastos` | POST | `pastos:criar` | Cria pasto |
| `/pastos/:id` | PATCH | `pastos:editar` | Edita pasto |
| `/pastos/:id` | DELETE | `pastos:excluir` | Remove pasto |

### Campos especiais:
- `areaHectares`, `capacidadeUA`, `tipoCapim`
- `geojson` → polygon para exibição no mapa (Leaflet no frontend)

---

## 4. Raças (`/racas`)

Cadastro de raças (Nelore, Angus, Brahman, etc.)

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/racas` | GET | `racas:ler` | Lista raças |
| `/racas` | POST | `racas:criar` | Cria raça |
| `/racas/:id` | PATCH | `racas:editar` | Edita raça |
| `/racas/:id` | DELETE | `racas:excluir` | Remove raça |

---

## 5. Clientes (`/clientes`)

Compradores e parceiros comerciais.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/clientes` | GET | `clientes:ler` | Lista clientes |
| `/clientes` | POST | `clientes:criar` | Cadastra cliente |
| `/clientes/:id` | PATCH | `clientes:editar` | Edita cliente |
| `/clientes/:id` | DELETE | `clientes:excluir` | Remove cliente |

---

## 6. Custos (`/custos`)

Registro de custos operacionais (ração, vacina, manutenção, etc.)

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/custos` | GET | `financeiro:ler` | Lista custos |
| `/custos` | POST | `financeiro:criar` | Registra custo |
| `/custos/:id` | PATCH | `financeiro:editar` | Edita custo |
| `/custos/:id` | DELETE | `financeiro:excluir` | Remove custo |

### Campos principais:
- `descricao`, `valorTotal`, `dataCusto`, `tipo`
- Pode ser vinculado a animal(is) específico(s)

---

## 7. Vendas (`/vendas`)

Registro de vendas com itens (animais vendidos).

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/vendas` | GET | `financeiro:ler` | Lista vendas |
| `/vendas` | POST | `financeiro:criar` | Registra venda |
| `/vendas/:id` | PATCH | `financeiro:editar` | Edita venda |
| `/vendas/:id` | DELETE | `financeiro:excluir` | Remove venda |

### Estrutura:
```
Venda
├── clienteId (comprador)
├── dataVenda
├── valorTotal
└── itens[]  (VendaItem)
    ├── animalId
    ├── peso
    └── valorUnitario
```

Quando o animal é vendido, seu `status` muda para `VENDIDO`.

---

## 8. Caixa (`/caixa`)

Caixa financeiro da fazenda (entrada/saída/ajuste).

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/caixa` | GET | `financeiro:ler` | Lista movimentações |
| `/caixa` | POST | `financeiro:criar` | Registra movimentação |

### Tipos de movimentação:
- `ENTRADA` — dinheiro entrando (venda, empréstimo)
- `SAIDA` — dinheiro saindo (custo, compra)
- `AJUSTE` — correção manual

---

## 9. Vacinação (`/vacinacao`)

Registro de vacinações aplicadas nos animais.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/vacinacao` | GET | `sanidade:ler` | Lista vacinações |
| `/vacinacao` | POST | `sanidade:criar` | Registra vacinação |

---

## 10. Manejo Reprodutivo (`/manejo`)

Controle de reprodução (inseminação, cobertura, diagnóstico gestação).

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/manejo` | GET | `manejo:ler` | Lista manejos |
| `/manejo` | POST | `manejo:criar` | Registra manejo |

---

## 11. Movimentações (`/movimentacoes`)

Movimentação de animais entre pastos e lotes.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/movimentacoes` | GET | `movimentacoes:ler` | Lista movimentações |
| `/movimentacoes/pasto` | POST | `movimentacoes:criar` | Move animal entre pastos |
| `/movimentacoes/lote` | POST | `movimentacoes:criar` | Move animal entre lotes |

---

## 12. Dashboard (`/dashboard`)

Agregações para o painel principal (contadores, financeiro, evolução).

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/dashboard/stats` | GET | `dashboard:ler` | Contadores gerais |
| `/dashboard/macho-femea` | GET | `dashboard:ler` | Distribuição M/F |
| `/dashboard/custo-animais` | GET | `dashboard:ler` | Valor investido em animais |
| `/dashboard/evolucao-peso` | GET | `dashboard:ler` | Evolução de peso mensal |
| `/dashboard/custo-12-meses` | GET | `dashboard:ler` | Custos últimos 12 meses |
| `/dashboard/totais` | GET | `dashboard:ler` | Lotes, pastos, raças, clientes |

### Stats retornados:
```json
{
  "counters": {
    "ativos": 150,
    "vendidos": 30,
    "mortes": 2,
    "lotes": 5,
    "pastos": 8,
    "pesoMedio": "487.50"
  },
  "financeiro": {
    "saldo_caixa": 125000
  }
}
```

---

## 13. Fazendas (`/fazendas`)

CRUD das fazendas dentro do tenant.

| Endpoint | Método | Permissão | Descrição |
|---|---|---|---|
| `/fazendas` | GET | `configuracoes:ler` | Lista fazendas |
| `/fazendas` | POST | `configuracoes:gerenciar` | Cria fazenda |
| `/fazendas/:id` | PATCH | `configuracoes:gerenciar` | Edita fazenda |
| `/fazendas/:id` | DELETE | `configuracoes:gerenciar` | Remove fazenda |

---

## 14. Módulos de Suprimentos

### Almoxarifados (`/almoxarifados`)
Locais de estocagem de insumos.

### Produtos (`/produtos`)
Cadastro de produtos (vacinas, ração, sal, combustível...).

### Fornecedores (`/fornecedores`)
Cadastro de fornecedores.

### Movimento de Estoque (`/movimento-estoque`)
Entrada/saída/ajuste de estoque com rastreabilidade.

### Pedidos de Compra (`/pedidos-compra`)
Pedidos de compra com status (PENDENTE, APROVADO, RECEBIDO, CANCELADO).

---

## 15. Módulos Financeiros Avançados

### Contas Bancárias (`/contas-bancarias`)
Cadastro de contas bancárias da fazenda.

### Contas a Pagar (`/contas-pagar`)
Despesas com data de vencimento, vinculadas a safra e fornecedor.

### Contas a Receber (`/contas-receber`)
Receitas com data de vencimento, vinculadas a safra e cliente.

### Transações Bancárias (`/transacoes-bancarias`)
Registro de transações para conciliação bancária.

### Safras (`/safras`)
Períodos de safra para agrupamento financeiro anual.

---

## 16. Módulos de Frota

### Máquinas (`/maquinas`)
Cadastro de máquinas com controle de horímetro/hodômetro.

### Abastecimentos (`/abastecimentos`)
Registro de abastecimentos com quantidade e custo.

### Manutenções (`/manutencoes`)
Registro de manutenções preventivas e corretivas.
