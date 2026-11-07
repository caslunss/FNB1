Versão do documento: 0.1.0-alpha.6

# Liquid Glass — integração

Referência: https://liquidglass.theatom.lk/docs
Pacote: @zakisheriff/liquid-glass, versão fixa 0.3.8 (MIT).

## Componentes usados

- GlassButton nos botões de ação, incluindo salvar, cancelar e ações da barra. Os atributos data-*, aria-* e disabled são mantidos. O tipo submit é explícito quando o controle original usava o padrão HTML de submissão.
- GlassCard nos cards de conteúdo. Intensidade padrão 3, cores e espaçamento ligados aos tokens da paleta de inverno; o editor Layout permite personalização.
- GlassSegmented nos filtros de lançamentos, opções dos gráficos, visão do resumo e seções do perfil. As escolhas são ligadas aos controladores existentes por eventos validados; as teclas de navegação são as da biblioteca.
- GlassSwitch controlado em Aparência, conectado ao tema real e à preferência persistida. A observação do atributo data-theme mantém o switch atualizado quando a aparência muda por outro caminho. Se a gravação falhar, a posição continua refletindo o tema efetivamente aplicado.
- useRefraction e usePress, APIs públicas documentadas para componentes personalizados, preservam a barra vertical, os ícones superiores e superfícies sem alterar a sua estrutura.
- Login recebe a superfície e os controles novos; os botões oficiais dos provedores permanecem com suas marcas. O SVG de distorção antigo do login foi removido.

## Organização

src/components/LiquidControls.tsx: superfícies personalizadas, controles de tema e segmentos.
src/components/FinanceView.tsx: aplicação dos componentes aos templates existentes.
src/styles/liquid-glass.css: tokens, geometria e compatibilidade com os estilos anteriores.

A folha da biblioteca é importada uma vez em cada entrada (aplicativo/login); o build compartilha os recursos comuns. Não há novo segredo, configuração de backend ou migração SQL.

## Legibilidade, movimento e desempenho

Os formulários e leitores de notas mantêm preenchimento mais opaco. Tabelas, gráficos e linhas de dados continuam sendo conteúdo, sem virar botões de vidro. São usados níveis moderados de refração (2–3), e superfícies de conteúdo aninhadas não recebem o efeito repetidamente. As preferências de redução de movimento e transparência têm tratamento CSS.

Os efeitos variam entre navegadores. A documentação descreve refração SVG do fundo no Chromium e acabamento translúcido/reflexos com lentes no Safari/Firefox. Não foi realizado teste em Safari/Firefox ou aparelhos físicos. O aspecto web é independente da Apple e não representa uma certificação da empresa.

## Publicar

```sh
npm ci
npm test
npm run build
```

O netlify.toml mantém publish=dist e functions=netlify/functions. Publique o projeto completo para manter as funções de pesquisa. Não é necessário instalar a biblioteca manualmente depois de extrair o ZIP: npm ci usa o package-lock.json atualizado.

## Layout e barra de conta

Perfil e notificações ficam em uma cápsula vertical no topo da coluna de navegação, acima dos atalhos. As duas cápsulas compartilham o nav-shell e mantêm um intervalo de 12 px. Não há linha de cabeçalho vazia empurrando as páginas. A bolha de notificações abre ao lado da coluna, com largura adaptada ao espaço disponível. A barra fica inativa enquanto um formulário modal está aberto.

Em Configurações → Layout, personalize destaque, fundo e superfícies de cada tema, além de opacidade, desfoque e intensidade de refração. A seleção Claro/Escuro mostra o tema em edição. Restaurar padrão preserva a paleta do outro tema. O texto e os ícones recebem contraste calculado a partir das cores escolhidas.

O padrão escuro usa base grafite #121416 e superfícies elevadas #23272b, com os tokens neutros de vidro da biblioteca. O GlassSwitch de aparência mantém proporções, cores verde/branco e intensidade padrão da biblioteca; as cores personalizadas do aplicativo não alteram seu acabamento original.

