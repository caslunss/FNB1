# Perfil, opções de configuração, Amigos e Carbono — 29/10/2026

- Identidade movida para opção na engrenagem, incluindo @usuário. Dados e relatórios agrupa importação, exportação, extratos, Open Finance e histórico mensal.
- Layout e demais opções usam painéis animados com acessibilidade/inert, respeitando redução de movimento. Tema e ajustes continuam unificados.
- Perfil: identidade resumida, assinaturas e Apoio nessa ordem. Amigos sai da navegação financeira e integra a barra do perfil/notificações, preservando divisões e convites.
- Carbono substitui Bolsa, com card parcial do mês e histórico dos lançamentos. Emissões são estimativas informadas pelo usuário em kg CO₂e, com fonte opcional; desconhecidas ficam pendentes. Não há cálculo automático baseado no preço ou API de emissões.
- Registros de carbono usam chave isolada plan12carbon_v1 no armazenamento da conta neste dispositivo (sessão para visitante). Não fazem parte do snapshot financeiro, backup financeiro ou sincronização Supabase. Valores até três casas decimais, não negativos, validados e armazenados em gramas. Parcelas exigem alocação manual para evitar contar toda a compra várias vezes.
- Chrome: opções de Identidade/Layout, troca de tema, Amigos e ordem Assinaturas/Apoio conferidos. Registro de 2,5 kg CO₂e exibido no card. Build e git diff --check aprovados. Regras financeiras preservadas.

---

# Compras e configurações unificadas — 29/10/2026

- Compras reúne pesquisa de ofertas e carrinho na mesma página; atalho duplicado removido e rota anterior de ofertas direcionada a Compras.
- Um único GlassSwitch em Configurações → Layout controla data-theme da página e os tokens da biblioteca. Ajustes de vidro e cores permanecem nessa seção.
- Extratos, Open Finance e relatórios mensais reunidos em um card; assinaturas movidas para Você. Engrenagem centralizada em área de 44 px.
- Chrome: alternância real de tema para dark, presença de Ofertas/Carrinho na página Compras, Assinaturas no perfil e agrupamento financeiro conferidos. Build e git diff --check aprovados. Regras financeiras e Supabase preservados.

---

# Correção dos seletores do Resumo e Você — 29/10/2026

- Restaurada a grade de partes iguais exigida pela lente da biblioteca, removendo flex-wrap e gaps herdados que desalinhavam o indicador.
- Troca de conteúdo adiada até o fim do evento da biblioteca; foco restaurado no item selecionado após renderizar. Índices inválidos são ignorados.
- Chrome: larguras iguais e gap zero conferidos no Resumo e Você, seleção Comportamento, troca pelo teclado e abertura de Relatórios. Build de produção aprovado.
- Nenhuma alteração financeira.

---

# Progresso de limites em vidro — 29/10/2026

- Barra em cápsula com acabamento fosco, reflexos e status central, baseada na imagem enviada.
- Vermelho integral apenas ao atingir/ultrapassar 100%; texto branco e indicação explícita. Sem limite permanece neutro. Comparação e proporção em centavos, sem alteração dos dados financeiros.
- Teste de regressão aprovado: 99,5%, 99,99% antes do limite, 100%, excesso, valor zero e categoria sem limite. Corrigida imprecisão que podia exibir 99,4% em vez de 99,5%.
- Chrome: configurado limite de R$ 20 para gasto de R$ 19,90 (99,5%, sem vermelho), depois limite de R$ 19,90 (Limite atingido, preenchimento 100% vermelho). Categoria acima do limite conferida em modo escuro e largura de 320 px, sem transbordamento.

---

# Moldura restaurada e cards ampliados — 29/10/2026

- Restaurada a borda de 1 px, cantos arredondados e sombra discreta do workspace.
- Removida a área Atividade recente da estrutura; o conteúdo recebe toda a largura antes reservada à coluna auxiliar. A grade mantém apenas navegação e conteúdo em todas as larguras.
- Renderização de atividade deixa de ser executada quando a área está ausente; notificações e dados financeiros preservados.
- Build de produção e git diff --check aprovados. Chrome: 320, 768 e 1440 px, com moldura visível, ausência da coluna e sem transbordamento horizontal; desktop escuro conferido. Não houve alteração de regras financeiras.

---

# Actions, campos com rótulo e conteúdo ampliado — 29/10/2026

