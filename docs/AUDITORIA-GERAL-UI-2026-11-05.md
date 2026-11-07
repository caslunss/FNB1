Versão do documento: 0.1.0-alpha.6

# Auditoria geral da UI — 05/11/2026

> Registro do diagnóstico na versão `c85e4ae`. As correções posteriores, evidências e pendências atualizadas estão em [Migração do controlador e correções prioritárias](MIGRACAO-CONTROLADOR-E-UI-2026-11-05.md). Os problemas descritos abaixo são históricos; consulte o resultado antes de tratá-los como bugs ainda abertos.

## Versão, método e publicação

Versão integrada: `c85e4ae`. O envio para `main` foi confirmado; a integração existente deve iniciar o deploy automático da Vercel. **Não foi possível confirmar o estado Ready da Vercel:** o proxy deste ambiente recusou a conexão com o domínio público com HTTP 403. Isso não é prova de erro HTTP da aplicação em produção.

A publicação integra também o commit remoto `dd69081`, que trouxe loading HTML anterior ao React, loading sem texto e cabeçalhos foscos. Conflitos de Login/Startup foram resolvidos preservando o login centralizado sem títulos decorativos e o loading novo. Não houve force-push. Quotas pagas exigem a migração/credencial de servidor descritas em `database/INSTALLATION.md`; sem elas, os novos handlers respondem 503. Não foi executada instalação no Supabase.

**Escopo desta auditoria:** login, loading, navegação superior/inferior, componentes universais, notificações, perfil/assinaturas, configurações, calendários, Análise, estilos e mídias legadas. Combinei leitura de código, capturas e probes de navegador. Esta entrega indica correções e remoções; não executa uma segunda reformulação visual ou exclusão de recursos durante o deploy.

**Evidência:**

- Testes do projeto, TypeScript, CSS, build, release e orçamento de bundles aprovados.
- 36 estados capturados no build candidato: 320/1440 px × claro/escuro × Impostos, Relatórios, recurso aposentado, perfil/assinaturas, calendário, notificações, Layout, login e login visitante. A contagem é de capturas, não de auditoria manual exaustiva de todos os pixels.
- Depois da integração remota: login em oito combinações; startup/dívida/persistência; 76 estados de controles compartilhados, incluindo foco, seleção e compactação/expansão da barra mobile, aprovados.
- Probes adicionais na versão integrada confirmaram padding das notificações, aparência do Apple desativado e falha de carregamento da logo.
- Chromium local. Não houve certificação em iPhone físico, WebKit nesta sessão, leitor de tela real, todas as paletas customizadas ou todas as resoluções intermediárias. Contraste sobre fundos variáveis precisa de medição específica.

Prioridades: **P1** = quebra de ação/leitura/recuperação relevante; **P2** = inconsistência e usabilidade; **P3** = manutenção/acabamento. Uma recomendação ou nome de classe antigo não é automaticamente um bug ativo.

## 1. Diagnóstico resumido

A direção Liquid Glass está definida e os principais controles foram unificados. O problema central restante é **a distribuição da responsabilidade visual**: tokens, Tailwind, classes da biblioteca, estilos globais antigos, exceções de páginas e inline styles competem para definir o mesmo elemento. Há 609 declarações `!important` inventariadas; elas não correspondem a 609 bugs, mas elevam o custo de prever a cascata.

O login é o exemplo mais claro de herança acumulada: CSS de card estreito antigo, versão fullscreen dividida e composição centralizada atual continuam carregados. Notificações demonstram um efeito concreto dessa disputa: o componente passa o padding padrão inline da biblioteca e a regra CSS que tenta removê-lo perde.

A prioridade deve ser corrigir estados e contratos dos componentes, depois remover camadas comprovadamente sem consumidor. Não recomendo trocar todo o tema, apagar estilos globais em massa ou remover todos os `!important` de uma vez.

## 2. Bugs e problemas de UI confirmados

### U1 — P2 — Notificações maiores do que o padding declarado

**Arquivos:** `src/components/NotificationCenter.tsx:19`, `src/styles/notification-center.css:8`, `src/components/LiquidControls.tsx:30`.

O CSS declara `padding:0` para `.notification-card`, mas `GlassCard` fornece padding inline padrão de 24 px. O botão interno ainda adiciona 12 px. No probe, o resultado foi:

```text
computed padding: 24px
inline padding: 24px
```

A captura mobile mostra cards altos e menos conteúdo visível; o recorte inferior exige mais rolagem. Isso não demonstra dados apagados: há lista com scroll interno, mas a compactação solicitada não está sendo plenamente respeitada.

