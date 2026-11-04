# Migração estrutural e padronização global

## Estrutura implementada

- `src/services/finance-runtime.ts`: API de comandos financeira e snapshots estáveis por revisão. Componentes importam módulos; não acessam mais `window.plan*`. Snapshots são cópias isoladas, sem expor referências mutáveis dos registros canônicos.
- `src/services/use-finance.ts`: assinatura React via useSyncExternalStore para cartões, impostos, metas de produtos e meta geral. Atualizações são publicadas após persistência e mudanças de contexto; publicações do mesmo turno são agrupadas. Não há segunda base financeira.
- `src/types/finance-runtime.ts`: contratos dos comandos e modelos financeiros.
- `src/finance/calculations.js`: cálculos de orçamento, projeção, dívida, meta e parcelamento com dependências explícitas, sem DOM ou persistência. Verificação de tipos ativada por @ts-check e contratos em `src/types/calculations.ts`.
- `src/finance/views/`: apresentações separadas por Resumo, Compromissos, Planejamento, Análises, Investimentos e Conta. Recebem dependências atuais a cada renderização; não capturam cópias antigas do orçamento.
- `src/services/legacy-finance-adapter.ts`: compatibilidade dos nomes públicos anteriores, apontando para as mesmas implementações. Os componentes React não dependem desse adaptador.
- Auth e sincronização exportam os objetos canônicos por módulos. Identidade, revisão, backups, fechamentos e armazenamento existentes foram preservados.

O aplicativo permanece React/Vite. O controlador de comandos e o adaptador de templates continuam em JavaScript: a separação estrutural não é uma conversão integral da sintaxe para TypeScript/JSX. Não se introduziram any, ts-ignore ou ts-nocheck para declarar tipagem completa artificialmente. Cálculos centrais e contratos novos são verificados, mas checkJs global não foi habilitado para todos os componentes legados.

## Design global

- `src/styles/design-tokens.css` concentra espaçamento, tipografia, dimensões de controles e raios. As paletas e os materiais de vidro continuam em layout-preferences.js.
- 722 ocorrências de espaçamento passaram a referenciar os tokens globais. Botões e campos reutilizam tokens de altura e padding; fontes reaproveitam a família já configurada pela biblioteca.
- 263 declarações CSS sobrescritas pelo mesmo seletor, na mesma condição/camada, foram removidas. Não se compararam seletores de especificidades diferentes nem regras de arquivos diferentes.
- Os usos de !important passaram de 622 para 618. Os restantes são preservados como compatibilidade de cascata/controles, não ocultados em outro arquivo ou transformados em especificidade artificial. A padronização não significa remover todos os !important indiscriminadamente.
- `scripts/consolidate-styles.mjs --check` detecta novas duplicações desse tipo. `--write` efetua a consolidação. PostCSS é dependência direta da ferramenta.
- CI executa check:styles e uma guarda arquitetural que bloqueia acessos globais nos componentes, dependências de DOM/persistência nos cálculos e crescimento não revisado do orçamento de sobrescritas.

## Integridade corrigida durante a migração

A criação de gasto pela API de impostos não devolvia sua categoria. Isso contrariava o contrato de FinancialExpense e podia produzir um fingerprint local diferente do gasto canônico. O retorno agora inclui category; o navegador verifica o contrato e que salvar/confirmar compras não duplica registros.

## Evidências

- Suíte completa Node, tipos, build e release passaram.
- Novos testes verificam identidade dos snapshots, invalidação por revisão, cancelamento de assinaturas e identidade do adaptador de compatibilidade.
- Browser verifica a API modular real, categoria do novo gasto, meta geral, soma exata de parcelas e limite comprometido após confirmação de compra.
- Notificações, preferências, retry do login, formulários expandidos e teclado simulado passaram novamente em Chromium.
- Matriz global: 11 áreas × 3 larguras (320/768/1440 px) × 2 temas = 66 casos, sem overflow. A comparação antes/depois da consolidação apresentou 66 resultados computados idênticos. Uma captura posterior apresentou somente uma transição assíncrona de Investimentos entre “Consultando…” e “Atualizar”; as propriedades geométricas/tipográficas compartilhadas permaneceram iguais. Não se confunde esse estado de rede com uma regressão de CSS.
- tests/design-system.browser.cjs está no CI e pode exportar um snapshot com DESIGN_SNAPSHOT_PATH. Os snapshots locais usados na comparação ficaram em /tmp; não foram incorporados como baselines dependentes da data.
- Os testes financeiros em VM carregam as mesmas funções dos módulos por tests/controller-source.cjs; os testes de navegador verificam as importações ESM e a injeção de dependências reais.

## Limites operacionais

Sem execução do workflow no GitHub até a publicação. Não foram usados Google, IBPT ou Open Finance reais, não houve migração SQL nem teste em aparelho iOS físico. Não há certificação de contraste para qualquer conteúdo arbitrário, benchmark de produção ou promessa de ausência universal de bugs.
