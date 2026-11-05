Versão do documento: 0.1.0-alpha.1

# Correções de formulários e login mobile

## Causas e correções

| Problema | Causa encontrada | Correção e alcance |
| --- | --- | --- |
| Gestos de rolagem não funcionavam sobre alguns controles | A biblioteca aplica `touch-action:none` nos botões. As exceções antigas cobriam apenas determinados botões; seletores e outros botões compartilhados continuavam bloqueando o gesto vertical. | `control-surfaces.css` permite `pan-y` em `te-glass-button`, incluindo seletores. Switches e sliders não usam essa classe e conservam seus gestos. Teste real de toque começa sobre o seletor da entrada e verifica avanço da rolagem. |
| Campos expandidos poderiam ficar sob o teclado e cabeçalho | A folha limitava a altura usando somente `100dvh`, que pode incluir a região coberta pelo teclado no iOS. O scrim também tinha camada inferior à do cabeçalho mobile. | `EntrySheet.jsx` mede altura/deslocamento da VisualViewport e remove listeners/variáveis ao desmontar. A folha tem rolagem própria e o scrim fica acima do cabeçalho. Entradas, gastos, dívidas e limites reutilizam o mesmo componente, sem mudança nos campos ou cálculos. |
| Card/borda indevidos no login escuro e painel mobile parcial | Seletores antigos específicos do tema escuro superavam a regra fullscreen. Além disso, a superfície da coluna de acesso permanecia um bloco separado após empilhar as colunas. | A geometria fullscreen tem precedência consistente em todos os breakpoints. Até 760 px, a tinta/desfoque ficam na camada de fundo que cobre o viewport; a coluna de acesso fica transparente. Desktop preserva as duas colunas. |
| Superfície branca retangular atrás do Google | O host/iframe do provedor não tinham isolamento de esquema de cor e recorte compatível com a pílula. | O host e iframe usam `color-scheme:light`; o host recorta os cantos e recebe o indicador externo de foco. Não se alteram o conteúdo do iframe, callback, nonce ou a autenticação Supabase/Google. |

O bloqueio do conteúdo atrás de um formulário modal é intencional. A correção mantém a navegação acessível dentro da folha e restaura a página ao cancelar. Não permite editar o fundo enquanto há um formulário aberto.

## Verificação

Com Vite ativo, executar:

```sh
PLAYWRIGHT_MODULE=/caminho/do/playwright node tests/mobile-forms-login.browser.cjs
```

`CHROMIUM_PATH` seleciona o executável e `QA_BASE_URL` pode substituir `http://127.0.0.1:5173`. O teste é separado da suíte Node porque precisa do navegador e servidor local.

- Quatro formulários expandidos, incluindo repetição mensal quando aplicável.
- VisualViewport simulada com altura de 320 px e deslocamento de 80 px: folha inteiramente na área visível, controles acima do cabeçalho, conteúdo rolável.
- Gesto de toque no seletor, cancelamento, limpeza das medições, desbloqueio da página e ausência de gastos criados pelo teste.
- Login em 320, 390, 699, 760, 768 e 1440 px, nos temas claro e escuro; sem overflow, sem borda legada, superfície mobile integral e divisão desktop preservada.
- Formulário de visitante, movimento reduzido e visibilidade em cores forçadas. Iframe Google isolado de teste, sem login real.
- `npm test`, `npm run check:types`, `npm run build` e `npm run check:release` passaram.

Os testes de interação foram executados no Chromium com toque e teclado simulados. Não houve teste em aparelho iOS físico nem autenticação com uma conta Google real.