- Menus reais GlassMenu para adição e três pontinhos; Actions inclui opções existentes e destructive nas remoções. Reorganização do resumo e abertura/fechamento dos editores usam a mesma API. Gatilhos circulares de 44 px e alinhamento adaptado ao espaço disponível.
- Campos com rótulo recebem o material e a estrutura visual documentada, preservando inputs/selects/textareas nativos, constraints e eventos usados na importação e no motor financeiro. Pesquisa usa GlassInput oficial.
- Moldura externa removida, conteúdo ampliado e coluna Atividade recente mais discreta, ocultada abaixo de 1200 px.
- Build e 13 suítes aprovados. Conferência manual Chrome: menu Entrada/Gasto, salvar gasto de R$ 12,34, editar com valor recuperado e cancelar; editar e salvar compra planejada; dividir R$ 100,01 em três partes de R$ 33,34/R$ 33,34/R$ 33,33.
- Conferência mobile em 320 px: menu de lançamento pelo teclado, formulário entre 12 e 308 px e campos internos sem transbordamento; menu de compra planejada e seus 11 campos dentro da tela. Menu de reorganização do resumo também conferido.
- Auditoria Chrome: 108 combinações de nove telas, seis larguras e dois temas sem falhas nos critérios de transbordamento, alinhamento, ícones, altura do título e cards com material. Corrigido também o aviso de key do React nos rótulos dos campos.
- Alterações limitadas à apresentação e à ponte dos comandos; sem mudança em Supabase, formato de dados ou regras de cálculo. Safari/Firefox e aparelhos físicos não foram testados.

---

# Alinhamento, coluna de conta e pesquisa — 29/10/2026

- Removida a linha vazia de cabeçalho que deslocava todas as páginas. Perfil e notificações estão acima das abas na mesma coluna lateral, sem ocupar altura no conteúdo principal.
- Popup de notificações abre ao lado da coluna e ajusta sua largura ao espaço disponível. A coluna rola em telas baixas.
- Pesquisa trocada pelo GlassInput documentado da biblioteca, com ícone, foco, limpeza em português e sincronização do valor com o filtro financeiro. Conferidos filtro por Assinatura (um registro) e limpar (três registros).
- Todos os elementos card recebem o acabamento, inclusive formulários e disclosures; KPIs e blocos internos usam vidro mais discreto. Preservada a semântica de formulários e a opacidade de edição.
- Em 320 px, corrigidas quebras de valores no resumo de Entradas e reorganizada a lista em descrição/valor/ações. O seletor do Resumo mantém as duas opções alinhadas na mesma linha.
- Build de produção e 13 suítes de regressão aprovados. Nenhuma alteração no formato ou cálculo dos dados financeiros, autenticação ou Supabase.
- Auditoria Chrome: 108 combinações (nove telas, seis larguras e dois temas) sem falhas nos critérios de transbordamento, ícones, altura do título, posição da coluna e cards sem o material. Após o ajuste estreito, as 36 combinações de celular foram repetidas sem falhas, com conferência visual dos filtros e valores em 320 px.
- Chrome: navegação de perfil/configurações, modo escuro, pesquisa, limpeza e notificações conferidos manualmente. Demais limitações de Safari/Firefox e aparelhos físicos permanecem.

---

# Cabeçalho integrado, Dim e revisão dos controles — 29/10/2026

- Barra de perfil/notificações integrada ao fluxo do cabeçalho, com linha reservada antes do conteúdo em todas as larguras. Popup fecha se o ícone sair da área visível.
- Modo escuro Dim em grafite com superfícies elevadas, bordas discretas e GlassSlider de suavidade. Separação do reflexo e do preenchimento dos hosts para que o slider funcione sem reduzir a legibilidade do conteúdo.
- GlassButton destructive nas ações destrutivas existentes; menus com variant=clear e role preservado. Ações de lançamento, sincronização e organização também usam os componentes. Sem novas operações de exclusão.
- Cards informativos e de dívidas com o mesmo material, refração moderada e gráficos com linhas, grades e barras consistentes; linha de meta mantém sua cor. Cálculos e regras financeiras preservados.
- 13 suítes aprovadas, incluindo 150 combinações de contraste e migração do antigo padrão OLED sem alterar paletas personalizadas. Build de produção aprovado.
- Conferência manual em Chrome: slider de suavidade até 100%, opacidade do reflexo efetivamente alterada; menu destrutivo com 44 px e rótulo vermelho; editar/cancelar gasto; lançar/cancelar; reordenar cards; gráfico de dívidas; popup ancorado ao cabeçalho e fechamento na rolagem.
- Auditoria Chrome: 108 combinações de nove telas, seis larguras e dois temas sem falhas nos critérios de transbordamento, aba ativa, ícones e separação entre cabeçalho/barras/conteúdo. Editor e slider abertos em 320 px sem campos fora da tela. git diff --check aprovado.
- Referências e detalhes em LIQUID-GLASS.md. Não houve alteração de Supabase, credenciais ou formato financeiro. Safari/Firefox e aparelhos físicos não foram testados.

