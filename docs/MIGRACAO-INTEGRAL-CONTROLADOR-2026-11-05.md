Versão do documento: 0.1.0-alpha.5

# Conclusão da migração estrutural do controlador

Esta etapa complementa `MIGRACAO-CONTROLADOR-E-UI-2026-11-05.md` e encerra a pendência de decomposição do controlador. Alterações locais, sem publicação nesta solicitação.

## Resultado

`src/finance/workspace.tsx` passou de 3.037 para 37 linhas. O arquivo agora verifica acesso, prepara a sincronização, cria a sessão e garante descarte em caso de erro. Não mantém estado financeiro, renderers, formulários, listeners, cálculos, persistência ou implementações de serviços dentro de uma grande closure.

As responsabilidades restantes foram distribuídas em módulos TypeScript/TSX com contratos explícitos. São 30 factories de domínio, 169 funções e 29 inicializadores nomeados. Os comandos de lançamentos, dívidas, metas, divisões e CSV extraídos na etapa anterior continuam em `src/finance/controllers`.

| Camada / arquivos em `src/finance/session` | Responsabilidade |
| --- | --- |
| `assembly.ts` | Composição dos métodos e ordem explícita de inicialização; sem implementações financeiras |
| `contracts.ts`, `state.ts` | Estado e portas tipadas da sessão; dependências dos módulos limitadas por `Pick`; resultados das factories verificados com `satisfies` |
| `scope.ts`, `lease.ts`, `teardown.ts` | Propriedade e descarte de recursos; compartilhamento do startup entre efeitos React; liberação dos bloqueios de apresentação |
| `primitives.tsx`, `persistence.tsx`, `selectors.tsx` | Valores/datas/categorias, hidratação e recuperação, conversão monetária, snapshot, transação, rollback, persistência e seleção de dados |
| `navigation.tsx`, `navigation-events.tsx`, `actions.tsx`, `entry-sheet.tsx`, `entry-fields.tsx` | Rotas, dispatcher, menus e formulários de lançamentos; sem criar um segundo sistema de controles |
| `purchases.tsx`, `purchase-form.tsx`, `offer-search.tsx` | Validação, simulação e confirmação de compra, formulário e pesquisa de ofertas |
| `splits.tsx`, `split-form.tsx`, `split-chart.tsx`, `csv-preview.tsx` | Apresentação/comandos das divisões, pagamentos e importação revisada |
| `charts.tsx`, `calendar.tsx`, `reports.tsx`, `behavior.tsx`, `summary.tsx`, `exports.tsx` | Gráficos, agenda, relatórios, comportamento, ordenação e exportação |
| `profile.tsx`, `settings.tsx`, `account-events.tsx`, `profile-events.tsx`, `account-overlay.tsx`, `username.tsx` | Perfil, configurações, identidade e overlays |
| `notifications.tsx`, `synchronization.tsx`, `incoming-debt.tsx`, `receipt.tsx` | Notificações e social, hooks de sincronização, dívida recebida e leitura de recibo |
| `contexts.tsx`, `services.tsx`, `completion.tsx`, `feedback.tsx`, `appearance.tsx` | Adaptadores tipados, registro dos serviços, finalização, mensagens e tema |

As views React e os cálculos compartilhados permanecem nos módulos já existentes. A migração não substitui o design, o armazenamento por outro formato ou a arquitetura de hooks dos componentes consumidores.

## Correções de arquitetura e ciclo de vida