As preferências são validadas e armazenadas separadamente dos dados financeiros, por conta neste dispositivo; visitantes usam a sessão do navegador. Não são sincronizadas pelo Supabase. Uma falha de gravação preserva o layout anterior. Não há alteração de banco de dados.

## Revisão Dim e ações destrutivas

Referências: Apple HIG Dark Mode (base/elevated), Adopting Liquid Glass (separação dos controles, materiais e legibilidade), e README/código instalado de @zakisheriff/liquid-glass 0.3.8. A página /docs não estava acessível no buscador nesta revisão; a API foi conferida no pacote oficial instalado.

- Dark Mode: https://developer.apple.com/design/human-interface-guidelines/dark-mode
- Adopting Liquid Glass: https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass
- Pacote: https://www.npmjs.com/package/@zakisheriff/liquid-glass

O slider GlassSlider “Suavidade do modo escuro”, em Configurações → Layout com Escuro selecionado, reduz o reflexo e o brilho das bordas de 0 a 100%. Não aplica filtros de brilho à página, aos textos ou aos gráficos. Os hosts da biblioteca reúnem preenchimento e borda em ::before; a integração separa apenas o reflexo em uma camada sem eventos para controlar sua opacidade e preservar o preenchimento. A intensidade dos cards é limitada a 2, evitando refração excessiva no conteúdo.