---

# Layout personalizável e barra de conta — 29/10/2026

- Perfil e notificações em barra horizontal independente; popup ancorado abaixo do ícone e controles inativos durante formulários modais.
- Vidro escuro neutro sobre fundo preto e GlassSwitch com aparência padrão da biblioteca.
- Configurações → Layout: cores por tema, opacidade, desfoque, refração e restauração do padrão. Preferências locais separadas dos dados financeiros, validadas e com preservação do estado quando a gravação falha.
- Contraste de texto/ícones calculado para as superfícies escolhidas; controles de formulário permanecem mais opacos.
- Validação: 13 suítes aprovadas, incluindo 150 combinações de contraste e tratamento de preferências inválidas/falha de armazenamento. Build concluído e git diff --check sem problemas. Chrome: 108 combinações de nove telas, seis larguras e dois temas sem falhas nos critérios de transbordamento, navegação e sobreposição das barras. Editor aberto em 320 px sem campos fora da tela.
- Fluxos manuais: edição de cor hexadecimal, refração, restauração, troca de tema pelo teclado e popup de notificações. Nenhuma mudança nas regras financeiras, Supabase ou credenciais. Não foram realizados testes em aparelhos físicos ou Safari/Firefox.

---

# Integração Liquid Glass — 29/10/2026

Biblioteca solicitada @zakisheriff/liquid-glass 0.3.8 instalada e fixada no lockfile. Aplicados GlassButton, GlassCard, GlassSegmented, GlassSwitch e os hooks documentados para superfícies/controles personalizados. Os eventos de troca de tema e segmentos são conectados aos controladores existentes; a barra continua vertical.

Validação: 12 suítes passaram, build de produção concluído e git diff --check sem problemas. Chrome: 108 combinações (nove telas, seis larguras, dois temas), sem falhas nos critérios de transbordamento, ícones visíveis, aba ativa e posição vertical do título. Os dados de QA são sintéticos e não entram na publicação.

Fluxos manuais: filtro Gastos, perfil/relatórios, alternância de tema com clique e Space, salvamento de gasto de R$ 12,34, divisão de R$ 100,01 em três partes e conferência visual do resumo e login. Corrigidos conflitos de CSS antigo com a posição dos hosts de vidro e os spans de ícones da barra.

Formulários continuam opacos para leitura. Gráficos e linhas de dados não foram transformados em controles. Preferências de redução de transparência e movimento têm tratamento CSS. As limitações de validação das integrações reais e de Safari/Firefox continuam as mesmas; não foi alegado aspecto idêntico entre navegadores. Consulte LIQUID-GLASS.md.

---

# Migração React — 29/10/2026

- React 19 + Vite 8, entradas separadas de login e aplicativo, JSX para a estrutura e login.
- Renderização de conteúdo financeiro por elementos React; templates escapados adaptados em TemplateView. Controladores financeiros preservam delegação de eventos DOM e ainda não foram todos reescritos para hooks. Essa decisão mantém as regras testadas e é descrita no README.
- Módulos separados para autenticação, sincronização, movimentos e motor financeiro. SDK Supabase instalado como dependência fixa, sem cópia UMD vendorizada.
- Mesmo formato de dados em centavos, mesmas chaves de armazenamento e mesma base Supabase; nenhuma migração SQL nova.
- npm test aprovado: 12 suítes existentes adaptadas ao código-fonte. npm run build aprovado; git diff --check aprovado.
- Chrome: 108 combinações da interface React (nove telas, seis larguras e dois temas), sem transbordamento detectado ou navegação ativa divergente.
- Fluxos manuais: visitante → resumo; criação de assinatura de R$ 10,01 em dois meses; dados preservados ao recarregar; reordenação dos cards; planejamento de R$ 2.500,01; edição com campos recuperados e cancelamento; abertura das notificações. Nenhum aviso de propriedade DOM inválida na revisão final.
- Google real, Gemini real, sincronização em dois aparelhos e Safari/Firefox não foram testados nesta migração. Google não carregou no ambiente HTTP de prévia; a entrada de visitante permaneceu funcional. A integração de produção usa o mesmo provedor, Client ID e Supabase, e exige HTTPS/domínio autorizado.
- QA local em tests/react-qa.html, sem conexão a dados financeiros reais; os arquivos de QA não são entradas do build nem arquivos de public.

