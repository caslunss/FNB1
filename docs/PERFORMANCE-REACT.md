Versão do documento: 0.1.0-alpha.1

> Atualização em 06/11/2026: a página de Investimentos e os dois endpoints de mercado citados abaixo foram removidos. O cache genérico é conservado como utilitário; a descrição de sua antiga integração é histórica.


# Otimizações React — 03/11/2026

## Diagnóstico e mudanças

| Área | Custo identificado | Implementação e motivo |
| --- | --- | --- |
| Carga de páginas | Impostos e Investimentos já eram lazy. A importação bancária era importada junto de Impostos, mesmo fechada. | DeferredPage mantém React.lazy/Suspense e boundary de erro; BankImport ganhou um chunk carregado apenas quando o usuário abre a importação. Formulários do controlador financeiro continuam síncronos, pois seus campos são lidos imediatamente após renderView. |
| Edição tributária | Cada tecla no formulário refazia aggregateTaxes para o mês atual e os seis meses do gráfico; também filtrava despesas novamente. | useMemo com despesas, registros, mês e data como dependências. Mudanças nos dados invalidam o resultado; campos do editor não invalidam os cálculos. |
| Histórico tributário | O formulário compartilha estado com a página. Todos os cartões de compras eram percorridos/renderizados a cada edição, e a lista inteira era montada. | TaxHistory usa memo, rows estáveis e callbacks useCallback para abrir/remover. A lista exibe 50 compras por lote, com Mostrar mais compras. Totais e filtros continuam calculados sobre todos os registros; isso é paginação de apresentação, não paginação no servidor. |
| Investimentos | Edição do ticker e contador de cooldown voltavam a renderizar os resultados e processar a série histórica. | InvestmentResults usa memo com result/kind: o histórico deixa de ser processado quando apenas o texto do ticker ou o contador muda. Não foram memoizados botões e textos baratos sem necessidade. |
| Estado global do layout | ProgressGauge assinava o objeto inteiro do layout, incluindo intensidade e paleta. | useSyncExternalStore agora observa somente circularProgress, a única preferência usada no render desse componente. As cores continuam atualizadas pelos tokens CSS. Não foi criado outro Context nem duplicado o estado financeiro. |
| Rede de mercado | Retornar a abas/páginas repetia consultas públicas idênticas. | Cache em memória por URL, TTL de 60 segundos, até 24 respostas, deduplicação de consultas simultâneas e atualização manual que ignora o cache. Abort de um consumidor não cancela outro consumidor; a requisição de rede tem timeout de 15 segundos. Falhas não ficam em cache. |
| Percepção de espera | Suspense e chamadas de API mostravam apenas texto. | LoadingSkeleton reserva espaço para linhas, valor e gráfico; usa somente opacidade e desliga animação com prefers-reduced-motion. Skeletons são usados nas páginas lazy, importação bancária, consultas de investimentos, economia inicial e análises tributárias. Resultados de outro tipo de consulta não são apresentados como se fossem atuais. |

## Estado e APIs

O cache é exclusivo de /api/investments e /api/market-economy. Não persiste em localStorage; não guarda tokens, dados bancários ou análises tributárias. A data checkedAt continua visível para indicar quando os dados foram consultados. Após 60 segundos, a próxima leitura busca a rede novamente; não existe polling em segundo plano. Consultar/Atualizar força nova leitura, respeitando a espera de rate limit existente.

Análises tributárias e importação bancária preservam autenticação, revisão, persistência e checagem de sincronização. A importação já usa cursor e limite de seleção de 100 movimentações. Não foram paralelizadas mutações ou adicionados retries automáticos a operações financeiras.

Não há prop drilling suficiente para justificar trocar o gerenciamento de estado. O maior problema observado era estado local de formulário invalidando cálculos e listas da própria página. A separação do histórico e a memoização derivada tratam esse custo. TanStack Query passa a valer a avaliação se surgirem consultas autenticadas compartilhadas, invalidação entre muitas telas, atualizações em segundo plano e cache por usuário. Adicioná-lo agora não é necessário para essas duas consultas públicas.

## Evidências e limites

Comparação de builds locais com a mesma versão do Node/dependências, usando HEAD antes das mudanças como referência:

| Chunk | Antes | Depois |
| --- | --- | --- |
| Impostos | 21,54 kB / 7,38 kB gzip | 18,05 kB / 6,36 kB gzip |
| Importação bancária | incluída em Impostos | 4,44 kB / 1,99 kB gzip, sob demanda |
| Aplicativo principal | 238,01 kB / 76,00 kB gzip | 238,60 kB / 76,16 kB gzip |
| Investimentos | 14,03 kB / 5,16 kB gzip | 15,32 kB / 5,71 kB gzip |

A redução de Impostos é aproximadamente 16% em bytes sem compressão. O custo do cache e dos skeletons aumenta outros módulos; isso não representa redução do JavaScript total. Continua existindo um chunk compartilhado de aproximadamente 598 kB sem compressão, com aviso do bundler. Não foram removidos os efeitos de vidro nem substituída a biblioteca visual para reduzir esse número.

A verificação em Chromium usa APIs simuladas com latência de 1,2 segundo: confirma skeleton, retorno à aba sem nova requisição, refresh manual com nova requisição, cache de economia após remontagem, importação bancária somente na abertura e salvamento tributário como visitante. Testes unitários exercitam TTL, refresh, deduplicação, cancelamento independente, retry após falha e descarte de entradas antigas. Não há comprovação de melhora de LCP/INP em produção nem de tempos em dispositivos físicos; medir esses indicadores e usar React Profiler com volumes reais é o próximo passo para estabelecer novos alvos.
