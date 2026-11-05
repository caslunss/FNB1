# Regras de manutenção do TEFinance

Antes de modificar a interface, leia `docs/GUIA-DE-LAYOUT.md`. Esse é o contrato visual deste projeto, solicitado pelo usuário. Atualize o guia quando uma mudança de padrão for explicitamente aprovada.

- Preserve a paleta escolhida, o Liquid Glass existente e as funções financeiras.
- Reutilize os componentes de `src/components/LiquidControls.tsx`; não crie um segundo sistema de botões, menus, campos ou cards.
- Componentes compartilhados devem funcionar tanto em `#app` quanto em `.account-panel-body`. Não restrinja o acabamento dos formulários apenas à página principal.
- Valide estados fechados e expandidos, menus sobre gráficos, claro/escuro e telas pequenas. Texto e controles devem permanecer dentro da superfície correspondente.
- Simplifique textos sem remover unidades, consequências, informações de privacidade, confirmação de exclusão ou regras financeiras necessárias.
- As categorias canônicas são as cinco do guia. Só mude chaves persistidas com pedido explícito e migração compatível, com backup e testes de totais. Nunca descarte categorias antigas durante uma atualização.
- Faça as verificações proporcionais à alteração e descreva o que foi realmente testado. Não prometa ausência universal de bugs.

## Versioning (permanent)

- Scheme: SemVer with pre-release channel. Current: 0.1.0-alpha.1 (first alpha).
- Single source of truth: src/version.ts. package.json "version" and the root version fields of the lockfile must match it; CHANGELOG.md top entry must match it.
- Every task that changes behavior must add an entry to CHANGELOG.md (pt-BR, Keep a Changelog style). Never create git tags, never push.
- Only the owner decides to bump the version.

## Current project facts (updated)

- Calendar lives at the TOP of the app (not in the dock). Dock styles: pinned/default/mini via dockStyle in plan12layout_v1. Glass values are fixed at defaults. Settings is a grouped menu with sub-screens (src/components/settings/).
- No lint script exists. Use: tsc strict, npm test, check:styles, build, check:release/build-budget, Playwright local only (127.0.0.1).
- Several older E2E scripts reference removed Settings tabs and may fail for that reason (known, not caused by cleanup). Never edit them without explicit owner authorization.
- Reports (AUDIT_REPORT.md, CLEANUP_REPORT.md, FEATURE_REPORT.md) are git-ignored. Never commit them.