---

# Revisão de estabilidade e desempenho — outubro de 2026

## Resultado

Correções pontuais sem alteração da paleta, da estrutura de páginas ou do formato dos dados financeiros.

- A análise de comportamento volta a habilitar o botão após falhar, inclusive quando a tela foi recriada durante a requisição. O erro fica associado ao período analisado.
- Buscar outro produto sem preço confirmado limpa o preço anterior e pede preenchimento manual. A simulação é atualizada ao receber o produto.
- Sincronização e virada do dia aguardam revisões de CSV, confirmação de compra, análise e formulários abertos antes de recarregar a interface.
- Gráfico diário agrupa os valores por data em uma passagem, preservando exatamente o SVG e os centavos. Na fixture com 10 mil registros, as leituras de data caíram de 620 mil para 10 mil.
- Parcelas de dívida são calculadas diretamente, sem construir todas as parcelas a cada consulta mensal. A distribuição dos centavos permanece igual.
- O gráfico de período calcula uma vez cada total mensal. A simulação de compra aguarda 120 ms após a digitação, evitando recalcular a cada tecla.
- Removido um mapa de descrições que não era utilizado na renderização.

## Verificação

As 12 suítes em tests passaram: finanças (45 cenários), login (15), sincronização (18), comportamento, perfil, layout do perfil, modal, período, divisão, comunidade, backend de pesquisa e revisão adicional (5 cenários). JavaScript inline e git diff --check também passaram.

A revisão no Chrome cobriu 108 combinações: nove telas, seis larguras (320, 390, 768, 1024, 1440 e 1920 px) e dois temas. A fixture não apresentou erros de execução nem transbordamento horizontal detectado. Os dados são sintéticos e isolados em memória.

Na interface foram conferidos cancelamento e reabertura de lançamento, registro de R$ 12,34 no calendário, divisão de R$ 100,01 em três partes (R$ 33,34 + R$ 33,34 + R$ 33,33), confirmação manual de pagamento, bolha de notificações, acesso ao perfil/configurações e troca para o tema escuro em 320 px.

## Limites da verificação

Não foram executados testes em aparelhos físicos, Safari ou Firefox. Login Google real, sincronização entre dois aparelhos reais, convites entre duas contas reais e chamadas reais do Gemini continuam exigindo validação no domínio Netlify com as respectivas contas/configurações. Os testes dessas integrações usam fixtures/mocks; a segurança da tabela Supabase foi validada na etapa de implantação documentada em SINCRONIZACAO.md.

Apple, Open Finance, bolsa e pagamentos de apoio dependem das integrações futuras já previstas. A publicação estática de prévia não executa a função Gemini do Netlify. Nenhuma revisão permite garantir ausência absoluta de bugs ou funcionamento em todas as plataformas.

## Publicação

O pacote contém dist, netlify/functions, netlify.toml, database, tests e os guias. No Netlify, publique o projeto completo com publish=dist e functions=netlify/functions; enviar apenas dist não instala as funções Gemini. As variáveis privadas já configuradas no Netlify devem ser mantidas. Esta revisão não exige nova migração SQL.

## Amigos e compartilhamento — 29/10/2026
- Opções de configurações com reflexo de borda reduzido; Adicionar mês como pílula com texto centralizado.
- Amigos contém convite por usuário e lista/status de amizades. Divisões locais e propostas ficam em Entradas.
- Dividir com amigo e compartilhar uma compra oferecem somente amizades aceitas. A compra preenche descrição e total com frete; envio cria a proposta existente em app_shared_expenses, sem lançar gasto automaticamente. Não cria carrinho colaborativo nem compartilha o link/imagem do produto.
- Reutiliza tabelas e validação existentes; RLS confirmada por consulta somente leitura. Sem migração.
- npm test passou; novo friends-regression verifica filtro de amizades, escape, total com frete, visitante e ausência de amigos. Teste antigo de perfil atualizado para organização atual.
- Inspeção no navegador: configurações claras, pílula/menu de mês, Compras escuras, bloqueio de visitante e Amigos. Envio/aceite real entre duas contas não foi exercitado.

