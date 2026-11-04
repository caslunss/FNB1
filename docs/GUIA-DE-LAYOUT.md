# TEFinance — guia de layout

Versão Alpha 1.0 · atualizado em 31/10/2026.

Este guia registra o padrão atual da interface. Deve ser consultado antes de cada alteração visual. Pedidos explícitos do usuário têm prioridade; mudanças aprovadas devem ser refletidas aqui. O guia não representa certificação de conformidade da Apple.

## Direção visual

Interface financeira simples, centralizada e responsiva. Superfícies em Liquid Glass, volumes discretos, ícones de traço e cantos arredondados. Nenhum efeito pode comprometer leitura, foco ou área de toque. Preservar a refração dos controles da biblioteca; corrigir composição e recorte sem substituí-los por controles genéricos.

A paleta padrão é Branco envelhecido. Há variações pastéis de Outono e Inverno. O modo escuro usa as mesmas famílias de cores escurecidas, com reflexos suaves e ajuste de suavidade. Não substituir o modo atual por preto puro ou cores saturadas sem pedido do usuário.

| Elemento | Regra |
| --- | --- |
| Fundo, texto e destaque | Usar os tokens do tema, sem cores isoladas por página |
| Vidro de navegação | `--lg-navigation-fill` e `--lg-blur` |
| Cards e popups | `--lg-panel-fill`, `--lg-panel-blur`, `--lg-shadow` |
| Formulários | `--form-surface` e `--form-border`, com leitura mais opaca |
| Menus de ações | `--lg-menu-fill`, suficientemente opaco para não misturar textos |
| Estado negativo ou destrutivo | `--redT`; não usar vermelho decorativo |
| Limite de categoria atingido | Barra/arco completamente vermelho; percentual real preservado |

As cores e limites estão em `src/services/layout-preferences.js`. Os valores padrão são fundo `#e7e5de`, superfície `#f7f4ec`, destaque `#557789` no claro; fundo `#17191a`, superfície `#272a2b`, destaque `#bac3c5` no escuro. Esses valores são referência da paleta, não cores para repetir diretamente nos componentes.

## Páginas e navegação

| Área | Conteúdo e comportamento |
| --- | --- |
| Login | Tela dividida no desktop; conteúdo empilhado no mobile. Google, Apple e visitante conforme a configuração existente. Preservar os textos principais atuais |
| Resumo | Visão geral e Lançamentos. Comportamento é uma seção da Visão geral; seletor de mês e organização de cards no mesmo grupo |
| Visão geral | Gráfico principal, distribuição, maiores gastos, categorias e dívidas. Cards em colunas quando houver espaço |
| Comportamento | Totais e indicadores por categoria, dia e mês. Mesma largura, tipografia e superfícies do Resumo |
| Entradas | Ações no topo, filtros em pílula, lançamentos e período. Um único acesso principal para adicionar lançamento |
| Dívidas | Blocos de saldo, parcelas e previsão; gráfico e lista. Sem duplicar despesas |
| Cartões | Dentro de Compromissos. Limites, faturas, vencimento, fechamento e pagamentos |
| Planejamento | Compras com pesquisa de ofertas e compra planejada; Metas reúne produtos desejados, reservas mensais e relatório de impacto à vista/no crédito |
| Investimentos | Informações de ativos e economia. Dados ausentes não devem virar zero artificial |
| Análises | Impostos, Relatórios e Carbono. Carbono mantém visibilidade opcional no Layout |
| Calendário | Popup pelo atalho superior. Seleção discreta em vidro; datas de gastos, entradas e cartões. Um único botão + abre Entrada e Gasto para o dia selecionado |
| Dividir conta | Dentro de Compromissos. Lista, convites, compartilhamento e divisão com amigos |
| Perfil | Avatar abre diretamente o card em overlay; foto dinâmica, notas financeiras e badges. Configurações e Sair no rodapé; assinaturas e apoio em seção expansível |
| Conexões | Dentro de Configurações. Open Finance, Serasa e boletos; indicar indisponibilidade real |
| Relatórios | Histórico mensal, importar CSV e exportar backup/CSV |
| Configurações | Conta, Notificações, Layout e Conexões. Conta inclui dados e encerramento de sessão |

A navegação principal tem cinco áreas: Resumo, Compromissos, Planejamento, Investimentos e Análises. Cartões e Carbono respeitam as opções de visibilidade dentro de seus grupos. Perfil, calendário, notificações e pesquisa permanecem no conjunto superior; amigos e relatórios usam suas áreas financeiras. Não criar uma segunda rota para a mesma ação.

O seletor global de mês pertence ao Resumo. Impostos reutiliza o mesmo MonthPicker, com período próprio e rótulo visível. Meses encerrados são somente leitura. Popups não devem deslocar permanentemente o conteúdo da página nem deixar duas janelas modais interativas ao mesmo tempo.

## Estrutura e espaçamento

- Conteúdo centralizado, largura máxima da moldura de 1800 px e colunas com `minmax(0,1fr)`.
- Cards redistribuídos conforme a largura, sem larguras mínimas que provoquem rolagem horizontal da página.
- Usar 8, 12, 16, 20, 24 e 28 px como escala de espaçamento; preferir `gap` a margens compensatórias.
- Cards e formulários: `--pill-radius: 28px`; padding `clamp(18px,2vw,28px)`.
- Popup principal: cantos de 32 px e margem externa mínima de 12 px; rolagem vertical interna quando necessária.
- Botões e disclosures: pílula `999px`; tabelas e blocos internos podem usar raio de 16–20 px.
- “Formato de pílula” não significa aplicar `999px` a um formulário alto. O formulário usa cantos de 28 px para preservar o espaço dos campos.
- Em telas pequenas, empilhar campos e ações antes de reduzir a fonte ou a área de toque.
- Rolagem horizontal somente em regiões identificadas de tabelas e gráficos. Nunca na página inteira.

## Cards e compra planejada

Formulários de Ofertas usam exatamente a mesma geometria das páginas. As regras compartilhadas devem alcançar `:is(#app,.account-panel-body)`.

