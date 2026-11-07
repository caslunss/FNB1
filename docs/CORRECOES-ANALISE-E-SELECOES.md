Versão do documento: 0.1.0-alpha.1

# Correções de Análise e seleções — 05/11/2026

Escopo: layout de Impostos e Relatórios e ciclo de abertura do `FinanceSelect` compartilhado. Cálculos, APIs, persistência financeira e categorias não foram modificados.

## Problemas, causas e correções

| Problema reproduzido | Causa exata | Correção e alcance |
| --- | --- | --- |
| Opções sobrepostas sem abrir o campo | A regra de autor `.ui-option-menu { display: grid }`, introduzida na padronização, substituía o `display: none` do navegador para popovers fechados. O atributo `hidden` só era aplicado ao fallback. Na reprodução inicial, os cinco menus do fixture estavam visíveis com `aria-expanded=false`. | `hidden={!open}` em ambos os modos; layout em grade somente para popovers abertos ou fallback sem `hidden`. As regras dos dois modos ficam separadas, preservando browsers que não reconhecem `:popover-open`. Corrige todos os consumidores do componente compartilhado. |
| Menu reabria depois da escolha | Em campos envoltos em `label`, clicar numa opção do popover nativo também disparava a ativação implícita do `select` oculto. Seu handler abria novamente o menu após a seleção. Reproduzido por toque em “SP” na importação bancária. | Cancelar a ação padrão de clique na lista, mantendo a escolha e o evento `change`. Testado com toque, clique e teclado. O fallback em portal também conserva o mesmo contrato. |
| Primeiro card e período encostavam nas abas | `#app.layout-f { display: block !important }` desativava a grade. A regra compartilhada já removia a margem da toolbar por assumir que o espaçamento viria de `gap`. | Removida a exceção legada; Análise utiliza grade de uma coluna, com gap de 20 px e 16 px em telas pequenas. Aplicável aos três submenus. |
| Espaços excessivos e irregulares entre cards | A margem inferior global de `.card` (16/18 px) era somada ao `gap` da grade. Parágrafos diretos também contribuíam com margens próprias. | Margens externas zeradas somente nos cards da área de Análise e nos parágrafos diretos de Impostos; a grade controla a distância. Gráficos mantêm duas colunas quando há espaço e uma no mobile. |
| Indicadores com padding incorreto e proporções diferentes | `GlassCard` escreve `padding: 24px` inline. Os ajustes CSS de 16/18/22 px não prevaleciam. Rótulos longos alteravam a altura da primeira linha no mobile, e o arranjo vertical só existia abaixo de 699 px. | Padding informado pela API do card com tokens: 16 px no mobile e 20 px nas demais larguras para KPIs; demais cards usam `--content-card-padding`. Grade com linhas uniformes e conteúdo vertical alinhado, valores na mesma linha inferior. |
| Ações comprimidas/desiguais e cabeçalho de Compras instável | Importar/adicionar/atualizar estavam em `FinanceOptionBar`, cuja função é manter escolhas numa linha com rolagem. A soma de larguras excedia o espaço em 320 px. No cabeçalho do histórico, margens de `h2` e uma `.row` genérica disputavam a posição dos filtros. | Ações passam a grupo de toolbar com os mesmos botões universais: duas colunas iguais para texto e coluna central de 44 px no mobile; quebra natural no desktop. Textos podem quebrar sem cortar controles. Cabeçalho próprio no histórico, com filtros limitados à largura do card. Barras de filtros continuam sendo barras de opções, com seleção e rolagem interna. As colunas `auto auto` do histórico também eram calculadas separadamente em cada linha. No desktop, colunas estáveis para valores e ações evitam que o tamanho do valor ou o texto Adicionar/Revisar desloque os botões entre linhas. |

A geometria de Análise ficou centralizada em `src/styles/tax-layout.css`; regras antigas equivalentes foram removidas de `layout-settings.css`. O inventário de exceções CSS passou de 611 para 609 declarações. Paleta, Liquid Glass, tipografia e componentes universais foram preservados.

## Verificação e prevenção

- `tests/analysis-selects.browser.cjs`: reproduz a condição inicial fechada, abertura de apenas uma lista, seleção por toque, teclado, Escape, clique fora, redimensionamento, validação obrigatória, envio de FormData, reset, controle desativado e ponte de valor dos formulários anteriores.
- A mesma regressão percorre Impostos, importação bancária, editor em modal e Relatórios, em 320, 390, 768, 1024 e 1440 px, claro/escuro, com Popover API e fallback em portal. Verifica espaçamento das abas, alturas/valores dos indicadores, limites/centro dos botões, margens dos cards e ausência de overflow da página. Confirma que interações de UI não alteram os gastos.
- Teste adicionado ao CI. A auditoria anterior de barras não verificava a invisibilidade inicial dos listboxes nem o clique de opção dentro de um `label`; esses casos agora têm regressão explícita.
- Compilação TypeScript, testes do projeto, auditoria CSS, build e validação de release; regressões de formulários mobile e barras compartilhadas.
- Comparação visual de desenvolvimento com build de produção nas três páginas de Análise, importação/editor tributário, seleção em lançamento e filtros de pesquisa.

Os testes de navegador usam Chromium com toque emulado; o fallback é exercitado desativando a Popover API. Não equivalem a uma execução em iPhone físico ou WebKit. As integrações externas reais não foram acionadas nesta revisão de UI.

## Resultado da comparação visual

42 estados comparados entre desenvolvimento e build de produção, sem diferenças pendentes. As quatro capturas desktop de Impostos/importação foram refeitas após o ajuste final das colunas do histórico. Resultado resumido em [analysis-selects-visual-validation.json](./analysis-selects-visual-validation.json).