## Paletas, carrinho e gerenciamento de conta — 29/10/2026

- Corrigidos raios e espaçamento dos cards/formulários do carrinho; simulação e compartilhamento usam controles em pílula. Variáveis de raio/padding agora têm valores e fallbacks válidos.
- Sete paletas coordenadas: Branco envelhecido (padrão), Areia, Damasco, Rosa chá, Névoa, Lavanda e Sálvia. A seleção usa botões GlassButton com amostras e estado selecionado. Cores livres removidas da interface e da normalização; preferências antigas sem uma paleta válida migram para Branco envelhecido, preservando os ajustes de vidro.
- Corrigida a classe de superfície das três opções de Configurações. Elas agora recebem o mesmo material dos demais cards, com reflexos discretos.
- Zerar dados financeiros remove os registros ativos do aplicativo, inclusive relatórios e planejamentos, mantendo perfil, amizades, propostas compartilhadas e paleta. Usa a gravação atômica e a fila de sincronização existentes; informa quando a nuvem ainda está pendente. Limpa também recuperação/cópias locais da conta, carbono local e notificações. Backups baixados e cópias offline em outros aparelhos não são apagados.
- Excluir conta fica disponível somente com conta autenticada, em Configurações > Dados e relatórios > Gerenciar dados. Exige digitar EXCLUIR. A Edge Function delete-own-account valida o JWT com Auth.getUser, revoga sessões globais e usa Admin.deleteUser exclusivamente para o usuário validado. Não aceita IDs no corpo. As quatro FKs sociais agora usam ON DELETE CASCADE; nenhuma linha existente foi removida ao aplicar a alteração. RLS preservada e confirmada por consulta.
- Função publicada no Supabase configurado. SUPABASE_SERVICE_ROLE_KEY permanece apenas no ambiente do servidor. O gateway verify_jwt=false suporta as chaves atuais; o handler faz a autenticação obrigatória antes de qualquer operação administrativa. Configuração e código reproduzíveis em supabase/ e database/account-deletion.sql.
- Testes: npm test passou; 42 combinações de contraste de paletas, persistência/erro de armazenamento, reset com rollback e perfil preservado, seleção de identidade verificada, rejeição de IDs externos e revogação antes da exclusão. Endpoint publicado respondeu OPTIONS 204, GET 405, POST sem autenticação 401 e POST com JWT inválido 401. A exclusão efetiva de uma conta real não foi executada.
- Revisão visual: seis larguras de 320 a 1920, dois temas e nove rotas (108 combinações). Sem overflow ou sobreposição. Detectadas três opções de Configurações sem a classe de vidro; corrigidas e rechecadas nas 12 combinações de largura/tema. Formulário do carrinho e seletor de paletas abertos também cabem em 320px. Confirmação/cancelamento do reset conferidos no navegador. Testes visuais feitos em Chromium, sem alegação de cobertura de todos os motores.

### Avisos anteriores do Supabase
A consulta de segurança antes e depois da alteração retornou os mesmos avisos, sem novos achados: três RPCs antigas com SECURITY DEFINER e proteção de senha vazada desativada. Não alterados neste ajuste. Referências: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