1. Botão flutuante em pílula, fora do card.
2. Ao abrir, exibir formulário arredondado com superfície legível.
3. Campos essenciais primeiro; detalhes adicionais no botão de três pontos.
4. No desktop, os preços podem ocupar duas colunas. Produto e link ocupam a largura inteira.
5. Ao expandir, trocar o ícone para menos e usar “Fechar”. Preservar o nome completo na identificação acessível.
6. Ações finais alinhadas e com quebra natural no mobile.
7. Simulação mensal e compartilhamento usam disclosures em pílula, com mais/menos.
8. Recortar apenas a superfície decorativa do formulário; não cortar menus, foco ou seletores externos.

Não deixar uma borda retangular no `details` externo. O raio deve existir no formulário real, na superfície e nas suas camadas decorativas.

## Botões e controles

| Controle | Implementação e regra |
| --- | --- |
| Ação comum | `FinanceGlassButton`; mínimo de 44 × 44 px; texto centralizado |
| Ícone | Circular, 44 px, ícone de 20–24 px, `aria-label` descritivo |
| Ação de adicionar | Mais; quando for necessário identificar a função, usar pílula curta |
| Três pontos e ações | `FinanceActionMenu` com `GlassMenu`; nunca um segundo menu genérico |
| Exclusão | Variante `destructive`; confirmação descreve o impacto |
| Alternância | `GlassSwitch`; estado e cor derivados do tema |
| Slider | `GlassSlider`; rótulo e valor visíveis; sem alterar dimensões durante o gesto |
| Abas segmentadas | `FinanceSegments` / `GlassSegmented`; preservar lente e refração |
| Campo | `GlassTextField` com rótulo visível; placeholder não substitui rótulo |
| Upload | `FileUpload`; botão próprio e nome do arquivo |

Fontes de botões e formulários vêm de `--lg-font` ou da fonte herdada. Não usar uma fonte especial apenas em Compartilhar ou Dividir. Ícones não devem capturar apenas parte da área clicável.

Botões decorativos não devem enviar formulários: usar `type="button"`. Para confirmação, usar `type="submit"`. Não colocar um botão dentro de outro.

## Menus, camadas e legibilidade

A biblioteca coloca os filhos diretos de uma superfície em camadas. Por isso, aumentar apenas o `z-index` do menu não garante que ele apareça sobre o próximo bloco.

- Elevar também o filho direto que contém o menu: `.te-glass-surface>:has(.lg-menu-surface)`.
- Preservar a animação e o formato de `GlassMenu`.
- Menus mantêm o acabamento de vidro; o fundo de leitura usa `--form-surface` para ocultar textos que estão atrás. `--lg-menu-fill` continua disponível para outros popovers.
- Rótulos de menu devem quebrar linha; não truncar ações importantes.
- Verificar abertura perto das bordas, com gráficos e valores ao fundo.
- Não resolver o vazamento escondendo todo o card ou removendo o Liquid Glass.
- Camadas decorativas usam `pointer-events:none` e não entram na navegação por teclado.

## Categorias e gráficos

Exibir nome curto, valor, limite se houver e percentual. Status curtos: “Usado”, “Sem limite”, “No limite” e “Acima”.

As únicas categorias em formulários, gráficos, limites, notas, compras e relatórios são **Gastos Essenciais**, **Gastos Variáveis**, **Gastos Fixos**, **Gastos Supérfluos** e **Investimentos**. Usar esses nomes completos, sem abreviações diferentes por página.

Os dados antigos são migrados: alimentação, transporte e necessidades → Essenciais; imprevistos e aleatórios → Variáveis; despesas fixas e assinaturas → Fixos; lazer e entretenimento → Supérfluos. Limites que se juntam são somados em centavos. Assinaturas mantêm um marcador próprio, sem criar uma sexta categoria. A cópia anterior à migração fica preservada e integra o backup.

A grade usa indicadores compactos de até 116 px. Os gastos aparecem abaixo do gráfico, com duas linhas iniciais e os demais em “Mais”. Preservar as descrições originais. Investimentos fica em um card próprio no Resumo, separado do card Categorias, com um único indicador da meta de até 148 px, aportes acumulados e valor do mês. Dívidas do mês usa um card compacto, com título e total na mesma linha e altura conforme o conteúdo. O botão da meta abre o editor financeiro no próprio Resumo, sem duplicá-lo em Planejamento.

**Cálculos de investimentos e metas:** o aporte é debitado uma vez nos gastos e no caixa. O progresso realizado soma apenas aportes registrados até hoje e até o prazo da meta. A projeção da meta soma o saldo após compromissos aos aportes cadastrados, sem criar renda nem presumir valorização. Aportes futuros aparecem na projeção, mas não no progresso realizado. Relatórios fechados preservam seus totais; apenas a classificação é agrupada na migração.

O texto deve permanecer dentro do card e do indicador. Categorias sem limite não mostram um percentual inventado. Valores acima de 100% continuam visíveis; apenas o preenchimento do arco é limitado a 100%.

Gráficos são exibição, sem aparência de botão. Usar cores do tema, traços discretos e valores acessíveis. Não usar moldura retangular externa no gráfico de período. Dados de meses fechados vêm dos relatórios correspondentes; cálculos monetários usam centavos.

## Animações

| Interação | Padrão |
| --- | --- |
| Troca de conteúdo | Fade curto, sem deslocar a navegação |
| Menu do perfil | `account-reveal`, 180 ms |
| Popup | `account-reveal`, 220 ms; deslocamento de 6 px e escala inicial .985 |
| Folha de edição | Fade de 200 ms no acabamento atual |
| Expansão de opções | Fade; dimensão muda naturalmente sem interpolar altura |
| Progresso | Atualização suave de até 300 ms |
| Login → aplicativo | Fade e escala discreta; prazo máximo de 550 ms |
| Pressão de botões | IOSButton reutiliza o material da biblioteca; tap .96 e hover -1 px |

Respeitar `prefers-reduced-motion`. Não somar duas animações de entrada no mesmo elemento. Evitar animar `top`, largura ou altura de barras fixas durante a troca de aba. Uma animação nunca substitui o estado funcional de abrir, fechar, selecionar ou cancelar.

## Escrita minimalista

