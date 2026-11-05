Versão do documento: 0.1.0-alpha.1

# Revisão de interface e performance — 03/11/2026

Repositório: caslunss/FNB1. Base: 1d83f275164e1d161002cd100cf46111dc47faaa.

## Problemas e correções

| Área | Diagnóstico | Correção |
| --- | --- | --- |
| Login mobile | Em viewport de 320 px, os blocos internos chegavam a 369 px. Colunas com mínimo intrínseco e padding externo somado ao padding das metades estreitavam o espaço. | Colunas minmax(0,1fr), gutter somente nas metades, título adaptável e quebra de texto. Tema fica em região própria no topo. |
| Gráficos financeiros e economia | SVGs de 560/640 unidades eram reduzidos à largura de um card mobile, tornando os rótulos muito pequenos. No desktop, Economia crescia demais antes de passar para duas colunas. | Plot com largura mínima legível dentro de região rolável por toque/teclado. Limite de altura no gráfico econômico. Investimentos e Economia usam colunas a partir de 1100 px. Valores e séries não foram alterados. |
| Fatura do cartão | Seletor HTML nativo fora do acabamento dos demais períodos. | Reutilização do MonthPicker, com label, calendário único e popup do site. |
| Barra inferior | Regras repetidas mandavam mostrar e esconder os mesmos rótulos. | Remoção de regras conflitantes; ícones com nomes acessíveis, seis destinos e área mínima de 44 px. |
| Pesquisa | Não havia ação de fechar visível; dependia de Escape ou toque fora. | Botão circular Fechar pesquisa com alvo de 44 px, mantendo filtros e busca na mesma linha. |
| Teclado mobile | O código acessava visualViewport diretamente, embora essa API possa não existir; o cálculo usava somente innerHeight, que alguns navegadores também reduzem com o teclado. | Acesso por window, verificação da presença e comparação com o viewport de layout. Limpeza dos eventos preservada. |
| Lançamentos | Cada linha mobile criava um dialog completo no body, mesmo fechado. Gestos podiam começar sobre controles da linha. | Confirmação montada apenas ao solicitar exclusão. Preservados cancelar, retorno de foco, confirmação, edição e exclusão existentes. Gestos não capturam campos/botões. Meses fechados não têm ações de swipe. |
| Consultas | Economia aguardava o JSON de referência antes de iniciar a rede; requisições antigas não eram abortadas. O contador de espera de Investimentos continuava atualizando o componente depois de chegar a zero. | Referência e consulta iniciam em paralelo; dados de referência não substituem uma resposta recente; cancelamento e prazo de consulta. O intervalo de espera é encerrado ao atingir o prazo. |
| Carga inicial | Impostos e Investimentos estavam importados junto do Resumo. | React.lazy, Suspense e boundary de erro somente nessas páginas. Cartões deixou de importar o catálogo de investimentos. |

## Estratégia de renderização

Resumo, regras em centavos, persistência, formulários de lançamento, menus e foco continuam síncronos. O controlador atual lê os campos imediatamente após renderizar; aplicar lazy loading indiscriminadamente nesses pontos quebraria o fluxo financeiro. Não se adicionou Context global nem memoização arbitrária.

Os módulos de Impostos e Investimentos são carregados na primeira abertura. Um estado de carregamento com altura mínima estática mantém a navegação disponível. Falha de carregamento oferece Recarregar, sem apagar dados. Sem atraso artificial nas operações financeiras.

As animações compartilhadas continuam baseadas em transformações/opacidade e movimento reduzido. A biblioteca Liquid Glass mantém os efeitos internos existentes; não foi substituída por outra biblioteca nem redesenhada a paleta.

## Código

- src/components/DeferredPage.tsx: carregamento opcional e tratamento de falha.
- src/components/InvestmentArea.tsx: composição independente de Economia/Investimentos.
- src/components/SwipeLedgerRow.tsx: gestos e confirmação sob demanda.
- src/components/MobileExperience.tsx: viewport, teclado e atalhos.
- src/components/EconomyCard.tsx e Investments.jsx: consultas e apresentação financeira.
- src/styles/mobile.css, login-fullscreen.css e layout-settings.css: correções responsivas.
- tests/react-qa.html e tests/login-responsive-qa.html: matrizes visuais com dados fictícios, claro/escuro e seis larguras.

## Validação e medidas

- 180 combinações de páginas, seis larguras (320, 390, 768, 1024, 1440 e 1920 px), claro/escuro: sem falhas na matriz de layout.
- 24 estados de login: seis larguras, dois temas e formulário de visitante aberto/fechado, sem overflow detectado.
- 32 suítes de regressão, verificação de tipos, build de produção e check de release concluídos.
- Cadastro de cartão fictício e troca do período da fatura conferidos em 320 px; pesquisa abre/fecha e retorna foco. Lista mobile com quatro lançamentos monta zero diálogos de exclusão enquanto o usuário não solicita apagar.
- JavaScript principal: 275,70 → 237,25 kB; gzip 87,43 → 75,75 kB (redução de 13,4% no chunk principal). Isso não representa a soma de todos os módulos nem uma medida de tempo real de carregamento.

## Limites

A revisão local usa Chrome, viewports simuladas e dados fictícios. Ela não equivale a testar Safari em iPhone/iPad físico, VoiceOver, teclado do iOS real, Google real ou cota de APIs externas. O build não comprova funcionamento de credenciais de produção. Não foram modificados cálculos financeiros, esquemas ou dados do usuário.

Referências: https://react.dev/reference/react/lazy, https://react.dev/reference/react/Suspense, https://developer.apple.com/design/human-interface-guidelines/accessibility e docs/GUIA-DE-LAYOUT.md.