**Correção recomendada:** declarar o padding pela API do card, mantendo o espaçamento apenas na linha interna:

```tsx
<Card padding="0px" className="notification-card ...">
  <button className="notification-row ...">...</button>
</Card>
```

Verificar também padding de cards em Configurações e campos dentro de outros cards. Não adicionar outro `!important` como primeira solução. Aceite: `getComputedStyle(card).padding === '0px'`, toque mínimo preservado, texto longo e três filtros testados em 320 px.

### U2 — P2 — Logo pode desaparecer sem fallback

**Arquivos:** `src/components/Login.tsx:23`, `:35`; `src/styles/login-fullscreen.css:54`.

A imagem só ganha opacidade 1 no `onLoad`. Se o WebP selecionado no `<picture>` falhar, não há `onError`/estado alternativo que apresente a identidade ou tente o PNG. Um `<source>` suportado com erro de rede não garante troca automática para o `<img>` de fallback.

Probe com requisição da arte bloqueada:

```text
complete: true; naturalWidth: 0; opacity: 0
```

**Correção recomendada:** estado de erro com uma tentativa explícita de PNG e fallback acessível após falha definitiva. Preservar a mesma caixa para não gerar salto. Não deixar spinner infinito nem tornar o login dependente da imagem.

```tsx
// Esboço: ao falhar o formato preferido, renderizar um img PNG sem o source.
const [fallback, setFallback] = useState(false);
// No primeiro erro: setFallback(true). No segundo: mostrar fallback acessível.
```

A logo continua corretamente centralizada quando carrega; o problema é o estado de erro.

### U3 — P2 — Apple desativado parece uma opção ativa

**Arquivos:** `src/components/Login.tsx:38`, `public/assets/login-design.css:9`.

O botão tem `disabled`, mas CSS com `opacity:1` e imagem do botão oficial mantém o mesmo destaque de uma ação utilizável. Probe: `{disabled:true, opacity:'1', title:''}`. A indisponibilidade existe no `aria-label`, mas não aparece como explicação visual permanente.

**Melhoria:** esconder a opção até ativá-la, se essa for a decisão de produto, ou apresentar estado indisponível e explicação curta. Não mostrar sucesso ou simular login Apple. Não aplicar o estilo dos botões genéricos ao iframe oficial Google para resolver este caso.

### U4 — P3 — Configuração de calendário usa terminologia antiga

**Arquivo:** `src/components/LayoutSettings.tsx:15`.

A seção se chama “Abas” e o switch diz “Mostrar aba Calendário”, mas o calendário é um atalho no topo e abre popup. Cartões/recurso aposentado também ocupam níveis diferentes da navegação.

**Correção:** seção “Visibilidade” e rótulos por efeito real: “Mostrar calendário no topo”, “Mostrar Cartões em Compromissos”, “Mostrar recurso aposentado em Análises”. Não alterar as chaves persistidas para corrigir apenas texto.

### U5 — P2 — Ações semelhantes ainda podem abrir caminhos com quantidade diferente de cliques

**Arquivo:** `src/components/FinanceView.tsx:337`.

O adaptador converte certos `data-a="sheet"` em menus, exceto os marcados como diretos. Adicionar dívida já foi corrigido para abrir diretamente; não está sendo reportado como quebrado novamente. A regra genérica continua existindo para outros tipos.

**Risco UX:** o mesmo símbolo “+” pode significar abrir formulário ou abrir uma escolha intermediária. Revisar cada ocorrência: menu faz sentido quando há múltiplas ações reais; um menu com uma única ação normalmente adiciona clique sem benefício. Não remover menus de contexto que contêm operações distintas ou destrutivas.

### U6 — P2 — O suporte de acessibilidade dos calendários é parcial, apesar do estilo compartilhado

**Arquivos:** `src/components/DatePicker.tsx:43`, `MonthPicker.tsx:14`, calendário de eventos em `src/finance/workspace.tsx`.

Há botões nomeados, limites e retorno de foco. Isso é positivo. Contudo, o seletor de dias não implementa navegação espacial por setas/Home/End; o usuário de teclado percorre os dias com Tab. `MonthPicker` tenta focar a seleção ao abrir; `DatePicker` não usa a mesma política.

Classificação: melhoria de navegação, não prova de teclado completamente bloqueado. Padronizar foco inicial, atalhos e anúncio do período. Se adotar `role=grid`, implementar o comportamento de teclado correspondente, sem adicionar ARIA apenas por estética.

### U7 — P2 — Título mobile desaparece sem liberar sua linha