- Botões: uma ação curta — Salvar, Fechar, Editar, Compartilhar, Confirmar, Pesquisar.
- Títulos: nome do conteúdo — Categorias, Parcelas, Exportar, Simulação mensal.
- Campos: rótulo curto e unidade explícita — Preço atual (R$), Limite (R$), Data, Parcelas.
- Vazio: “Sem lançamentos”, “Sem gastos”, “Sem parcelas”. Evitar frases de apresentação repetidas.
- Mensagens de sucesso: “Salvo”, “Meta salva”, “Paleta salva”.
- Manter descrições que explicam consentimento, dados enviados, irreversibilidade, recorrência, juros, parcelas e limites da estimativa.
- Não alterar descrições criadas pelo usuário ou nomes de bancos para torná-los mais curtos.
- Valores em reais com formato brasileiro; percentuais com vírgula; datas consistentes em pt-BR.

## Implementação e fontes

| Arquivo | Responsabilidade |
| --- | --- |
| `src/components/LiquidControls.jsx` | Botões, superfícies, menus, segmentos e editores |
| `src/components/TemplateView.jsx` | Converte templates para componentes React |
| `src/components/ProgressiveFields.jsx` | Campos básicos e opções avançadas |
| `src/styles/liquid-glass.css` | Integração visual da biblioteca |
| `src/styles/layout-settings.css` | Layout, popups e acabamento compartilhado |
| `src/styles/workspace.css` | Estilos de base das páginas |
| `src/services/layout-preferences.js` | Paletas, tokens e preferências |
| `src/finance/workspace.js` | Conteúdo e comportamento financeiro |

