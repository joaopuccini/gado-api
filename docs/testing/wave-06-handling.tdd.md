# Evidência TDD — Onda 06: manejo, sanidade, fotos e movimentações

Data de início: 2026-09-27

Branch: `feat/wave-06-handling`

Plano: `docs/superpowers/plans/2026-09-27-wave-06-handling.md`

## Task 6.1 — Modelo persistente e migration versionada

### RED — `9ad0835`

Os testes passaram a exigir a versão `202609270002_wave06_handling`, colunas
de auditoria e domínio, constraints de integridade e índices compostos da onda.

Comando:

```powershell
node scripts/run-disposable-database-command.mjs npm run test:migrations -- --runInBand test/migrations/tenant-empty-schema.e2e-spec.ts test/migrations/tenant-upgrade.e2e-spec.ts
```

Resultado observado: 2 suites falharam pela ausência exclusiva da migration
`202609270002_wave06_handling`; a cadeia real terminava em
`202609270001_wave05_weights`. Banco filho
`gado_wave00_test_71c8f7220810` removido pelo runner.

### GREEN — `8816877`

Foi adicionada uma migration imutável e aditiva que:

- protege GeoJSON/área de pastos;
- registra ator e impede origem igual ao destino em movimentos;
- completa a transferência entre fazendas com constraints e FKs de destino;
- modela evento/status/ciclo reprodutivo;
- adiciona protocolo, dose, próxima dose e auditoria à vacinação;
- substitui caminho público por metadados de object storage, preservando
  compatibilidade dos registros legados;
- cria índices alinhados às consultas por fazenda, animal e data.

Gates executados:

```text
prisma format tenant                         PASS
prisma validate tenant                       PASS
prisma generate tenant + admin               PASS
test:migrations --runInBand                   3/3 PASS
lint:check                                    PASS
build                                         PASS
```

O gate completo usou o banco filho
`gado_wave00_test_f07e1a4c39bd`, removido pelo runner após as três suites.
Nenhum `db push`, `migrate reset` ou schema não descartável foi usado.

## Próximo RED

Task 6.2: domínio e ciclo autenticado de pastos, incluindo GeoJSON, permissões,
escopo de fazenda e exclusão protegida por dependências.
