Versão do documento: 0.1.0-alpha.5

# Migração estrutural e padronização global

> Registro da etapa de conversão TypeScript/JSX. A refatoração visual posterior, solicitada para barras e controles, está em [AUDITORIA-BARRAS-E-CONTROLES.md](AUDITORIA-BARRAS-E-CONTROLES.md). Ela atualiza os acabamentos, o inventário de prioridades e resolve as diferenças de CSS entre desenvolvimento e produção relatadas naquela etapa.

## Estado atual

O frontend React/Vite foi convertido integralmente: os 39 arquivos JSX e 37 arquivos JavaScript que ainda existiam em `src` passaram a TSX/TypeScript. A árvore atual contém 101 arquivos TS/TSX, incluindo contratos e declarações. Não restam arquivos `.js` ou `.jsx` em `src`.

A checagem cobre toda a pasta `src`, com `strict: true` e `allowJs: false`. Não foram usados `any` explícito, `@ts-ignore` ou `@ts-nocheck` para encobrir incompatibilidades. Isso não substitui a validação dos dados recebidos de APIs e armazenamento; as validações de execução existentes foram mantidas.

O projeto continua React/Vite. Entradas de funções da Vercel, ferramentas e testes Node conservam seus formatos de execução JS/MJS/CJS. Essa camada não é um frontend legado nem foi convertida para JSX.

## Renderização e componentes

- `src/finance/views/*.tsx`: Resumo/Lançamentos, Compromissos, Planejamento, Análises, Investimentos e Conta agora produzem JSX, com um contexto tipado.
- `src/finance/workspace.tsx`: controlador convertido, incluindo os gráficos SVG, calendário, formulários, perfil, menus, pesquisa, relatórios e notificações do cabeçalho. Os cálculos e comandos continuam apontando para uma única base financeira.
- `src/components/FinanceView.tsx`: aplica os controles Liquid Glass existentes a árvores JSX. Substitui `TemplateView` e o caminho `renderHTML`/`DOMParser` de HTML.
- `src/services/presentation-tree.ts`: percorre elementos React como dados, sem HTML intermediário ou inserção de marcação no DOM. Preserva campos progressivos, seleção inicial, atributos de acessibilidade, SVG e associação entre labels e campos.
- `src/components/summary-layout.tsx`: usa composição React para ordenar os cards, preservando as chaves já salvas. Remove a manipulação anterior com `innerHTML`.
- `src/services/presentation.ts`: preserva os estados vazios ao compor listas JSX; não concatena elementos em strings.
- Repetições mensais usam propriedades declarativas para os controles, sem substituição textual de `checked`/`hidden`.

O `DOMParser` que permanece lê XML de notas fiscais. Ele não monta páginas ou formulários HTML.

## Compatibilidade conferida durante a conversão

| Ponto | Causa do risco | Tratamento e verificação relacionada |
| --- | --- | --- |
| Indicadores sem base informada | Ao percorrer JSX, descartar indiscriminadamente valores `false` apagava `data-known="false"`, fazendo o indicador apresentar um percentual em vez de ausência de base. | Apenas atributos booleanos nativos são omitidos quando falsos; valores `data-*` e ARIA são preservados. Regressão específica cobre ambos, inclusive `disabled={false}`. |
| Listas e estados vazios | Uma lista JSX vazia é um array verdadeiro; trocar `.join('')` por `.map()` diretamente impediria o fallback com `||`. | `viewList`/`viewGroup` devolvem `null` para conteúdo vazio. Conferidos estados sem registros e listas de compras, metas, categorias e cartões. |
| Texto e atributos fornecidos pelo usuário | O escape manual do antigo HTML, seguido pelo escape do React, poderia exibir entidades literalmente. | A apresentação entrega texto ao React, que faz o escape uma vez. A regressão de perfil inclui nome com marcação e confirma ausência de injeção. |
| Valores iniciais e campos expandidos | O controlador lê os campos logo após a abertura e usa campos não controlados. Uma renderização assíncrona ou reaproveitamento indevido alteraria esse contrato. | Mantidos o commit síncrono e as revisões de formulário; `defaultValue`/`defaultChecked` preservam os valores iniciais. Exercitados os quatro tipos de inclusão, campos avançados, seletor e calendário. |
| Ordem salva dos cards | Converter a montagem dos cards poderia mudar os índices persistidos, inclusive investimentos e dívidas. | Composição por elementos React mantém as chaves anteriores; regressões de layout e comparação visual verificam a ordem. |
| Inicialização do sincronizador | O invólucro UMD anterior misturava exportação Node e instalação global no navegador. | Exportações ESM separam a função pura da inicialização de UI. Os 19 cenários de sincronização executam essa implementação, cobrindo conflitos, offline, backups, contas distintas e respostas perdidas. |