## Amigos, pesquisa e compartilhamento por mensagem — 29/10/2026
- Divisão com amigos movida de Entradas para Amigos. Removido o formulário manual duplicado; os registros históricos anteriores permanecem preservados. Notificações de divisões abrem Amigos.
- Removida a busca fixa das páginas. O botão Pesquisar fica na barra lateral e abre um dialog sobreposto com filtros combináveis de texto, tipo, categoria, datas e valor. Busca em entradas, gastos, dívidas e compras de todos os períodos. Valores comparados em centavos, busca ignora acentos, até 100 resultados visíveis. Resultados abrem a edição apropriada; verificam se o registro ainda existe e não mudou antes de abrir.
- Corrigido o contorno externo quadrado do details expandido no carrinho: sem borda externa, formulário arredondado e recorte de conteúdo. Verificado com raio de 28px tanto no host como no formulário.
- Em Amigos, Compartilhar dívida prepara descrição, valor e link. Oferece compartilhamento nativo do aparelho quando disponível, copiar texto e abrir o compositor do WhatsApp. Não envia uma mensagem automaticamente. A dívida de origem não é alterada. O link usa publicAppUrl de assets/auth-config.json, configurado para https://tefinance.netlify.app/. É necessário publicar esta versão nesse domínio para o recebimento funcionar ali.
- O link contém os dados no fragmento, sem identificadores de conta. Não é uma cobrança verificada nem um convite com assinatura de origem. Quem recebe confere os valores, revisa mês e parcelas e só então salva. Pode ser encaminhado. Visitante recebe aviso de salvamento temporário; conta Google usa a sincronização existente. O fluxo pendente atravessa a tela de login. Identificador sharedRef persistido evita importar o mesmo link novamente; o envio de uma nova mensagem gera um novo identificador.
- Identidade reúne identificação, dados, extratos/relatórios, exportação e encerramento de sessão. Layout permanece separado. Qualquer dialog aberto bloqueia a aplicação de atualizações remotas enquanto a pessoa revisa os dados.
- npm test passou, incluindo filtros combinados, centavos, acentos, limites, links UTF-8, valores/URLs inválidos, referência preservada na normalização de dívida e link pendente antes do login. Build validado no empacotamento.
- Auditoria visual: 108 combinações (nove rotas, seis larguras de 320 a 1920 e dois temas), nenhuma falha. Inspeção adicional dos filtros abertos em 320px no modo escuro e Identidade expandida em 320px, sem overflow. Pesquisa de assinatura abriu a edição correta. Recebimento de dívida fictícia de R$123,45 testado no ambiente isolado até salvar; nenhuma mensagem foi enviada, nenhum gasto real ou conta real foi alterado.
- Referências do compartilhamento: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share e https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText. A disponibilidade do compartilhamento nativo depende do navegador/aparelho; copiar texto e abrir WhatsApp são alternativas.

## Pesquisa em pílula e ações sem duplicação — 29/10/2026
- Pesquisa reduzida a uma pílula flutuante central e botão circular de três pontos. Os filtros aparecem somente sob demanda. Resultados aparecem abaixo da pílula, com busca ao digitar e Enter/lupa para execução imediata. Escape ou toque fora fecha e devolve foco ao botão da barra.
- Mantidos tipo, categoria, datas e faixa de valores, combináveis. Limpar remove filtros. Sem o card grande de pesquisa nem campos avançados na abertura inicial. Painel tem rolagem própria e respeita a largura da tela.
- GlassActionEditor agora usa somente Fechar no menu. Em Amigos, o acionador da mensagem de dívida usa o ícone padrão de compartilhar (quadrado com seta para cima) e rótulo Compartilhar. A ação interna chama-se Enviar, distinguindo a preparação da mensagem da abertura do formulário.
- Revisão das ações: removido o segundo botão de adicionar dívida que aparecia no cabeçalho. Permanece o único acionador junto a Suas dívidas. Entradas, Compras, Amigos, perfil e notificações mantêm seus acionadores com finalidades distintas; não foram removidas ações de registros diferentes apenas por terem o mesmo nome.
- Verificação: build e testes de regressão passaram. Navegador: pílula inicial sem filtros expostos, resultado de assinatura, filtros nos três pontos, fechamento por Escape e devolução de foco, menu Compartilhar e rótulo Fechar. Verificada em desktop claro e 320px escuro; campos e painel sem overflow. Nenhum envio de mensagem ou alteração financeira real durante a revisão.

## Configurações compactas e expansão direta — 29/10/2026
- Identidade e Layout recolhidos são pílulas de cerca de 58px de altura, com preenchimento reduzido. Cada opção mantém seu estado independente e expande apenas o próprio card; cantos voltam ao formato de pílula ao recolher.
- GlassActionEditor passou de menu intermediário para botão direto. Ao abrir, o ícone vira menos; o mesmo botão fecha e restaura o ícone original (mais, compartilhar ou ofertas). Preservados aria-expanded, aria-controls, foco e os campos do formulário.
- Adicionados indicadores mais/menos aos detalhes nativos de relatórios e apoio. Simulação de compra e compartilhamento com amigo já usavam essa alternância.
- Testes de regressão passaram. Navegador: Layout aberto com Identidade ainda recolhida, recolhimento pelo mesmo cabeçalho, Amigos abrindo e fechando Compartilhar sem menu, ícone original restaurado e carrinho abrindo diretamente. Verificadas configurações em desktop claro e 320px escuro, sem ultrapassar a largura disponível.

## Formulários simplificados — 30/10/2026