**Arquivos:** `src/styles/mobile.css:10`, `src/components/MobileExperience.tsx:11`.

O título recebe opacidade/translate na rolagem; a linha da grid continua ocupando espaço. Isso pode parecer uma faixa vazia ao lado/abaixo dos controles sticky. Não é a barra inferior deslocada: a navegação fixa passou nos testes.

Decidir se o título deve permanecer compacto ou sair do sticky, deixando só a linha de ações. Evitar animar altura a cada pixel de scroll. Verificar reduced motion: a preferência deve reduzir também deslocamentos de conteúdo associados ao scroll, não apenas transitions CSS.

## 3. Melhorias por área

| Área | O que preservar | Melhoria recomendada | Verificação de aceite |
| --- | --- | --- | --- |
| Login | Guaxinim centralizado, paleta, labels e erros funcionais | Reduzir estados visualmente vazios; fallback da arte; indisponibilidade Apple clara | Rede lenta/falha de imagem, Google indisponível, visitante aberto, zoom 200% |
| Loading | HTML antes do JS e erro recuperável no React | Mesma imagem canônica/escala nas fases; um contrato de pronto/local/erro | Rede lenta sem duplicação visual de logos nem “aplicativo pronto” falso |
| Navegação mobile | Cinco destinos, labels acessíveis, compactação ao scroll | Título sticky com espaço útil; descoberta dos ícones; indicador de rolagem em subabas | Seleção longa visível e todos os destinos alcançáveis em 320 px |
| Barras de opções | FinanceOptionBar, seleção única e foco | Separar semanticamente navegação, filtros e toolbar de ações | `aria-current`, `aria-selected` e `aria-pressed` usados conforme função |
| Notificações | Dados reais, agrupamento, Limpar, filtros, unread e glow de erro | Corrigir padding; reduzir sombras empilhadas; ajustar settings do rodapé ao pouco espaço | Texto longo, lista vazia, erro, filtros vazios e scroll sem prender a página |
| Perfil | Card flutuante, fallback de foto, notas e badges | Limitar altura de listas históricas; manter ações importantes visíveis | Nome longo, sem foto, histórico grande, teclado e mobile curto |
| Assinaturas | Agrupamento dos lançamentos e aviso sobre o fornecedor | Resumo mais enxuto; separar “sem registro no mês” de assinatura cancelada | Não inventar status de plano ou pagamento a partir da ausência de gasto |
| Configurações | Persistência, switches e feedback atual | Hierarquia por finalidade; mensagens locais perto do controle; separar recuperação de personalização | Erro de storage, mudança de tema, painel longo e leitor de tela |
| Análise | Grid corrigida, indicadores consistentes e cards por seção | Melhor aproveitamento dos gráficos vazios; fontes/limitações junto aos dados; filtros visíveis | Valores grandes, sem estimativas, meses fechados e períodos diversos |
| Lançamentos | Campos progressivos, foco e scroll com teclado | Identificar com clareza quais campos estão ocultos e serão necessários | Validação de campo escondido abre a seção e foca o campo |
| Calendário | Mesma linguagem visual e datas reais | Motor comum de foco/limites, sem fundir eventos com seleção de data | Limites mínimo/máximo, hoje, vencimentos e eventos múltiplos sem duplicação |
| Busca/Compras | Fonte/preço confirmado e entrada manual | Skeleton apropriado, estados sem resultados/cota/serviço indisponível distintos | Mensagem útil em 429/503 e ação de voltar ao cadastro manual |

Contraste e blur: testar cada material com o fundo real e preferências de baixa transparência. Não classificar texto como aprovado WCAG apenas porque usa um token. Camadas foscas sobre camadas foscas podem elevar o custo de composição e reduzir legibilidade sem adicionar informação.

## 4. Sistemas duplicados ou sobrepostos

### 4.1 Login: três gerações de estilo carregadas

`login-entry.css:4` importa `login-base.css`; `:6` importa `public/assets/login-design.css`; `:11` importa `login-fullscreen.css`. Todas contêm regras para shell, marca, fundo ou proporção.

- Base antiga: card estreito e avatar.
- Versão fullscreen: introdução à esquerda e acesso à direita.
- Atual: uma coluna centralizada e guaxinim.

A página atual funciona por precedência, não por ausência do código antigo. **Recomendação:** criar um contrato de login atual e migrar somente seus estilos ativos; manter imports de tokens, acessibilidade e provedor. Não apagar `login-design.css` inteiro: ainda contém estilos de Google/Apple, erros e shade usados.

