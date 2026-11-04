# Notificações compactas e botões de Lançamentos

## Mudanças

- NotificationCenter mantém dialog centralizado, vidro, fechamento por X/Escape/backdrop, foco e estado do controlador. Filtros visíveis foram traduzidos para Todas, Transações e Alertas. Textos de agrupamento e estados reais já eram em português e foram preservados. Não se adicionaram transações fictícias.
- Largura máxima reduzida de 560 para 400 px; limite vertical de 640 px ou altura disponível da tela. Cards usam padding de 12 px e gaps menores; valores/títulos em text-sm e detalhes em text-xs. Ícones de card têm 36 px; ações continuam com alvos de pelo menos 44 px.
- Limpar chama finance.notifications.clear. O controlador persiste os IDs dispensados em plan12notificationDismissed_v1, usando o storage da sessão/conta existente. Isso esvazia a lista de notificações e o contador, sem excluir os registros financeiros que originaram os avisos. Eventos novos continuam aparecendo. Não há sincronização remota adicional dessa preferência.
- A atualização financeira agora notifica também a central/sino. O store evita emitir snapshots idênticos, mantendo a lista fechada sem montar seus cards.

## Bug confirmado em Lançamentos

O botão Adicionar recebia a regra de 44 px dos menus de ícone. O conteúdo com SVG e texto era colocado no slot de ícone, também limitado em largura. O clique funcionava nos testes, mas o texto e a superfície apareciam cortados.

FinanceActionMenu passa a distinguir a variante com texto (action-menu-labeled) e organiza o conteúdo em action-trigger-label. A largura natural é aplicada tanto no wrapper quanto no botão/slot. A regra antiga de menus de ícone continua válida nos três pontos e outros acionadores circulares. A variante mensal mantém sua largura existente.

## Testes

- ledger-actions.browser.cjs: criar entrada e gasto, salvar, editar, duplicar, excluir, ler nota, abrir salário mensal e alternar filtros. Confere que o texto Adicionar está contido no botão em 320/390/768/1440 px nos dois temas.
- notifications.browser.cjs: filtros em português, dimensões, leitura, limpar, persistência após reload, ausência de exclusão de gastos e chegada de aviso novo; configurações e fechamento continuam existentes.
- notification-clear-regression.cjs: IDs somente, idempotência, novos eventos e falha de storage sem alteração dos dados.
- Testes existentes, tipos, estilos e build preservados. CI inclui o novo fluxo de ações de Lançamentos; sua execução remota depende da publicação.
