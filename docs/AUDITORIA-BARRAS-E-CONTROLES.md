# Auditoria de barras e controles Liquid Glass

## Padrão aplicado

`FinanceOptionBar`, `FinanceSegmentedControl` e `FinanceGlassButton` são os pontos de uso do padrão. As classes Tailwind ficam em `src/components/control-classes.ts`; material, métricas e estados ficam em `src/styles/option-controls.css`.

| Propriedade | Contrato |
| --- | --- |
| Material das barras | Mesmo fundo translúcido do tema, borda estrutural e desfoque configurado em Layout |
| Classes de base | `gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-xl` |
| Espaçamento | Gap de 8 px; padding externo de 4 px; ações com padding 8/16 px |
| Botões de texto | 14 px, peso 500, altura mínima de 44 px e quebra de texto quando necessária |
| Ícones | 44 × 44 px, SVG de 20 px e identificação acessível |
| Selecionado | Branco com texto escuro, compartilhado por `aria-selected`, `aria-pressed` e `aria-current` |
| Inativo | Transparente dentro da barra; hover discreto; estados desabilitados identificados |
| Listas longas de opções | Uma linha com rolagem horizontal interna; sem overflow da página ou cápsulas altas |
| Menus | Raio de 28 px, linhas em pílula, material de leitura do tema e o mesmo espaçamento |

Os utilitários fornecem a base; os tokens refinam o material para as paletas existentes. O desfoque não tem um valor diferente por página. Dentro de uma barra, as opções não acrescentam uma segunda camada de desfoque. Ações independentes continuam utilizando o controle da biblioteca, com o acabamento compartilhado.

Calendários conservam sua grade e switches conservam sua geometria. Linhas de transações/resultados mantêm seu alinhamento de dados; não são transformadas em abas. Botões oficiais de provedores de login mantêm seus requisitos de marca. Ações de exclusão conservam a cor semântica de perigo.

## Problemas encontrados e correções

| Problema | Causa | Correção e inspeção relacionada |
| --- | --- | --- |
| Seleções diferentes entre páginas | Notificações tinham uma seleção branca própria; outros grupos usavam tonalidades e sombras locais; Configurações usava sublinhado. | Estados centralizados no botão universal. Conferidos gráfico, Resumo/Lançamentos, áreas financeiras, Configurações, notificações, prazo da meta e calendário. |
| Espaçamentos e tamanhos conflitantes | Regras locais definiam gaps de 0/4/6/10 px, fontes menores e paddings diferentes, incluindo `Limpar`. | Classes compartilhadas, gap de 8 px e escala única de ações/ícones. Removidas 225 declarações antigas na limpeza inicial e os seletores obsoletos de segmentos e filtros. O inventário total de prioridades caiu de 617 para 611 declarações. |
| Destaque segmentado desalinhado | A lente anterior dividia a largura por quantidade de itens, sem descontar gaps; havia regras forçando gap zero para compensar. | `FinanceSegmentedControl` seleciona o próprio botão, com foco por setas/Home/End. Não depende de uma lente medida sobre células incompatíveis com o espaçamento. |
| Cápsulas altas em listas longas | `flex-wrap` herdado permitia empilhar várias abas dentro de um raio de pílula. | Linha única com rolagem interna, inclusive Investimentos e Configurações. A seleção é revelada ao abrir, mudar de aba ou redimensionar. Renderizações sem mudança de seleção não desfazem uma rolagem manual. |
| Mês rotulado tratado como ícone | O mês reutiliza `ib`, mas pode conter texto; uma regra universal de 44 px o comprimiria. | A variante rotulada fica fora da geometria somente de ícone. Conferidos períodos de impostos, fatura e seleção de mês. |
| Notificações com regras próprias | Filtros e ações do cabeçalho tinham tamanhos, gaps e estados distintos dos demais controles. | Pílula e botões compartilhados; `Limpar` mantém seu comando original. Em telas estreitas, o botão de configuração pode ocupar outra linha do rodapé, sem diminuir a área de toque. |
| CSS com prioridade diferente no build | Folhas compartilhadas e específicas eram extraídas para chunks distintos, alterando a ordem da cascata. | `app-entry.css` e `login-entry.css` declaram a ordem completa das folhas. Aplicativo e login têm entradas de CSS próprias. |
| Vidro desaparecia no Chromium de produção | Uma etapa antecipada de otimização descartava a declaração padrão quando a versão WebKit vinha depois. | Desativada a otimização antecipada do Tailwind; um passe PostCSS coloca a declaração padrão após sua equivalente prefixada, e o Vite faz a minificação final. Conferidos o CSS gerado e o backdrop computado no navegador. |
| Risco de esconder o foco | Novas prioridades de pintura poderiam sobrepor o indicador de teclado. | `app-controls` preserva a precedência da camada `app-focus`. Verificados foco visível, navegação de abas e retorno aos controles. |