Esses pontos descrevem compatibilidades preservadas e regressões evitadas na migração. Não são uma afirmação de que todos já eram defeitos na versão publicada. Também foi removida uma função local autorreferente, nunca chamada, no efeito da página tributária; os listeners ativos foram conservados.

## Estado, cálculos e integrações

- `finance-runtime.ts` e `use-finance.ts` mantêm a API modular, os snapshots isolados e as assinaturas por revisão. Os componentes não acessam os nomes financeiros globais.
- `calculations.ts` continua puro: centavos, parcelas, projeções, dívidas e metas, sem DOM ou armazenamento. As fórmulas não foram reformuladas nesta conversão.
- `types/finance-runtime.ts`, `workspace.ts`, `calculations.ts`, `taxes.ts`, `sync.ts`, `investments.ts` e `views.ts` documentam os dados efetivamente utilizados, incluindo pagamentos de fatura, recorrências, contextos de metas e respostas das APIs.
- `finance-sync.ts` exporta o sincronizador por ESM. Remove o invólucro CommonJS/global anterior, preservando fila pendente, exclusão mútua, revisão concorrente, cópias de segurança e tratamento offline.
- `auth.ts` mantém autenticação verificada e armazenamento por conta/visitante. Referências de cliente, configuração e sessão têm contratos explícitos.
- `legacy-finance-adapter.ts` permanece intencionalmente como compatibilidade dos nomes públicos `window.plan*`. Aponta para as mesmas funções, sem segunda implementação ou cópia de dados.

Nenhuma migração de dados, alteração de chaves persistidas, ativação de provedor externo ou publicação foi necessária para esta etapa.

## Design e exceções

Os 19 arquivos CSS de `src/styles` foram preservados byte a byte em relação ao rascunho do início desta tarefa. A paleta, tipografia, espaçamentos, bordas, sombras, superfícies e regras de movimento não foram redesenhados. Os ajustes que já estavam no rascunho, incluindo notificações compactas e ações de lançamentos, foram conservados.

O inventário [style-exceptions.json](style-exceptions.json) registra as 617 **declarações** com `!important`, com arquivo, linha, seletor, condição, propriedade, valor e finalidade. A contagem textual anterior de 618 também incluía uma ocorrência em comentário.

As prioridades existentes foram mantidas para preservar a cascata dos controles, sobreposições, vidro, estados de foco e breakpoints. A revisão não as substitui por seletores artificialmente mais específicos. `audit-style-exceptions.mjs` bloqueia mudanças silenciosas desse inventário; `consolidate-styles.mjs` continua detectando declarações sobrescritas redundantes. Ambos fazem parte de `npm run check:styles`.

## Segurança e verificações

As regressões Node executam o código TypeScript atual, sem cópias das fórmulas. Fixtures que inspecionavam HTML foram adaptadas para serializar o JSX com React; o navegador valida o grafo ESM e os controles reais.

A cobertura inclui:

- 59 cenários centrais de finanças, além das suítes específicas de cartões, faturas, impostos, compartilhamento, metas, calendário, armazenamento e sincronização.
- CRUD de lançamentos, duplicação, quatro ações de inclusão, filtros e ausência de corte no botão Adicionar.
- Notificações reais, filtros em português, leitura, limpeza persistente e preservação dos gastos.
- Quatro folhas expandidas, teclado/viewport simulado, rolagem, toque em seletores e limpeza ao fechar.
- Login em 12 combinações de largura/tema, formulário de visitante, retry de provedor e modos de acessibilidade.
- Matriz de 11 áreas em três larguras e dois temas, sem overflow.
- Comparação ampliada por `tests/visual-audit.browser.cjs`, com referência anterior, dados fixos, serviços simulados, capturas de páginas e sobreposições. Os resultados consolidados estão em [VALIDACAO-VISUAL.md](VALIDACAO-VISUAL.md).

A configuração de CI mantém tipos, testes, build, release e CSS, e acrescenta as capturas dos estados e popups como artefato para revisão.

Verificações finais locais: `npm test`, `npm run check:types`, `npm run check:styles`, `npm run build` e `npm run check:release` passaram. O build ainda informa o tamanho elevado do chunk da biblioteca de vidro/movimento e diretivas `use client` de dependências; não são erros de compilação nem foram silenciados.

## Limites

A comparação usa Chromium com larguras mobile/tablet/desktop; não certifica um iPhone físico ou Safari real. Os provedores externos são simulados nos testes visuais. Login Google real, IBPT, Open Finance e implantação em produção exigem sua configuração operacional e não são declarados validados por capturas locais. A migração não representa promessa de ausência universal de bugs.