| Problema / causa anterior | Implementação e prevenção |
| --- | --- |
| Eventos globais e polling eram instalados sem um proprietário que pudesse encerrá-los | `SessionScope` registra e remove listeners, intervalos e timeouts. A assinatura `subscribeFinance` também retorna ao scope seu descarte |
| Startup podia sobreviver ao consumidor ou ser repetido incorretamente após desmontagem | `createSessionLease` compartilha uma inicialização entre consumidores, tolera replay de efeitos React e descarta após o último consumidor. Uma nova sessão aguarda a retirada da anterior, inclusive quando ainda está iniciando |
| Falha no meio da inicialização deixava serviços e eventos parcialmente registrados | A entrada envolve a composição em try/catch, encerra o scope e restaura o registry anterior. Descritores dos aliases de compatibilidade também são restaurados |
| Callbacks de uma sessão encerrada podiam afetar uma nova | Publicações têm uma geração de registro; microtasks antigas são ignoradas. Pesquisa combina timeout e AbortSignal da sessão. Formulários assíncronos/social verificam encerramento, OCR invalida a geração e encerra o worker |
| Raízes React secundárias e bloqueios de overlays não tinham descarte conjunto | O renderer da sessão registra seus targets; `disposeViews` desmonta as raízes que pertencem a ela. Teardown fecha overlays e libera overflow/inert sem apagar registros |
| Domínios publicavam por `globalThis.planFinanceChanged` | Passam a importar `requestFinancePublish`, com batching de microtasks no módulo financeiro. Os aliases globais são apenas compatibilidade pública, sem implementar outra lógica financeira |
| Exports poderiam conservar URLs temporárias após cancelar seus timers | O scope também controla URLs de Blob e as revoga no descarte |
| Dependências importadas/desestruturadas sem consumidor acumulavam ruído | Removidos 85 bindings sem uso, incluindo imports React desnecessários com JSX automático. `noUnusedLocals` foi ativado no TypeScript |
| Wrappers CSV antigos só existiam para fixtures | Eliminados os wrappers sem consumidor do runtime; testes leem diretamente as funções reais do módulo CSV |

O serviço de sincronização de conta mantém seu próprio ciclo de vida fora do controlador. Ao encerrar uma sessão, seus hooks deixam de guardar referências à sessão e não aplicam dados sobre uma interface desmontada. Não se interrompe uma gravação financeira de conta apenas por fechar um overlay.

## Segurança funcional

- Chaves persistidas, formato dos dados, categorias canônicas e comportamento de meses encerrados preservados.
- Transações, rollback e comparação de versões de armazenamento continuam concentrados em uma implementação; não há cópia financeira para o caminho antigo.
- Getters dos contextos continuam lendo o estado atual após restauração/substituição, evitando referências antigas de arrays e metas.
- Compatibilidade `window.planTaxes`, `planCredit`, `planMobile` e demais aliases preservada para integrações existentes; aponta para o registry atual e não contém o controlador antigo.
- Sem alteração de paleta, espaçamentos, classes visuais, posições ou geometria nesta etapa estrutural. A correção de imagem opcional de produto usa string vazia quando não há imagem, evitando inserir `undefined` no campo.

## Verificação

- Suíte financeira/arquitetural com 46 scripts; novos testes cobrem propriedade de recursos, abort, descarte idempotente, replay de efeitos, reinicialização pendente e retry após falha.
- Teste de navegador da sessão real cobre falha parcial, restauração do registry, listener único após reinício, persistência de entrada/gasto, liberação de overlays, abort de pesquisa e rejeição de escrita depois do encerramento.
- TypeScript estrito com `noUnusedLocals`, build, verificação de release, auditoria CSS e orçamento de bundles.
- O chunk `app` passou de 87.838 para 93.033 bytes gzip na comparação local (+5.195 bytes), permanecendo dentro do orçamento. A decomposição introduz contratos de sessão e descarte; não foi medida uma melhora de LCP ou CPU apenas por separar os arquivos.
- Fixtures VM antigos foram adaptados para ler os módulos reais por AST. O mapa contém somente ordem e bindings; não guarda uma cópia da implementação financeira. A formatação das fontes deixa de determinar o comportamento desses testes.
- Evidências finais da comparação visual e das regressões de navegador são registradas em `VALIDACAO-MIGRACAO-INTEGRAL-2026-11-05.json`.
- Comparação concluída: **200 cenários iguais**, zero diferenças e zero falhas, em 320/1440 px e claro/escuro. Inclui todas as áreas financeiras, formulários fechados/expandidos, seleções, calendários, notificações, pesquisa, perfil, configurações e login. A comparação automatizada verifica conteúdo, geometria e estilos computados; capturas foram geradas, sem afirmar comparação pixel a pixel integral.

## Limites

A migração estrutural do controlador foi concluída. O projeto continua usando seu registry e os adaptadores React de apresentação existentes; reescrever toda a aplicação em outro gerenciador de estado seria uma mudança distinta. Ativação de provedores externos, credenciais e validação em iPhone/WebKit físico também não são consequência automática desta refatoração.