## Arquivos principais

- `src/components/LiquidControls.tsx`: primitivas, variantes, segmentos e manutenção da seleção visível.
- `src/components/FinanceView.tsx`: aplicação do padrão às apresentações JSX do controlador, incluindo barras de Configurações e calendário, links de ação e disclosures.
- `src/components/NotificationCenter.tsx`: filtros e cabeçalho com os controles comuns.
- `src/components/Investments.tsx`, `TaxHistory.tsx`, `Taxes.tsx`, `GoalEditor.tsx`: grupos de opções/ações compartilhados.
- `src/components/DatePicker.tsx`, `MonthPicker.tsx`, `FinanceSelect.tsx`: cabeçalhos e menus consistentes, preservando os valores dos formulários.
- `src/main.tsx`, `src/login.tsx`, `src/styles/*-entry.css` e `vite.config.js`: carregamento ordenado e preservação dos prefixos do desfoque.
- `docs/style-exceptions.json`: inventário atualizado e verificado por `check:styles`.

## Segurança funcional

Não houve alteração de fórmulas, chaves persistidas, consultas de API, autenticação, importação bancária ou contratos financeiros. Filtros, destinos das notificações, leitura e descarte continuam ligados ao estado existente. Não foram incluídos dados fictícios no aplicativo.

O teste de notificações verifica que `Limpar` descarta avisos sem excluir gastos, persiste o descarte e permite novos eventos. As regressões de lançamentos exercitam inclusão, edição, duplicação, exclusão e filtros.

## Verificação

| Checagem local | Resultado |
| --- | --- |
| Matriz de componentes no build de produção | 228/228 estados passaram |
| Desenvolvimento versus produção | 44/44 pares equivalentes em conteúdo, geometria e estilos |
| Tipos estritos, testes Node, auditoria CSS, build e release | Passaram |
| Notificações, CRUD de lançamentos, formulários mobile/login e API financeira no navegador | Passaram |
| Inspeção visual | Conferidas as capturas de barras, configurações, notificações, impostos, investimentos e calendários |

Não se afirma identidade de pixels entre os dois modos: a comparação verifica o contrato de conteúdo, layout e estilos computados. A prancha reúne capturas finais do build, e não dados de contas reais.

As medidas consolidadas desta execução ficam em `docs/option-controls-validation.json`, e as capturas selecionadas em `docs/validation/option-controls.webp`.

O teste `tests/option-controls.browser.cjs` percorre 11 áreas, quatro abas de Configurações, três filtros de notificações e o calendário: 19 estados por combinação de largura/tema. As larguras são 320, 390, 768, 1024, 1440 e 1920 px, nos temas claro e escuro. Também confere teclado, seleção reaberta, rolagem manual, foco e compactação/expansão da navegação.

`tests/visual-audit.browser.cjs` compara desenvolvimento com o build de produção usando dados, horário e respostas de serviços iguais. As imagens anteriores a esta refatoração servem apenas para inspeção da mudança aprovada; não são um teste de identidade com o novo design.

Para reproduzir a matriz contra uma prévia local do build:

```bash
npm run build
# Inicie npm run preview em outro terminal.
QA_BASE_URL=http://127.0.0.1:4173 node tests/option-controls.browser.cjs
```

`PLAYWRIGHT_MODULE` e `CHROMIUM_PATH` selecionam as ferramentas instaladas; `UI_WIDTHS`/`UI_THEMES` limitam a matriz. O CI foi atualizado para incluir a regressão de controles; esta execução não representa confirmação de execução remota do workflow.

Limites: testes em Chromium com viewports emulados, sem certificação de Safari/iPhone físico. Provedores externos são simulados nos testes visuais. Esta alteração não publica o site nem ativa integrações de produção.