A configuração anterior sem personalização (preto #000000, superfície #1e1e21, opacidade 50 e blur 8) é atualizada para o novo padrão Dim. Paletas personalizadas permanecem. Quem preferir OLED pode definir Fundo como #000000.

GlassButton recebe destructive nas exclusões/remoções de gastos, entradas, dívidas, limites, planos, divisões e nas ações já marcadas com a classe de perigo. Menus usam variant=clear e preservam role=menuitem. Ações de lançamento e status de sincronização também usam o componente. Linhas de dados, células de calendário e disclosures nativos conservam a semântica apropriada. Não foram adicionadas novas ações de exclusão nem alteradas as regras financeiras.

Cards informativos e blocos de dívidas adotam o mesmo material; os gráficos recebem tokens de grade, barras em gradiente discreto, linhas com pontas arredondadas e valores tabulares. Linhas tracejadas de meta preservam suas cores semânticas. Gráficos continuam sendo visualizações, com suas áreas de exploração acessíveis, sem efeito de botão.

Notificações fecham quando o ícone sai da área visível ao rolar, evitando uma bolha sem referência visual ao cabeçalho.

## Alinhamento e pesquisa

A coluna de navegação começa junto ao topo do workspace no desktop e fica fixa na margem reservada em telas menores. O título volta à primeira linha do conteúdo, com 20–24 px de padding superior. A coluna pode rolar em telas baixas, preservando acesso aos atalhos.

A pesquisa usa GlassInput type=search do pacote instalado, com ícone, refração moderada, foco visível e botão “Limpar pesquisa”. O evento plan-search-sync mantém seu valor controlado em React alinhado ao filtro financeiro existente. Limpar o campo atualiza a lista, e Ctrl/Cmd+K permanece ligado ao mesmo input.

Todos os elementos com classe card recebem material de vidro, inclusive formulários e disclosures, preservando suas tags e semântica. Blocos informativos, KPIs e cards internos também recebem o acabamento. As superfícies internas têm sombras/reflexos mais discretos; formulários mantêm preenchimento mais opaco. Gráficos e linhas de dados continuam sendo conteúdo.

Em telas estreitas, os rótulos do resumo de entradas ficam acima dos valores. As descrições dos lançamentos recebem uma linha própria e os valores permanecem sem quebra; os filtros do resumo conservam uma única linha.

## Menus Actions, campos e área de conteúdo

GlassMenu, API Actions do pacote 0.3.8, substitui os disparadores de adição e os menus de três pontinhos: lançamento, dívida, limite, mês, ações de registros e reorganização do resumo. Os editores de planejamento, divisão e ofertas usam o mesmo disparador e permitem abrir/fechar o formulário pelo menu. O gatilho de compra planejada é um círculo de 44 px com +, como os demais disparadores. As ações destrutivas são marcadas na prop items, e os menus mantêm teclado, Escape e interação de arraste da biblioteca. A geometria escolhe alinhamento start/end e largura conforme o espaço disponível; botões desabilitados mantêm a interação bloqueada.

window.planActionItems adapta somente comandos existentes para os controladores já validados, preservando IDs, datas e ações destrutivas. O foco volta ao gatilho antes de abrir um formulário para que o cancelamento possa restaurá-lo. Nenhuma nova exclusão ou função financeira foi adicionada.

Text fields com rótulo usam a organização visual lg-input__label / lg-input__field documentada, aplicada pelo hook público useRefraction através de GlassTextField. Os inputs, textareas e selects financeiros permanecem nativos com os mesmos IDs, names, valores iniciais, limites, validações e eventos. Essa adaptação preserva o preenchimento por importação e pelo cálculo financeiro sem introduzir uma segunda fonte de estado. O campo de pesquisa continua sendo o GlassInput oficial controlado. Visitante e código hexadecimal de cores também recebem o acabamento. Checkbox, range, cor e arquivo mantêm os controles adequados ao tipo.

A moldura externa foi removida, incluindo a borda junto à coluna Atividade recente. O workspace usa até 1800 px e reduz o espaço da coluna auxiliar; abaixo de 1200 px, ela é ocultada para ampliar o conteúdo principal. A navegação lateral e os formulários continuam disponíveis.

## Moldura restaurada e cards ampliados

A área de Atividade recente foi removida da estrutura. O workspace voltou a ter borda, cantos arredondados e sombra discreta, mantendo apenas navegação e conteúdo na grade. A área antes reservada à coluna auxiliar agora pertence aos cards em todas as abas. Em telas pequenas, a moldura usa padding reduzido para preservar o espaço de leitura. Não há alteração em dados, notificações ou cálculos.

## Progresso por categoria — referência de vidro arredondado

As barras de limite usam trilho em cápsula de 42 px, preenchimento translúcido arredondado, reflexo superior e sombra discreta, com o status centralizado como na referência enviada. A imagem é somente referência visual; não foi incorporada como textura.

Ao atingir ou ultrapassar o limite, trilho e preenchimento ficam inteiramente vermelhos, com texto branco e indicação Limite atingido/Acima do limite. A condição é comparada em centavos; categorias sem limite não ficam vermelhas. A porcentagem exibida tem até uma casa decimal, sem arredondar antecipadamente para 100%. O estado de 80% não usa mais a cor vermelha da barra. Redução de movimento e transparência são respeitadas.

## Organização unificada

Compras reúne Ofertas e Carrinho. Configurações → Layout contém o único GlassSwitch de aparência: o atributo data-theme do ancestral, conforme o README da biblioteca 0.3.8, troca tanto os tokens do vidro quanto o fundo/textos da página. Extratos, Open Finance e relatórios são seções do mesmo card financeiro. Assinaturas fica no perfil Você. A engrenagem usa área de 44 px com ícone centralizado.

## Opções animadas e área social

Identidade, Layout e Dados e relatórios são opções da engrenagem. Os painéis animam a expansão e mantêm o conteúdo fechado inerte. Assinaturas fica antes de Apoio no perfil; Amigos compartilha a barra com perfil e notificações e preserva o fluxo de divisão.

### Paletas e controles de dados
Layout agora oferece paletas coordenadas de outono/inverno, com Branco envelhecido como padrão. A seleção usa GlassButton com aria-pressed, amostras e marcação visível; não usa o seletor nativo quadrado de cores. Mantidos ThemeSwitch e GlassSlider. Cards/formulários do carrinho compartilham raios de 28px e controles em pílula. A confirmação de zerar/excluir usa dialog modal com foco nativo, campos rotulados e botões destructive.

### Pesquisa e Amigos
A pesquisa saiu do cabeçalho e passou para um botão circular na barra de tarefas. O dialog usa a mesma superfície de formulário, campos rotulados, raios e controles GlassButton do aplicativo; inclui filtros e resultados. O formulário expandido do carrinho remove a borda do details e recorta o conteúdo pelo raio do card. Amigos oferece apenas a criação de divisões com amigos aceitos, além do compartilhamento de dívida por texto/link. Identidade unifica dados e sessão.

### Pesquisa em pílula
O overlay de pesquisa mostra somente a pílula central de entrada e um círculo de três pontos. GlassTextField mantém o material do campo e GlassButton o botão de filtros. Opções avançadas e resultados aparecem num painel arredondado abaixo; o campo permanece centralizado. Menus de formulários usam Fechar; compartilhar usa a marca gráfica de seta saindo do quadrado.

### Expansão direta
Cabeçalhos primários de Configurações usam geometria compacta de pílula quando recolhidos e raio de card quando abertos. Formulários expansíveis usam GlassButton direto: ícone original recolhido, menos ao expandir, retorno ao ícone original ao fechar. Menus de ações contextuais continuam separados desse comportamento.

### Campos essenciais e opções

`ProgressiveFields` organiza formulários existentes em campos básicos, detalhes e ações. Usa o botão Glass do sistema com três pontos/menos, nome acessível e `aria-expanded`/`aria-controls`. Os controles avançados permanecem montados e habilitados para preservar valores e validação. Pílulas usam o mesmo material e cores do layout; em telas pequenas o botão fica acima dos campos para manter a largura de preenchimento. Confirmações destrutivas e revisão obrigatória da nota não são recolhidas.

### Menu de conta e painéis sobrepostos

O atalho da foto usa um menu Glass com ícones à direita e Sair separado. Perfil, Integrações e Configurações abrem um dialog nativo com o material e paleta atuais, blur no fundo e borda discreta. Configurações usa abas sublinhadas Conta/Notificações; os quatro controles de avisos usam GlassSwitch. Painéis adaptam a largura até 320 px, limitam a altura à janela e respeitam redução de movimento. O perfil mostra apenas informações, estrelas, badges e cards, sem texto de ajuda.

### Ações estáveis no menu e Relatórios

O material Glass é aplicado no contêiner do menu; as opções usam botões nativos para evitar interferência dos efeitos no toque e na propagação. O menu mantém o mesmo desenho e inclui Relatórios entre Integrações e Configurações. Relatórios e exportações abrem no painel sobreposto, com resumos expansíveis e geometria adaptada ao celular.

### Indicadores em arco e aba Layout

`ProgressGauge` compartilha o mesmo SVG de arco aberto, pontas redondas, gradiente coordenado e tipografia nítida em categorias, hábitos e pagamentos. O indicador usa GlassSwitch; o botão de editar a categoria é separado, sem controles interativos aninhados. Rótulos e valores permanecem legíveis quando o preenchimento é ocultado. O seletor geral fica na aba Layout. Redução de movimento remove as transições e redução de transparência remove o efeito de sombra do traço. Estado de limite usa vermelho sem depender só da cor para informar o excesso.

### Crédito e investimentos

A aba usa a paleta sazonal e o material existentes: cartão de crédito visual sem dados sensíveis, seletor em pílulas, adição por + e campos básicos com detalhes nos três pontos. CDB aparece em card compacto ao lado no desktop e abaixo no celular. Datas se reorganizam conforme a largura, valores podem quebrar linha e os controles mantêm área mínima de interação. Os controles de visibilidade das abas ficam em Layout.