Referências originais: [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Apple Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/liquid-glass), [biblioteca Liquid Glass](https://liquidglass.theatom.lk/docs). A implementação instalada é `@zakisheriff/liquid-glass` 0.3.8. Consultar também a documentação instalada antes de alterar a API dos controles.

## Revisão antes de entregar

1. Conferir a tela normal, expandida, vazia, com conteúdo longo e com erro de validação.
2. Abrir os três pontos sobre categorias e gráficos; confirmar que o menu recebe os cliques e cobre o conteúdo de baixo.
3. Conferir Ofertas, Compra planejada, simulação, opções avançadas e confirmação.
4. Testar claro e escuro em 320, 390, 768, 1024, 1440 e 1920 px quando o escopo afetar todo o layout.
5. Verificar foco, Escape, cancelamento, navegação por teclado e alvos de pelo menos 44 px.
6. Conferir duplicações de ações, ícones, títulos e textos explicativos.
7. Executar testes relacionados, `npm test`, build e `npm run check:release` conforme o escopo.
8. Registrar falhas e limites reais da verificação; não declarar “100% em todas as plataformas”.

## Variante mobile iOS — Alpha 1.0

Esta variante é uma implementação web React responsiva inspirada no iOS. Não é um aplicativo SwiftUI, não certifica conformidade com a Apple e não simula APIs nativas indisponíveis no navegador. Os cálculos, dados e componentes Liquid Glass continuam compartilhados com o desktop.

### Mudanças Estruturais

Abaixo de 700 px, a moldura vira uma coluna. A navegação passa para a base, com Resumo, Dívidas, Cartões, Ofertas, Investimentos e Impostos, somente ícones com nomes acessíveis. Cartões respeita a preferência existente de visibilidade. Carbono, Calendário, Amigos, Relatórios, Integrações e Configurações ficam em Atalhos, no topo. Perfil e Notificações mantêm acessos próprios. Ações não são inseridas como abas.

Os cards são empilhados e a simulação de compra planejada vira uma lista de linhas rotuladas, preservando o HTML de tabela e os valores. Janelas de conta, cartões, ofertas e ferramentas são folhas inferiores. O controle superior permite expandir/recolher; somente Atalhos, que não contém formulário, admite arrastar para fechar. Editores mantêm cancelamento explícito para evitar perda acidental.

Os botões novos têm alvos de pelo menos 44 × 44 CSS px. Os switches preservam a geometria da biblioteca e sua região invisível de toque de 44 px. A ação + e a pesquisa ficam acima da barra inferior, com espaço reservado no conteúdo. A altura real da barra é observada para não cobrir o final da página quando os rótulos crescem.

### Wireframe Textual / Estrutura da Tela

1. Safe area superior; perfil, notificações e Atalhos alinhados à direita.
2. Título grande da seção, com redução sutil durante a rolagem; sem redução quando o usuário prefere menos movimento.
3. No Resumo, segmentos Resumo / Hábitos / Entradas, seguidos do mês e organização dos cards.
4. Conteúdo em coluna: gráfico, distribuição, maiores gastos, categorias, investimentos/meta e dívida compacta. Entradas mantém totais, ferramentas e lista de lançamentos.
5. Pesquisa e + na zona inferior. + abre o editor existente, sem duplicar ações ou cálculos; não aparece em meses encerrados.
6. Barra inferior de navegação e safe area do indicador de início.
7. Ao abrir uma tarefa, folha sobreposta com título, fechar e conteúdo rolável. Apenas uma tarefa modal interativa por vez.

### Mapeamento de Componentes

| Desktop atual | Variante web mobile | Equivalente para um app nativo futuro |
| --- | --- | --- |
| Navegação superior por ícones | Barra inferior somente com ícones e nomes acessíveis | `TabView` e `NavigationStack` |
| Grid de cards | Coluna adaptável | `ScrollView` / `LazyVStack` |
| Tabela de simulação | Linhas rotuladas empilhadas | `List` / `Section` |
| Popup central | Folha inferior expansível | `.sheet`, `.presentationDetents` |
| Menu de ações | Menu existente, toque longo nos lançamentos | `.contextMenu` |
| Ações de lançamento | Deslizar para Editar/Apagar, com confirmação | `.swipeActions` |
| Seletor HTML | Seletor do navegador/sistema | `Picker` / `Menu` |
| Segmentos e switches | Componentes compartilhados da biblioteca | `Picker(.segmented)` / `Toggle` |
| Vidro CSS | Blur, tokens e redução de transparência | Liquid Glass nos controles; materiais padrão no conteúdo |
| Fonte do sistema e unidades rem | Texto adaptável e zoom | Dynamic Type com estilos semânticos |
| Insets CSS `env(safe-area-inset-*)` | Proteção dos recortes do dispositivo | `safeAreaInset` / `safeAreaBar` |

### Gestos e Microinterações

- Toque: seleção de aba, ações e segmentos. A biblioteca preserva sua resposta visual de pressão.
- Deslizar um lançamento para a esquerda: revela Editar e Apagar; a exclusão requer confirmação. O menu de três pontos continua sendo alternativa visível e acessível por teclado.
- Toque longo em lançamento: abre o mesmo menu de ações, sem uma segunda implementação das operações.
- Folha Atalhos: arrastar a alça para cima expande; para baixo fecha; tocar alterna a expansão. Fechar e Escape continuam disponíveis.
- Folhas com dados: expansão por botão e fechamento explícito. Não implementar descarte automático de formulário por gesto.
- Rolagem: título reduz discretamente; nenhuma navegação salta de posição. O teclado recolhe as ações inferiores quando detectado pelo Visual Viewport.
- `prefers-reduced-motion` e `prefers-reduced-transparency` são respeitados. Haptics reais, Vibrancy nativo, WidgetKit e Live Activities exigem implementação nativa; não são declarados como recursos entregues nesta versão.

### Acessibilidade e materiais

Fontes do sistema com `-apple-system-body`, unidades relativas e sem bloqueio de zoom. Isso não equivale a testar o Dynamic Type nativo ou VoiceOver em um iPhone. É necessário validar em Safari/iOS real, com texto ampliado, VoiceOver, teclado e ajustes de contraste/transparência.

As diretrizes atuais da Apple reservam Liquid Glass principalmente para controles e navegação; materiais padrão pertencem à camada de conteúdo. A variante preserva o acabamento dos cards solicitado anteriormente, mas evita adicionar novas camadas refrativas sobre o conteúdo. Não afirmar cumprimento literal de ambas as decisões sem explicar essa diferença.

Referências: [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials).

## Motion — atualização de animações

A implementação usa `motion` 14.9.0. As decisões abaixo são parâmetros do produto inspirados no HIG; a Apple não prescreve essas constantes.

- Mola padrão: stiffness 440, damping 44, mass 1; resposta curta, sem overshoot. Pressão: 650 / 52 / 1.
- Troca de página ou segmento do Resumo: saída antes da entrada; opacidade 0 → 1, deslocamento lateral 18 → 0 px e escala .99 → 1. Não animar blur. A barra de navegação permanece imóvel. O `backdrop-filter` e a refração dos componentes de vidro permanecem estáticos.
- Popups, perfil, folhas e notificações: entrada curta coordenada; remover a animação CSS antiga quando Motion controla a mesma superfície. Não somar dois efeitos de entrada.
- Interrupções: parar a animação anterior e retirar transform/filter/opacity temporários. Um callback antigo não pode limpar uma transição mais recente.
- Economia e Investimentos usam `SmoothState`: fade de conteúdo sem animação de altura, sem manter controles antigos interativos ou modificar valores financeiros.
- Login usa fade e escala discreta, coordenados pelo Motion; a navegação possui prazo máximo e não depende indefinidamente do término de uma animação.
- `TaxSummaryCard` está preparado para resumo de impostos com ação real: hover -3 px e tap scale .97; suporte a Enter e Espaço. Não aplicar compressão a cards de leitura comuns ou criar uma função fictícia. A aba Impostos usa esse componente nos indicadores para abrir os filtros correspondentes.
- A página de Impostos usa a transição compartilhada e esse componente, com uma ação de abrir detalhes. Não inserir controles interativos dentro de um card que já atua como botão.
- Com `prefers-reduced-motion`, eliminar deslocamento, compressão, expansão espacial e blur animado; preservar fade curto e estados legíveis. Com redução de transparência, não animar blur. Mudanças da preferência durante a animação devem terminar em estado legível.

Arquivos: `src/services/motion-presets.js`, `src/services/page-motion.js`, `src/components/SmoothState.jsx`, `src/components/TaxSummaryCard.jsx`. Referências: [Apple Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Apple Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Motion animate](https://motion.dev/docs/animate).


## Impostos — implementação

- Destino próprio no desktop e sexto destino no mobile; Carbono permanece em Atalhos.
- Cards: Tributos estimados, Carga média ponderada, Cobertura e Pendências. Ausência de estimativa é travessão, nunca zero inventado; percentuais positivos menores que 0,1% aparecem como `<0,1%`.
- Histórico por compra e gráficos mensal/por categoria. Investimentos são excluídos da base de consumo; valores futuros não entram nos totais realizados.
- Análises complementam gastos existentes. Um novo gasto só é criado por escolha explícita; salvar um documento não desconta o tributo novamente do saldo.
- Formulário em popup/folha inferior, com upload XML/TXT próprio, campos básicos e classificação avançada. Confirmação da revisão obrigatória. Arquivos são processados no navegador; não se promete OCR de imagens/PDF.
- Dados podem ser informados no documento, estimados por item ou aproximados por perfil de atividade. CNAE sem perfil habilitado mantém a análise pendente. Origem desconhecida, alíquota nula e tabela fora da vigência nunca viram taxa presumida.
- Alteração do gasto invalida o resultado anterior até revisão. Períodos encerrados são somente leitura; detalhes da estimativa preservam fonte e versão.
- Visitante salva temporariamente no navegador; contas salvam no Supabase por usuário, com cálculo no servidor, RLS de leitura e histórico de revisões. Exportar análises fica em Relatórios.
- Importação bancária assistida via Netlify: usuário seleciona conta e movimentações do mês aberto, revisa duplicidades manuais e vincula cartão cadastrado quando necessário. Faturas, estornos e transferências reconhecidas são excluídos; PIX exige revisão. Cada parcela usa seu valor registrado, sem multiplicar o valor integral da compra.
- Consulte `docs/IMPOSTOS.md` para configuração, limites e testes. Nenhuma credencial IBPT entra no frontend ou no repositório.

## Movimento compartilhado (React e TypeScript)

Usar `MotionProvider`, `PageTransition`, `IOSButton` e os presets descritos em `ANIMACOES-IOS.md`. Molas altamente amortecidas; somente opacity, x, y e scale nas novas transições. O vidro continua estático: não animar blur, recorte ou tamanho. Respeitar movimento reduzido e impedir interação com conteúdo de saída. Não adicionar transições concorrentes de transform ao mesmo botão.

Até 1024 px, cinco destinos principais aparecem somente com ícones, com área mínima de toque de 44 px e nomes acessíveis preservados. Impostos e Carbono ficam dentro de Análises. Investimentos usa gráfico ascendente, não cartão de crédito.

## Revisão responsiva de 03/11/2026

- Login de tela inteira: grade com colunas minmax(0,1fr); no mobile, sem padding externo acumulado. Cada metade controla seu gutter. Títulos devem quebrar antes de exceder a largura.
- Gráficos com eixos: manter rótulos legíveis em uma região de rolagem local acessível. Não reduzir SVGs largos até transformar números em texto ilegível. A página não pode rolar horizontalmente.
- Pesquisa: manter ação circular de fechar visível, além de Escape e toque fora.
- Carregar sob demanda somente páginas opcionais de Impostos/Investimentos; formulários e foco do controlador financeiro permanecem síncronos.
- Confirmação de exclusão por swipe é montada apenas quando solicitada. Nenhum gesto deve começar sobre campos, links ou botões da linha.
- Consultar docs/REVISAO-UI-PERFORMANCE.md para diagnóstico, implementação e limites da verificação.

## Seletores e datas — 03/11/2026

- Selects simples usam appearance:none, seta em CSS derivada de --lb2, padding reservado à direita, foco visível e estado desativado. Listas multiple/size preservam o comportamento próprio.
- Dentro de GlassTextField, a superfície compartilhada fornece o vidro e o foco; não adicionar uma segunda borda ao select. O menu aberto continua sendo do sistema.
- Impostos mantém MonthPicker em dialog no topo das camadas. Sua barra neutraliza localmente largura fixa, order e posicionamento absoluto de ícones antigos; sem z-index arbitrário ou segundo calendário.
- Data da compra mantém o input date nativo, com alvo mínimo de 44 px, indicador alinhado e color-scheme correspondente ao tema.

## Lista de seleção personalizada

- FinanceSelect personaliza seleções simples em Impostos e o período de Investimentos, reutilizando FinanceGlassButton e GlassTextField. O select oculto mantém name, FormData e change; não criar valores financeiros paralelos.
- Lista em popover no topo das camadas, dimensionada ao viewport. Escape fecha apenas a lista; Tab segue o formulário; setas, Home/End e busca por texto controlam a opção ativa sem alterar o valor antes de confirmar.
- Selects obrigatórios, multiple, size, optgroup e navegadores sem Popover mantêm o seletor nativo estilizado. Formulários do controlador antigo preservam o select real visível, com id/name e valor lidos diretamente pelo DOM; FinanceSelect fornece a mesma lista em popover, sem duplicar valores financeiros.
- Validar teclado, cancelamento, reset, FormData, temas e listas próximas das bordas. O componente não equivale a uma certificação com todos os leitores de tela.


## Padronização compartilhada — 03/11/2026

Pedido aprovado: navegação inferior dinâmica, alinhamento da compra planejada e padrão único de seleções e calendários.

- `BottomNavigation.jsx` mantém o host `#tabs` e as rotas existentes. Até 1024 px, a barra compacta ao descer e expande ao subir ou pausar e mostra cinco ícones com nomes acessíveis e alvos de pelo menos 44 px. A versão desktop mantém as mesmas cinco áreas no conjunto superior.
- A barra anima largura, altura, padding e opacidade na rolagem; o ícone e indicador animam na seleção. Não animar blur. Movimento reduzido remove essas transições; transparência reduzida usa superfície opaca.
- `shared-controls.css` centraliza campos de 48 px, raio de 24 px, foco do tema e tipografia de 16 px, tanto no aplicativo quanto em popups. Compra planejada usa o mesmo formulário progressivo e a mesma escala; preços em duas colunas quando couberem e uma coluna em telas pequenas.
- `GlassTextField` encaminha seleções simples para `FinanceSelect`. Nos templates, o select real continua visível e preserva id, name, validação, FormData e alterações diretas do controlador. A lista compartilhada usa o topo das camadas. Seleções agrupadas, múltiplas e navegadores sem Popover conservam o controle do sistema; selects obrigatórios de React também conservam sua validação nativa.
- `GlassTextField` encaminha campos date para `DatePicker.jsx`: entrada real editável, botão de calendário e dialog compartilhado em pt-BR. Datas mínima e máxima, required, campos desativados e FormData continuam no input original. Escolher uma data emite input/change; cancelar não altera o campo. O dialog fecha por Escape e devolve foco ao botão.
- Calendário de movimentações, MonthPicker e DatePicker usam os mesmos tokens de superfície, borda, foco e seleção. Meses continuam no MonthPicker; datas completas usam DatePicker. Não converter períodos financeiros nem alterar cálculos para padronizar o visual.

## Estados assíncronos e listas — performance

- LoadingSkeleton usa tokens existentes, dimensões reservadas e somente opacidade; movimento reduzido desliga a animação. Não apresenta zeros financeiros fictícios.
- Impostos mostra 50 compras por lote com Mostrar mais compras; indicadores e filtros consideram a lista inteira. Não esconder dados financeiros sem uma ação para continuar a leitura.
- Importação bancária é carregada ao abrir, mantendo boundary de erro e placeholder. Formulários controlados pelo fluxo financeiro síncrono não ficam suspensos.
- Consultas públicas em cache continuam exibindo sua data de consulta e oferecem atualização manual. Consulte PERFORMANCE-REACT.md para escopo e validação.


## Navegação unificada — 03/11/2026

- Compromissos: Dívidas, Cartões (se habilitado) e Dividir conta.
- Planejamento: Compras (pesquisa de ofertas e compra planejada) e Metas. Atalhos de editar meta levam ao mesmo editor nesta área.
- Análises: Impostos, Relatórios e Carbono (se habilitado). Impostos continua lazy e controla seu próprio período.
- Resumo: somente Visão geral e Lançamentos; os indicadores e a análise de comportamento ficam abaixo dos cards na Visão geral. Não remover o consentimento de envio ao Gemini.
- Perfil: Perfil, Configurações e Sair. Integrações passam para Configurações → Conexões. Calendário e pesquisa continuam acessíveis; no mobile, Calendário e Configurações permanecem em Atalhos.
- Rotas antigas de cartão, amigos, ofertas, carbono e relatórios são encaminhadas ao grupo correspondente. Nenhuma chave de dados financeiros ou cálculo é migrado. Alterar a navegação não deve apagar filtros financeiros, compras, metas ou fechamentos.
- A seleção interna fica em FinanceSegments, com foco e teclado da biblioteca. Nunca deixar uma janela modal invisível bloqueando a área recém-aberta.


## Auditoria de cards e alinhamento — 03/11/2026

- A seção integrada de comportamento usa uma grade de duas colunas a partir de 768 px e uma coluna abaixo disso. Hábitos de gastos ocupa uma célula, sem altura mínima artificial ou largura de página inteira; Dicas ocupa a linha inteira.
- Hábitos e Planejamento reutilizam FinanceGlassCard através dos templates, com a classe finance-layout-card: mesmo raio, borda, sombra, material de vidro e padding simétrico. Não criar um segundo componente visual para esses cards.
- Planejamento usa cards reais para pesquisa, criação de compra, compras salvas, confirmação, compras confirmadas, metas e resultados/fontes de ofertas. A superfície externa fornece o card; os formulários internos não repetem outra moldura. O editor progressivo mantém controles e validações existentes.
- Gap compartilhado de 24 px no desktop e 16 px no mobile; as grades controlam o espaçamento, sem somar margens externas em barras e seções. Campos de seleção preservam popovers; tabelas têm rolagem local. Não cortar foco ou menus para esconder overflow.
- Checkbox de incluir na meta usa alinhamento horizontal próprio, sem herdar a coluna de campos de texto. O ícone de data centraliza com inset/margem, sem competir com transform das animações do botão.
- O rótulo de navegação é Dividir conta; a chave interna friends continua preservada.
- O editor de meta mantém valor, meses e data em estado controlado. Alternar o tipo de prazo não deve apagar rascunhos ainda não salvos.


## Card de perfil interativo — 03/11/2026

- ProfileCard.jsx é o conteúdo do dialog accountOverlay existente, sem outra camada modal. Avatar abre o perfil diretamente. Backdrop escuro fecha ao clicar fora; Escape, contenção de foco nativa e retorno ao avatar são preservados.
- Estado inicial: foto em toda a superfície, gradiente e vidro fosco na metade inferior. Hover em ponteiro fino: foto na metade superior e painel branco sólido com texto escuro embaixo, inclusive no tema escuro, conforme o pedido específico de referência. A paleta das demais áreas permanece intacta.
- O tamanho externo do card não muda; somente a altura da imagem absoluta e as cores/opacidades internas transitam por 300 ms ease. Não usar transition:all nem animar blur. Essa transição de altura é uma exceção solicitada para a mídia isolada do perfil; movimento reduzido a desliga.
- Fixar detalhes oferece o estado expandido por toque; foco visível de teclado também revela o painel legível. Foto com falha ou ausente usa inicial e gradiente. Texto longo e notas mensais têm rolagem interna, sem extrapolar a superfície.
- As notas vêm de profileStars/monthlyRatings existentes. Não acrescentar bio genérica ou inventar indicadores financeiros.
- Testador reutiliza isBetaTester. Apoiador só aparece com app_metadata.supporter === true, dado administrativo; user_metadata não autoriza esse selo. O ícone de verificação indica e-mail confirmado no Supabase, não identidade financeira validada.
- Configurações e Sair continuam acessíveis no card. Assinaturas e apoio mantêm os controles existentes em um disclosure abaixo dele.


## Navegação inferior minimalista e campos uniformes — 03/11/2026

- Até 1024 px, barra inferior flutuante com altura expandida de 54 px, largura máxima de 380 px, margens de 12 px e safe areas. Acima de 1024 px, preservar o desktop.
- Itens mostram apenas ícones; aria-label e title preservam os nomes completos. aria-current=page muda imediatamente a seleção, mesmo durante cliques rápidos e transições de página.
- O ícone ativo usa cor primária, escala 1.1 e indicador discreto abaixo. Transições de transform e opacity duram 300 ms ease-in-out; a geometria dos botões permanece fixa. Movimento reduzido remove transições e escala.
- FinanceTabButton usa botão nativo dentro do vidro compartilhado no mobile/tablet, evitando sobrepor animações de pressão e seleção. No desktop mantém FinanceGlassButton.
- Material usa --lg-navigation-fill, blur de 20 px e --lg-edge/--lg-shadow. Transparência reduzida usa superfície opaca. Tablets reservam espaço inferior; a busca permanece separada da pílula no celular. O botão flutuante de lançamento foi removido; adicionar lançamento continua na barra de ferramentas de Entradas.
- control-surfaces.css mantém campos com altura mínima de 48 px e raio de 24 px no aplicativo e login. FinanceFieldButton deixa o vidro apenas na superfície externa de GlassTextField, eliminando bordas e sombras duplicadas nos seletores. O foco permanece visível nessa superfície.
- As regras da barra ficam em bottom-navigation.css, isoladas por media queries, sem alterar o breakpoint global dos formulários.


## Foco global dos controles — 03/11/2026

- focus.css é carregado após os estilos do aplicativo e do login. A camada app-focus substitui outlines legados e nativos por indicadores do tema, incluindo menus, calendários, botões, links, regiões focáveis e formulários em popups.
- Campos recebem borda e halo suave ao focar; dentro de GlassTextField, só a superfície externa recebe o destaque. Botões e links recebem halo de teclado em focus-visible, sem contorno adicional no clique comum. Preservar o estado ativo da navegação e as animações de pressão.
- Transições de borda/sombra dos campos duram 180 ms; movimento reduzido as remove. Não alterar dimensões ou usar transition:all.
- Nunca eliminar o indicador de teclado. Em cores forçadas, usar outline explícito Highlight, pois box-shadow pode não ser desenhado pelo sistema. Não tentar alterar controles internos de iframes de autenticação de terceiros.

## Compactação por rolagem — 03/11/2026

- Até 1024 px, descer pelo menos 10 px compacta a barra para 50 px de altura e reduz a largura em 32 px. Subir, chegar ao topo, focar um item ou pausar 650 ms expande a barra. Alvos de toque mantêm 44 px.
- Transições CSS de 300 ms ease-in-out afetam apenas a superfície; os ícones não são escalados pela compactação. Movimento reduzido mantém a barra expandida. Efeito de vidro e desktop permanecem preservados.

## Cabeçalho e interação unificados — 03/11/2026

- Busca fica no grupo superior com perfil e notificações no celular, reutilizando ToolbarSearch; não duplicar a busca em botão flutuante. Fechar o dialog retorna foco ao botão do cabeçalho.
- Abas mobile/tablet ampliam somente o SVG em hover de ponteiro fino e foco de teclado (1.18); pressionar reduz para .96 e soltar restaura a seleção. Sem ampliação ao ativar movimento reduzido; a superfície continua compactando por rolagem.
- control-surfaces.css compartilha geometria de ações (mínimo 44 px, raio de pílula, padding 10/16 px), alinhamento de ícones e espaçamento de 12 px em grupos. Campos, controles de calendário, botões de ícone e abas mantêm sua geometria especializada. Cards usam o raio e sombra dos tokens existentes, preservando paleta e materiais.

## Perfil como card flutuante — 03/11/2026

- Perfil usa FinanceGlassCard, avatar circular e conteúdo no fluxo normal, sem foto de fundo, painel branco, tamanho fixo ou transformação por hover. Preservar notas, selos, configurações, sair e assinaturas/apoio.
- O dialog permanece centralizado também no celular com margens de 16 px, raio, borda e sombra dos tokens compartilhados; rolagem interna em telas baixas.
- Motion controla entrada (fade, y 12 px e escala .98) e saída curta de 160 ms, sem animar dimensões ou blur. Escape e clique no backdrop fecham com retorno do foco. Movimento reduzido desliga o deslocamento/escala. Esse padrão substitui o card fotográfico com divisão por hover descrito anteriormente.

## Visão geral com grade harmonizada — 03/11/2026

- Gráfico e Categorias ocupam uma linha completa; distribuição e maiores gastos compartilham a linha seguinte; investimentos e dívidas formam outro par. Sem span de duas linhas no gráfico, evitando lacunas na grade.
- overview-layout.css responde à largura real do conteúdo via container query: pares somente a partir de 680 px disponíveis. Abaixo disso, coluna única; comportamento acompanha a mesma regra e Dicas continua ocupando a linha inteira.
- Espaçamento e padding usam os tokens de cards existentes. Ordem personalizada, ações, indicadores, valores e cálculos permanecem preservados.

## Pesquisa de produtos em Compras — 03/11/2026

- Pesquisa por nome usa /api/shopping com SerpApi Google Shopping (Brasil, pt, gl=br), mantendo os cards e controles compartilhados. Resultados mostram loja, produto, imagem, preço BRL confirmado e link de oferta; resultado vazio tem mensagem própria. Não presumir desconto, moeda ou disponibilidade.
- SERPAPI_API_KEY fica somente no servidor. Consulta de detalhes de links e análise de gastos continuam no Gemini; não enviar agregados de gastos à SerpApi. Login e limite de consultas permanecem obrigatórios.

## Assinaturas reais no perfil — 03/11/2026

- SubscriptionsCard usa FinanceGlassCard/FinanceGlassButton e dados agrupados por subscriptions.js. Total do mês inclui cobranças futuras já cadastradas; nunca apresenta presença de lançamento como contrato ativo ou pagamento confirmado.
- Lista serviços personalizados, valor e quantidade de lançamentos no mês; histórico sem registro no mês fica em disclosure. Ver lançamento abre o editor existente sem concorrer com saída animada do perfil.
- Seletores mantêm as superfícies universais de mês/data e fallback no calendário local; tributos mantêm explicitamente o fuso de São Paulo.

## Controles universais — revisão complementar

- FinanceGlassSwitch centraliza switches de Layout, Tema e Notificações, com o verde existente via --control-switch-on, e alinhamento de rótulos à esquerda. Checkboxes de seleção/consentimento mantêm semântica própria.
- CalendarIcon é único para MonthPicker e DatePicker. Grade de dias tem padding zero; meses usam 8 px. Não aplicar padding de ação textual às células.
- DatePicker encaminha a referência do consumidor ao input real. Agenda financeira, seletor mensal e seletor de dia compartilham tokens, mas preservam responsabilidades e constraints distintas.

## Seletor de período da fatura

- MonthPicker com showLabel usa month-selector-labeled: apenas o botão desenha a pílula; wrapper sem largura fixa ou segunda sombra. Ícone no fluxo normal, texto com quebra e mínimo de 44 px. Compartilhado por Faturas e Impostos; botão sem rótulo do Resumo preserva dimensões próprias.

## Análises mobile: alinhamento de período e ações

- Até 699 px, período centralizado em uma linha própria; Importar banco, adicionar análise e Atualizar compartilham grade de três colunas (1fr/44px/1fr), com o mesmo eixo e altura mínima de 44 px.
- Indicadores tributários usam alturas e preenchimentos consistentes; notas da página não somam margens ao gap da grade. Editor tem título flexível e fechar circular de 44 px; formulário, revisão e ações usam espaçamento compartilhado.
- Regras ficam em tax-layout.css; desktop preservado, dados e cálculos não são alterados.

## Remoção segura dos estilos legados de MonthPicker

- month-controls.css passa a ser a única fonte da geometria do botão mensal e de seu wrapper; layout-settings.css não mantém mais versões para select/input month, larguras de 160/170 px, ícones absolutos ou remendos por contexto.
- Variante sem rótulo: botão 44×44 px. Variante com rótulo: largura conforme conteúdo, texto com quebra e padding 10/16 px. Material continua em FinanceGlassButton; wrapper não desenha outra superfície.
- tax-layout.css mantém somente a responsabilidade de organizar o calendário e as ações na grade mobile. Containers flex/grid de Resumo e Fatura permanecem intactos. Hooks, eventos, dados e APIs não foram alterados nesta limpeza.

## Movimento universal sem mudança de design

- MOTION em services/motion-presets.js é a fonte dos presets JS e das variáveis --motion-* para CSS. universal-motion.css aplica apenas propriedades de movimento; não define geometria ou paleta.
- IOSButton usa Motion e controles nativos usam microinterações CSS, sem dois motores sobre o mesmo transform. Foco mantém o halo original de forma imediata; movimento reduzido cancela animações em andamento.
- Compactação da barra usa medidas por mudança de estado e escala (FLIP), preservando tamanhos finais e áreas de toque. Não interpolar largura/altura/padding do layout.
- Ver limites e evidências em MOVIMENTO-UNIVERSAL.md; preservar fechamentos síncronos exigidos pelos fluxos de formulário.

## Atalhos mobile simplificados

- Configurações tem um único acesso no perfil; Atalhos mantém Calendário quando habilitado. Sem atalhos habilitados, exibir estado vazio explícito.
- A alça de Atalhos é decorativa e neutra, sem foco/gesto de expansão. O antigo botão de largura total recebia o foco inicial e desenhava um halo azul como barra horizontal. O foco inicial vai para Fechar, com indicador de teclado preservado.
- Dialog com altura natural, sem expansão vazia. Escape/backdrop devolvem foco ao acionador; transferência para Calendário não disputa foco. Cliques no padding interno não fecham o painel.

- O Calendário aberto por Atalhos recebe o acionador explicitamente e devolve foco a ele ao fechar; os demais acessos mantêm seus acionadores anteriores.

## Seleção dentro da página no celular

- FinanceSelect simples sempre usa botão/lista do site, inclusive required e templates antigos. Select real permanece para id/name, constraints, FormData e leitura/escrita do controlador, mas fica fora da área de toque.
- Required é validado pelo select real; o evento invalid apresenta mensagem junto ao botão e foca o controle visível. Alterações diretas em .value de controles legados atualizam o rótulo; reset preserva os contratos.
- Navegadores sem Popover usam lista posicionada por portal no dialog ativo ou body. Múltipla seleção, size explícito e grupos não suportados conservam o fallback nativo; não estão presentes nas seleções simples revisadas.
- Tocar no campo de data abre DatePicker do site, sem focar primeiro o seletor do sistema. Digitação por teclado permanece disponível; MonthPicker continua para períodos.

## Calendários e navegação durante edição

- Dias e meses usam FinanceCalendarButton: botão nativo do design compartilhado, sem cópias refrativas do conteúdo. Só aria-pressed=true desenha a seleção; dias não selecionados da agenda ficam neutros. Foco de teclado e indicadores de eventos continuam distintos de seleção. Não remover eventos reais que compartilham a mesma data.
- Barra inferior oculta até 1024 px quando houver dialog aberto, scrim de lançamento, conexão bancária, editor de cartão, pagamento de fatura, importação bancária, revisão de compra ou editor expansível aberto. Acompanhamento do DOM evita depender apenas do teclado; CSS cobre os modais imediatamente.
- Fechar uma janela filha não revela a barra enquanto o formulário pai continuar aberto. A barra volta após encerrar o último editor e mantém a aba selecionada. Desktop preservado. Medidas de compactação são descartadas durante ocultação para não gerar transforms inválidos na volta.

## Calendário no perfil; remoção de Atalhos

- Cabeçalho mobile não tem mais acionador ou painel de Atalhos. MobileExperience mantém apenas detecção de teclado, progresso do título e medida da barra.
- Perfil oferece Calendário junto de Configurações e Sair, reutilizando o mesmo painel financeiro e respeitando a opção de visibilidade do calendário. Ao fechar, foco retorna ao avatar, pois o botão dentro do perfil foi substituído pelo painel.
- Desktop mantém seu acesso superior ao calendário; estilos exclusivos do painel removido foram eliminados, preservando as folhas de confirmação compartilhadas.

## Pílula de assinaturas no perfil

- O disclosure de Assinaturas usa mini pílula com tokens de fundo, borda, sombra e raio compartilhados; alvo mínimo de 44 px. Chevron acompanha aberto/fechado com timing universal.
- Summary/details mantêm Enter/Espaço e estado semântico nativos. Conteúdo de assinaturas e apoio permanece no mesmo disclosure, sem duplicação de dados.

## Reflexos isolados por superfície

- --lg-filter, --lg-rim, --lg-inner-mask e posição do brilho são dados geométricos locais. Controles compartilhados reiniciam esses valores para não herdar o mapa rasterizado de um card maior.
- Mapas inline gerados por useRefraction continuam tendo prioridade; não desativar refração globalmente. Tokens de cor, blur e intensidade permanecem compartilhados.
- Pseudo-camadas respeitam o raio do botão, não repetem a imagem e não recebem eventos; texto/ícone ficam acima do reflexo. Formulários e superfícies sem refração própria não mostram um reflexo emprestado do ancestral.

## Calendário no topo e período global somente no Resumo

- Calendário sai do perfil e usa o botão já existente junto de perfil/notificações, inclusive no mobile. Respeitar a preferência de visibilidade. O acionador anuncia abertura de dialog e recebe o foco de volta.
- Seletor global de mês (#mes) e barra de opções do Resumo aparecem somente em Resumo/Visão geral e Lançamentos, que pertencem ao mesmo grupo de navegação. Outros grupos não repetem esse controle.
- Período de impostos e faturas são filtros próprios e permanecem nos respectivos componentes, sem alterar seus valores.

## Metas de produtos em Planejamento

- Metas deixa de repetir o editor financeiro do Resumo. Produto, preço final, valor já reservado, estratégia e data usam os campos/calendário universais. Juntar inclui reserva mensal; crédito inclui parcelas sem juros e cartão ativo.
- Cards, botões, estados de erro e tabela reaproveitam LiquidControls, finance-layout-card e plan-table. Campos em duas colunas no desktop e uma no celular; ações quebram naturalmente. A barra inferior fica oculta durante o cadastro/edição.
- Relatório na mesma página mostra disponível, reserva/parcela, outras reservas e saldo após o plano. Crédito verifica também o limite necessário para o valor total. Meses sem entradas cadastradas são explícitos; nunca declarar aprovação bancária ou saldo real.
- Salvar meta não movimenta dinheiro nem cria lançamentos. Preparar compra hoje abre o fluxo existente de revisão e confirmação, preservando o histórico e evitando registros duplicados. Detalhes financeiros e limites em METAS-DE-PRODUTOS.md.