- Configurações: Identidade passa a Conta e dados, preservando dados, relatórios e ações existentes.
- Adições e edições exibem campos essenciais primeiro; o botão de três pontos revela pagamento, recorrência, parcelas e detalhes. Recolher mantém controles montados, valores e participação em FormData.
- Compra mantém nome, preços e link visíveis; despesas mantêm descrição, valor e categoria. Revisão dos itens, total e confirmação da nota fiscal continuam visíveis.
- Validação de campo recolhido revela o painel e direciona o foco. Erros do salvamento também revelam detalhes sem apagar valores.
- Verificação: npm test aprovado. QA manual em fixture isolada: gasto salvo com pagamento Débito após recolher, compra editada sem perder frete/reserva/parcelas/participantes, erro de parcelas ocultas revelado e corrigido. Conferidos desktop claro e formulário de compra em 320 px escuro; não foi repetida a auditoria completa de 108 combinações.

## Menu do perfil e painéis flutuantes — 30/10/2026

- Atalho da foto abre Perfil, Integrações, Configurações e Sair. Menu com navegação por teclado, Escape e fechamento ao clicar fora. Nenhum Help Center foi adicionado.
- Perfil, Integrações e Configurações usam um dialog nativo centralizado sobre a tela atual, com foco contido, fechamento por Escape/clique no fundo e devolução do foco ao atalho.
- Perfil mantém foto/nome/e-mail, badge Beta tester elegível, estrelas, assinaturas e Apoio; retirados os textos explicativos. Apoio continua sem cobrança fictícia quando não existe URL configurada.
- Estrelas calculadas a partir dos lançamentos: um ponto por mês encerrado com entradas e gastos registrados, compromissos dentro da renda e pelo menos um limite definido, sem ultrapassar os limites configurados. Meses atuais/futuros e meses vazios não contam. Máximo de cinco estrelas; mês duplicado não pontua novamente. Cálculo em centavos, sem alterar dados financeiros e com agregação única dos lançamentos.
- Open Finance saiu de Conta; Serasa e boletos saíram de Dívidas. Os três estão em Integrações, honestamente como Em breve.
- Configurações tem apenas as abas Conta e Notificações. Identidade, importação CSV, relatórios, exportação, sincronização, controles de dados e Layout permanecem dentro de Conta. Preferências de notificações são salvas no armazenamento já isolado por conta/visitante e filtram lista e contador; não ativam push do navegador.
- Verificação: npm test aprovado, incluindo novas regressões de estrelas e preferências. QA em fixture sem conta real: menu e três painéis, fechamento/restauração de foco, configuração de avisos e filtro efetivo da central; desktop claro e perfil/Conta/Notificações/Layout em 320 px escuro sem estouro horizontal. Nenhuma mensagem enviada, pagamento feito ou conta real alterada.

## Correção do menu e Relatórios — 30/10/2026

- Itens do menu usam botões nativos e tratamento direto no host em captura, sem depender da propagação dos componentes Glass. Efeitos/ícones decorativos não capturam o toque.
- Rolagem reposiciona o menu em vez de fechá-lo antes do clique; foco usa preventScroll. Eventos de fechamento atrasados não limpam um painel já reaberto.
- Adicionada opção Relatórios ao menu. Histórico mensal fechado, Backup, Planilha CSV e exportação de dados anteriores ficam nesse painel; foram retirados de Conta. Importação de CSV, sincronização, gerenciamento de dados e Layout continuam em Conta.
- Aviso de relatório mensal abre diretamente Relatórios. Valores e conteúdo dos relatórios fechados permanecem inalterados.
- Verificação: npm test e build aprovados. QA em fixture isolada: quatro opções abertas em sequência, exportação CSV baixada, Conta sem duplicação de relatórios/exportações, menu após rolagem, navegação por setas/Enter/Escape e Relatórios em 320 px escuro sem estouro horizontal.

## Layout e indicadores em arco — 30/10/2026

