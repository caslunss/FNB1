# Validação visual da migração TypeScript/JSX

## Método

A versão anterior é a cópia integral do rascunho existente no início desta tarefa, executada em uma segunda porta local. A comparação usa o mesmo Chromium, dados financeiros, data, fuso, tema e respostas simuladas nas duas versões.

Foram fixados os IDs de teste para que a ordenação dos lançamentos não variasse por UUID. As capturas aguardam carregamentos e transições, e retornam ao topo nas imagens de página inteira. Não se alteram os estilos do aplicativo para forçar igualdade.

O comparador confere conteúdo, quantidade de elementos, geometria e propriedades de tipografia, espaçamento, cores, sombras e desfoque. Somente o número gerado automaticamente nas referências `#lg-refract-*` é normalizado. A geometria admite diferença inferior a 0,25 px, para não confundir interpolação subpixel com alteração de layout.

As imagens também são comparadas por pixels e inspecionadas quando houver diferenças. A comparação estática utiliza a preferência de redução de movimento; as interações e a redução de movimento são verificadas separadamente pelas regressões existentes.

## Cobertura

50 estados × 4 larguras (320, 390, 768 e 1440 px) × 2 temas (claro e escuro).

| Grupo | Estados |
| --- | --- |
| Áreas principais | Visão geral, Lançamentos, Dívidas, Cartões, Dividir conta, Compras, Metas de produtos, Investimentos, Impostos, Relatórios e Carbono |
| Investimentos | Cotações e variações de Histórico, Dividendos, Balanços, FIIs, Câmbio, IPCA e Selic |
| Inclusão | Entrada, gasto, dívida e limite, cada um fechado/expandido; seletor customizado; calendário de data |
| Perfil e configuração | Perfil, assinaturas expandidas, Conta, Notificações, Layout e Conexões |
| Popups | Calendário de movimentações, seleção global de mês, fatura, pesquisa e filtros, leitura de nota |
| Notificações | Todas, Transações e Alertas |
| Edição | Cartão, meta de produto, compra planejada, análise tributária e importação bancária |
| Login | Acesso social com iframe de teste isolado e formulário de visitante |

## Resultado desta execução

| Verificação | Resultado |
| --- | --- |
| Conteúdo, geometria e estilos computados | 400/400 pares equivalentes |
| Overflow horizontal e erros JavaScript | Nenhum detectado nos 400 estados |
| Dimensões das imagens | 400/400 iguais |
| Pixels dentro da tolerância automática | 399/400 pares |
| Pares sem pixel acima da tolerância por canal | 328/400 |
| Comparação adicional dos builds de produção | 12/12 pares equivalentes em estilos/geometria e pixels |

A comparação de pixels considera alterado um pixel quando algum canal RGB difere mais de 8 pontos, e sinaliza inspeção quando mais de 0,1% dos pixels da imagem mudam. Isso não autoriza alterar CSS para acomodar diferenças.

O par restante é **Conexões, 768 px, tema escuro**: 2.063 de 691.200 pixels (0,2985%), com diferença média de 0,232 ponto por canal RGB. As letras apresentam diferença residual de renderização. O par e a imagem de diferença foram inspecionados. Uma segunda verificação percorreu **todos os elementos** nesse estado, incluindo cores, bordas, opacidade e transformações: conteúdo, geometria e propriedades continuaram iguais. Não se afirma identidade pixel a pixel.

As capturas inicialmente divergentes de investimentos e impostos foram refeitas após aguardar módulos, dados, filhos das transições e estabilidade do conteúdo. Os registros consolidados usam o par refeito para a mesma chave de cenário, sem alterar estilos do aplicativo.

O [resumo por cenário](visual-validation-summary.json) guarda as medidas dos 400 pares. A [prancha antes/depois](validation/migration-comparison.webp) reúne exemplos de Resumo, Perfil, Notificações e o estado inspecionado de Conexões. As capturas completas desta sessão estão nos diretórios `/tmp/fnb-visual-v2-*`, com os pares refeitos em `/tmp/fnb-visual-final-*`, `/tmp/fnb-visual-stable-*` e `/tmp/fnb-visual-full-nodes`.

### Comparação do build de produção

Resumo, Lançamentos, Investimentos, Impostos, Perfil e Login foram comparados em 390 px, nos dois temas, usando **build de produção anterior versus build de produção atual**. Todos os 12 pares passaram.

A conferência cruzada também identificou uma diferença **preexistente** entre desenvolvimento e produção: o Vite separa estilos compartilhados e altera sua ordem em relação aos estilos de cada entrada. No código original, isso já muda alguns acabamentos de vidro e a disposição de controles mobile no build. As folhas específicas de app/login têm os mesmos bytes nas duas versões compiladas. Essa diferença entre modos não foi causada nem corrigida pela migração. Unificar a ordem de carregamento é uma pendência separada de CSS/build, pois mudaria a aparência atual de produção; não se disfarçou esse achado como equivalência entre os modos.

## Reproduzir

Com a aplicação atual na porta 5173 e uma cópia anterior na porta 5174:

```bash
VISUAL_REFERENCE_URL=http://127.0.0.1:5174 \
VISUAL_AUDIT_DIR=/tmp/fnb-visual-audit \
node tests/visual-audit.browser.cjs
```

`VISUAL_WIDTHS`, `VISUAL_THEMES` e `VISUAL_CASES` permitem selecionar casos. `VISUAL_CAPTURE_ALL=1` amplia a inspeção para todos os elementos e propriedades de borda/movimento. `PLAYWRIGHT_MODULE` e `CHROMIUM_PATH` selecionam as instalações de navegador. Sem servidor de referência, o teste percorre os estados e verifica os invariantes, salvando capturas da versão atual.

Depois das capturas:

```bash
VISUAL_AUDIT_DIRS=/tmp/fnb-visual-audit \
VISUAL_PIXEL_REPORT=/tmp/fnb-visual-pixels.json \
node tests/visual-pixels.browser.cjs
```

`VISUAL_AUDIT_DIRS` aceita vários diretórios separados por vírgula; o último par de uma mesma chave prevalece. O comparador de pixels retorna código não zero quando alguma diferença excede a tolerância e exige inspeção. O resultado residual documentado acima permanece explícito, sem aumento artificial dessa tolerância.

O CI executa as larguras 320/1440 nos dois temas e armazena o artefato `visual-audit`. A comparação com a versão anterior documentada aqui é uma execução local completa, não uma afirmação de que o workflow remoto já rodou.