### 4.2 Loading: duas fases reais, com apresentação duplicada

`index.html:10` contém `.app-loading`; `StartupScreen.tsx` renderiza a fase React. A primeira cobre o intervalo anterior ao JavaScript; a segunda acompanha inicialização/erro.

Não são cópias descartáveis do mesmo componente. Remover o fallback HTML pode devolver tela vazia em rede lenta. Consolidar imagem, dimensões, cores e transição; explicitar quando uma fase entrega à outra. O preload/PNG da fase HTML e o WebP do login hoje não compartilham o mesmo recurso de rede.

### 4.3 Botões: camada universal + adaptador + nativos especiais

`LiquidControls.tsx` contém FinanceGlassButton, FinanceFieldButton, FinanceTabButton e FinanceCalendarButton. Os nomes parecem repetidos, mas atendem a contratos diferentes: ação, combobox, navegação fixa e grade de datas.

O que deve ser removido gradualmente é a pintura redundante em `.btn`, `.ib`, seletores globais e overrides locais já absorvidos pelos controles universais. Não substituir todos por um único botão genérico: isso pode restaurar reflexos duplicados em campos ou destruir a geometria dos calendários.

### 4.4 Menus: moderno e imperativo coexistem

`FinanceActionMenu` usa GlassMenu. O controlador ainda possui `openMenu/closeMenu`, o host `#menu` e comandos do catálogo `MENU`.

Migrar os consumidores restantes para um mecanismo e depois remover o host legado, handlers e regras correspondentes. **Não apagar `MENU`:** o catálogo também alimenta os menus modernos, então a existência de um renderer antigo não significa que seus dados são mortos.

### 4.5 Perfil: host antigo e overlay atual

`WorkspaceLayout.tsx:29` mantém `#profileMenu` oculto. O perfil atual usa `#accountOverlay[data-panel=profile]`. Na busca dos caminhos atuais, não encontrei abertura do host antigo; restam CSS e observação de motion.

É um candidato forte a remoção conjunta de host + estilos + observer, mas precisa de regressão de abrir perfil/configurações, sair, Escape e retorno de foco. O nome `.profile-hover-card` também ficou antigo: o design atual não precisa recuperar o antigo efeito de imagem em hover para justificar esse nome.

### 4.6 Animações: fontes de execução distintas

Há `page-motion.ts`, componentes em `components/motion`, CSS universal e `public/assets/page-motion.css`. Os presets já são centralizados; nem todos esses arquivos são redundantes.

Mapa recomendado: React controla componentes próprios; ponte imperativa anima apenas roots do controlador antigo; CSS cobre estados nativos/fallback. Remover somente animações superseded de um alvo depois de demonstrar seu novo owner. Preservar prefers-reduced-motion e a compatibilidade com o fluxo que ainda exige commit síncrono.

## 5. Inventário de remoção — confiança e precauções

| Candidato | Evidência de legado | Ação indicada | Risco |
| --- | --- | --- | --- |
| `public/assets/login-light-loop.mp4` e `login-dark-loop.mp4` | Login atual não renderiza vídeo; sem referência ativa encontrada | Remover do artefato público após checar uso externo | Baixo no app; reduz artefato, não prova redução do download inicial |
| `public/assets/login-light.jpg` e `login-dark.jpg` | Fundo atual é gradiente; sem referência ativa na UI atual encontrada | Remover ou arquivar fora de public | Baixo com teste claro/escuro |
| `public/assets/tefinance-logo.png` | Nenhum consumidor atual de produção encontrado após a troca de marca | Arquivar master fora de public ou remover do build | Baixo; preservar original se houver uso de marca externo |
| `.login-avatar` e `.login-background` | Elementos correspondentes não estão no Login atual | Remover seletores específicos, mantendo shade/provedores | Baixo/médio pela folha misturada |
| `.login-introduction`, `.login-eyebrow`, `.login-benefits` | Textos decorativos removidos do componente | Remover blocos e seus media queries isolados | Baixo após busca de referências |
| `.login-brand`, `.login-raccoon` antigo | Login central usa `.login-logo-slot`/`.login-logo-art` | Remover regras do cabeçalho anterior | Baixo; não remover a nova arte de loading por causa do nome parecido |
| `.login-center-art` | Imagem central provisória antiga não é mais renderizada | Remover máscara/fade antigos e media query correspondente | Baixo |
| `.startup-progress` e `startup-pulse` | Loading integrado atual não renderiza progress bar | Remover conjunto do CSS e teste se houver expectativa antiga | Baixo após confirmar estado de erro |
| `.reports-panel ...` | Não encontrei aplicação dessa classe no JSX/TS atual | Remover por seletor ou migrar regras necessárias para `analysis-content` | Médio: conteúdo do relatório existe; o selector pode estar morto enquanto a intenção visual continua necessária |
| `#profileMenu` e `.profile-menu` | Sem abertura encontrada; perfil usa dialog | Remover host, CSS e ramo de motion em conjunto | Médio; testar consumidores e extensões |
| `#menu`/renderer imperativo | Sobreposição com GlassMenu, mas handlers/catalogo ainda ativos | Migrar antes de remover | Alto se removido isoladamente |
| `.btn`/`.ib` e classes de biblioteca | Ainda mantêm geometria e contratos do adaptador | Não apagar em massa; mapear por componente | Alto |