- Layout é a terceira aba das configurações, junto a Conta e Notificações, sem expansão intermediária. Navegação por teclado inclui as três abas.
- Progresso por categoria, hábitos e pagamentos por pessoa usam SVGs de arco aberto, percentuais centrais e GlassSwitch, com as cores do layout. Ao atingir/superar o limite de categoria, o arco inteiro é vermelho. O percentual pode passar de 100%; o preenchimento é limitado a 100%.
- Categoria sem limite exibe estado neutro, sem percentual inventado. Hábitos mostram a participação no total do grupo; pagamentos mostram a fração paga pelo participante. Grupos de hábitos sem gastos exibem estado vazio. Valores positivos menores que 0,1% não são arredondados visualmente para zero.
- Cada controle individual oculta apenas o preenchimento do arco, preservando números, alertas e cálculos. Layout tem Indicadores circulares: desativar restaura barras. Preferências persistem no armazenamento de layout existente, isolado por conta/visitante. Falha ao gravar mantém a preferência anterior.
- Gráfico mensal: removida moldura/borda interna e fundos das colunas; barras finas e arredondadas, etiquetas discretas e rolagem preservada.
- Validação: npm test aprovado, incluindo persistência/restauração/falha de gravação dos novos controles, proporções de hábitos e limites exatos em centavos. QA manual: Layout, controle individual, retorno global às barras, leitura de limite excedido, Comportamento e mensal em 320 px escuro, sem estouro horizontal; resumo e indicadores em desktop claro.
- Auditoria visual concluída: 108 combinações (9 telas/rotas × 6 larguras de 320 a 1920 px × 2 temas), nenhuma falha de estouro horizontal, sobreposição da barra, ícones ausentes ou superfícies fora do padrão detectada pelo harness.

## Crédito e investimentos — 30/10/2026

- Nova aba com cartão visual em Liquid Glass, vários cartões, apelido, limite total, comprometimento fora do app, fechamento, vencimento e arquivamento. Não há campos para número, CVV, senha ou validade. O normalizador aceita apenas os campos previstos e rejeita número completo no apelido.
- Limite disponível = limite total menos valor fora do app e lançamentos não quitados vinculados ao cartão. Inclui parcelas futuras; quitação libera somente o comprometimento e preserva o gasto no orçamento. Edição, exclusão, duplicação e repetição atualizam os compromissos. O saldo é um guia manual, não uma fatura bancária.
- Compra planejada pode selecionar um cartão. A simulação compara o total com os limites disponíveis. Confirmar compromete produto e frete inteiros, distribuídos entre parcelas exatas; dividir com amigos não reduz indevidamente o que foi cobrado no cartão. Planejamentos não confirmados não reservam limite.
- Calculadora CDB de aporte único para pessoa física residente no Brasil: % do CDI, taxa anual, datas, dias úteis ajustáveis e custos no resgate. Juros compostos aplicam o percentual do CDI à taxa diária, base 252. Dias úteis padrão são estimados em 252/365 dos dias corridos; não representam um calendário de feriados/liquidação do emissor.
- IR regressivo de 22,5%/20%/17,5%/15% conforme dias corridos; IOF usa a tabela de 1 a 29 dias e zera a partir do 30º; IR incide sobre o ganho após IOF. Principal não tributado. Custos adicionais são deduzidos do líquido. Projeção não cria entradas nem investimentos na conta.
- Referência inicial explicitamente datada: CDI anual 13,65%, SGS 4389/BCB de 28/10/2026, consultado em fonte oficial. Consultar CDI tenta a função pública Netlify e o endpoint oficial; em indisponibilidade mantém uma taxa identificada/editável, sem inventar dado atualizado.
- Layout permite ocultar Crédito e investimentos e Carbono, preservando os dados. Ao ocultar a aba atual, retorna ao Resumo, mantendo acesso às configurações pelo perfil.
- Cartões e vínculos fazem parte do snapshot JSON existente da sincronização e do backup. Não é necessária nova tabela, permissão ou mudança de RLS. A consulta de verificação pelo conector Supabase foi recusada; não foi efetuada alteração no banco real. Testes locais de serialização e sincronização simulada passaram, inclusive conta contendo apenas cartões e preservação de conflitos.
- QA funcional em fixture isolada: cadastrar cartão de R$ 5.000; registrar gasto de R$ 120 (disponível R$ 4.880); marcar quitado (R$ 5.000); confirmar compra de R$ 3.540 em 3 parcelas com 2 pessoas (disponível R$ 1.460). CDB de R$ 1.000 a CDI anual 10%, 100% CDI/365 dias: bruto R$ 100, IR R$ 17,50, líquido R$ 82,50. Campos e resultado conferidos em 320 px escuro sem estouro horizontal. Nenhum gasto/conta real alterado.
- Auditoria visual concluída: 120 combinações (10 telas/rotas × 6 larguras × claro/escuro), sem falhas detectadas de alinhamento, sobreposição da navegação, falta de ícones/Glass ou estouro horizontal. Verificação funcional em conta real e consulta ao Supabase conectado continuam pendentes; nenhum sucesso remoto foi presumido.