Os vídeos antigos somam aproximadamente 4 MB, além da marca anterior (~792 KiB) e JPGs. Esses arquivos estão no artefato público, mas não demonstraram tráfego inicial nas páginas atuais: tamanho de deploy não é o mesmo que bytes baixados na navegação.

Há também **três arquivos da nova identidade**: `login-raccoon.png` para loading, `raccoon-logo.png` como fallback e `raccoon-logo.webp` no login. Antes de remover um, escolher uma arte canônica e atualizar preload, HTML, React e testes juntos. São variantes/exports da identidade, não três recursos automaticamente intercambiáveis.

## 6. Componentes que parecem duplicados, mas devem permanecer

- `MonthPicker`, `DatePicker` e calendário de eventos: seleção de mês, campo de data e agenda financeira são funções diferentes. Compartilhar ícone, limites, formato e foco não exige fundi-los num componente enorme.
- `FinanceSelect` e `select` oculto: o nativo mantém FormData, validação e integração; não é lixo visual. Há fallback nativo para `multiple`, `size` ou filhos que não são options (`FinanceSelect.tsx:13`). Verificar exceções antes de prometer a mesma UI em todos os casos.
- `FinanceOptionBar` e `ui-toolbar`: escolha exclusiva e grupo de ações não são o mesmo padrão. A correção tributária já separou esses papéis.
- Classes da biblioteca Liquid Glass e wrappers da aplicação: wrappers são a fronteira de customização. Remover toda a CSS da biblioteca quebraria switches, sliders, menus e surfaces.
- Tailwind e tokens: utilitários definem estrutura; tokens definem material/tema. A duplicação problemática é definir a mesma propriedade em vários owners, não a coexistência das duas ferramentas.
- Avisos de privacidade, cobrança e dados aproximados: simplificar redação sem apagar consequências financeiras ou converter ausência de informação em zero.

## 7. Ordem recomendada da próxima rodada de UI

1. Corrigir padding das notificações pela API do card e o fallback da marca. São estados concretos, localizados e verificáveis.
2. Definir a decisão visual do Apple desativado; revisar feedback de indisponibilidade das integrações, inclusive quotas.
3. Consolidar o login atual, removendo seletores sem consumidores e mídias antigas de public. Comparar antes/depois preservando o resultado atual.
4. Canonizar branding/loading para evitar baixar versões grandes desnecessariamente, mantendo fallback antes do JS.
5. Melhorar cabeçalho mobile, descoberta dos ícones e barras longas sem recolocar blur em ancestrais que alterem a referência de elementos fixed.
6. Padronizar foco/teclado dos calendários e linguagem das configurações.
7. Migrar renderer de menus e host antigo do perfil, com cobertura de Escape, backdrop e retorno de foco.
8. Reduzir exceções CSS por família de controle, com orçamento decrescente e regressão visual. Evitar uma reescrita do tema durante essa limpeza.

Critério de conclusão: mesma identidade estática, funcionalidades financeiras preservadas, sem overflow da página, controles alcançáveis, estados de erro/disabled/empty explícitos e testes com claro/escuro, mobile, teclado, reduced motion e transparência reduzida.

## 8. Limites do relatório

Os bugs de padding, falha da logo e aparência do Apple foram reproduzidos. A classificação de código removível usa referências estáticas e caminho de execução conhecido; precisa de confirmação de uso externo antes de excluir recursos públicos. Melhorias de hierarquia, densidade e descoberta não são apresentadas como falhas funcionais comprovadas.

A auditoria não conclui que todas as telas estão defeituosas, nem que todos os estilos antigos podem ser apagados. A implementação atual já contém correções válidas de scroll, foco, seleções fechadas, grade tributária e barra mobile; essas proteções devem permanecer durante a limpeza.
