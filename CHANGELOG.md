# Registro de alterações

Este arquivo segue o estilo Keep a Changelog, em português, com versões SemVer. Registra apenas alterações verificáveis na história local e nesta rodada de trabalho.

## Não lançado

### Corrigido — primeiro acesso e alinhamento
- Cadastro inicial usa cabeçalho, card, foto e interruptor do sistema visual existente. Ações ficam alinhadas em uma grade estável; campos de salário e data usam a mesma linha no desktop e se empilham no celular. Preservadas as regras de cadastro e a opção de preencher depois.
- Seletores de Resumo e filtros de Impostos cabem em telas estreitas, sem cortar opções. Esc no calendário fecha somente o seletor de data, preservando o popup de origem.

### Simplificado — Novidades
- Resumo de cada versão limitado aos principais destaques em frases curtas, preservando o histórico e as datas.

### Ajustado — login
- Card de acesso aproximado da logo em uma composição mais compacta no desktop, sem deslocamento lateral; celular mantém empilhamento.

### Melhorado — cadastro de amigos
- Consulta de nome/foto usa função protegida no banco, sem credencial secreta no endpoint.
- Cadastro com nome e foto substitui Amigo fictício; vínculo opcional por @usuário importa a identidade somente de amigos aceitos. Contatos e saldos existentes são preservados. Nome/foto escolhidos no perfil são compartilhados com amigos aceitos, sem acesso a email ou informações financeiras.
- Valores a receber mostra avatar e participação proporcional de cada pessoa no saldo aberto. Atribuição de valores fica dentro desse card.
- Cadastro, Adicionar amigos e Valores a receber usam uma grade única, com ordem estável e empilhamento no celular; menus do cabeçalho ficam acima do conteúdo.

## [0.1.0-alpha.6] - 2026-11-07

### Adicionado
- Amigos ganha uma área própria no dock com pedidos por @usuário, contatos fictícios, valores a receber por pessoa, atribuição de dívidas e marcação de pagamento no controle privado. Dividir conta e Cobrar passam a ficar em Amigos; dados financeiros originais são preservados.
- Primeiro acesso de contas autenticadas apresenta Perfil, Salário e Cartões em popup, com possibilidade de preencher depois. Nome de usuário usa a reserva e validação existentes; foto continua local. Salário opcional gera 12 recebimentos após confirmação; conclusão fica no workspace da conta para não repetir o cadastro.

### Corrigido
- Alinhamento das barras de navegação e conta no topo do desktop. Navegação ampliada para cinco áreas, com preservação dos destinos antigos.


### Melhorado — cobrança entre amigos
- Link compactado no próprio domínio, preservando a leitura dos links antigos e a referência que impede duplicação.
- Mensagem identifica quem cobra e detalha descrição, valor solicitado, saldo restante quando a dívida é cadastrada e detalhes opcionais. Quem recebe vê o nome de quem cobra antes de revisar; não há pagamento nem gravação automática.

### Ajustado — posição do login
- Card de acesso deslocado 24 px para a direita acima de 760 px, preservando a centralização no celular e as animações existentes.

### Adicionado — modo OLED
- Subopção do modo escuro com fundo preto puro, cards cinzas opacos, bordas e sombras para separar as camadas. Preferência local preservada ao trocar de tema ou paleta; restaurar o layout escuro desativa OLED.

### Corrigido — modo escuro neutro
- Fundos, cards e camadas de vidro da paleta Essencial usam cinzas neutros no modo escuro, removendo o excesso de azul das superfícies. Destaques azuis, contraste de texto, categorias e modo claro preservados.

### Corrigido — cards por aba
- Cards de distribuição, maiores gastos, categorias e dívidas ficam somente em Gastos. Acompanhamento de investimentos da meta fica em Metas; Entradas e Hábitos não exibem cards de outras opções. Mapeamento de pertencimento documentado e validado na navegação.

### Corrigido — histórico mensal em Hábitos
- Últimos meses deixa de ocupar uma linha inteira sozinho e se alinha a Dias da semana na grade. Indicadores circulares substituídos por uma lista compacta de mês e total, com os mesmos dados financeiros.

### Alterado — Hábitos no seletor do Resumo
- Cards de hábitos de gastos movidos para a opção Hábitos, junto de Entradas, Gastos e Metas. As demais opções deixam de exibir esses cards no rodapé.

### Corrigido — agrupamento dos cards
- Revertido o espaçamento zero. Restaurados intervalos uniformes de 24 px no desktop e 16 px no celular, com cards agrupados em grades e preenchendo as células para evitar aparência de blocos soltos.

### Alterado — contrato global de cards
- Removidos os espaços externos entre cards, com token único de gap zero, margens zeradas e grade compartilhada nas páginas e painéis. Espaçamento interno, foco e áreas de toque preservados; regra permanente registrada para futuras alterações.

### Alterado — paleta e sobreposições
- Essencial passa a exibir Azul essencial, preservando a chave salva da paleta. Fundos frios nos temas claro/escuro, cards com preenchimento mais definido e menus mais opacos melhoram a separação de superfícies.

### Adicionado — novidades da versão
- Configurações oferece o histórico de novidades, com versão atual, data e resumo das mudanças. Toda mudança de versão exige uma entrada correspondente, validada automaticamente.

### Alterado — conteúdo e diagnóstico tributário
- Removidos o card Dicas para você e a descrição introdutória de Metas de produtos.
- Impostos distingue verificação pendente, configuração IBPT ausente e erro real do servidor, sem ocultar falhas de sessão ou de configuração.

### Corrigido — testes e organização dos cards
- Reconstrução das fixtures alinhada aos módulos atuais, com dependências reais de perfil, previsão e compatibilidade. Testes de navegação, cartões e login atualizados aos contratos vigentes; recursos retirados passam a verificar ausência de módulos e chamadas, preservando a categoria financeira.
- Cards de Previsão e metas alinhados em duas colunas no desktop e uma no celular, sem alturas forçadas, com espaços uniformes e títulos de seção separados.

## [0.1.0-alpha.5] - 2026-11-07

### Corrigido — interface de Previsão
- Tela ajustada ao Resumo com campos espaçados, seletores compartilhados com navegação por teclado e rótulos sem quebra, resumo de saldo e detalhamento diário expansível com rolagem própria.
- Atualização dos resultados usa SmoothState e os presets de Motion existentes; alvos de toque, foco, temas e movimento reduzido preservados.

### Alterado — versão
- Atualizada para 0.1.0-alpha.5 por solicitação do proprietário, com fonte única, pacotes e documentação sincronizados.

### Removido — edição de blocos
- Removido o botão de reorganizar blocos do Resumo, por solicitação do proprietário.

### Alterado — Previsão no Resumo
- Previsão movida para o seletor do Resumo, junto de Visão geral e Lançamentos; removida de Planejamento. Banner e atalhos atualizados, mantendo compatibilidade com links antigos e as preferências salvas.

### Alterado — interface minimalista
- Fonte unificada na pilha SF Pro solicitada, incluindo login, controles, painéis e telas pequenas, com alternativas nativas fora dos sistemas Apple.
- Previsão com seletores de período e cálculo separados, botões curtos e estado selecionado preservado. Textos reduzidos no login, Resumo, Compromissos, Planejamento, Recorrências, Perfil, Configurações e Impostos; unidades, alertas e consequências financeiras preservados.

### Alterado — navegação
- Mantidas quatro áreas na dock: Resumo, Compromissos, Planejamento e Análises. Previsão fica em Planejamento, Recorrências em Compromissos; Assinaturas do Perfil conserva seu resumo e passa a oferecer acesso ao gerenciamento local. Estilos Fixada/Padrão/Mini e calendário superior permanecem.

### Adicionado — recorrências
- Detecção local e revisável de cobranças semanais, quinzenais, mensais e anuais, com pelo menos três ocorrências; decisões de confirmar, ignorar ou marcar como cancelada preservam os lançamentos e alimentam somente a previsão estimada. Inclui sinais de variação de preço, cobranças semelhantes e possível duplicidade, sem inferir uso dos serviços.

### Adicionado
- Previsão local de saldo em centavos, horizontes de 30/60/90 dias, estimativa variável explícita, margem de segurança, banner e switch Alerta de saldo; sem IA, novas APIs ou sincronização remota. Datas de dívidas não informadas ficam pendentes de revisão.

### Removido
- Carbono: painel manual, controles de visibilidade, cálculo/apresentação e navegação; dados locais antigos e preferências são aceitos somente para compatibilidade, sem exclusão automática.

## [0.1.0-alpha.1] - 2026-11-05

### Alterado — 06/11/2026

- Perfil reorganizado como popup compacto com identidade, notas, assinaturas/apoio, Configurações e Sair. Editor permite somente nome de exibição e foto locais por conta/dispositivo; não altera o @usuário nem sua regra mensal. Imagens PNG/JPEG/WebP de até 2 MB são recortadas e reduzidas localmente, sem upload para serviços externos.
- Cabeçalhos de Configurações, Calendário e Perfil usam material com máscara de fade, eliminando a faixa sólida; fallback opaco para transparência reduzida ou falta de suporte ao blur.
- Busca passa a usar um único foco discreto na superfície externa, removendo a faixa azul gerada pela sombra global no input. Badges Gastos, Metas e Planejamento retirados do login.


### Alterado — 06/11/2026

- Por pedido do proprietário, títulos principais alinhados abaixo da logo do guaxinim pela borda esquerda; no mobile, logo mantém a faixa dos controles superiores. Distribuição dos gastos passa a usar segmentos radiais de raios decorativos diferentes, gradientes das cores categóricas do tema e centro com total real em reais. Ângulos, valores, legenda e percentuais continuam derivados dos lançamentos; percentuais de crescimento ilustrativos não são copiados da referência.


### Corrigido — 06/11/2026

- Dock Mini passa a usar largura intrínseca dos quatro controles (206 × 50 px), preservando alvos de 44 px. Dock Fixada calcula altura e padding pela mesma área segura e não admite rolagem interna vertical. Barras de ações passam a usar 12 px entre controles, com seletores em 8 px. Grades de cards eliminam margens duplicadas, alinham cards de Planejamento e aproveitam a última linha ímpar do Resumo. Regras de popup que desfaziam containers em Planejamento foram removidas. Vidro, cores e durações de movimento preservados.

### Removido — 06/11/2026

- Por solicitação do proprietário, removida a página de Investimentos, seu acesso, componentes, cotações BRAPI, indicadores de mercado, referência pública e endpoints `/api/investments`, `/api/market-economy` e `/api/market-rates`. O diagnóstico de serviços deixa de expor o campo `configuration.investments`. Links internos inválidos retornam ao Resumo. A categoria financeira, lançamentos e metas salvos são preservados. O módulo de Cartões perde a nomenclatura legada que o associava à página removida.


### Adicionado

- Sistema de versão com fonte única em src/version.ts, canal alpha, data de lançamento e rótulo em português.
- Linha de versão somente no menu principal de Configurações, como texto selecionável.
- Guia de versionamento, identificação da versão documental e teste de consistência entre fonte, package, lockfile e changelog.
- Menu agrupado de Configurações com Conta para autenticados, Layout e preferências, Notificações, Dados e conexões e estrutura vazia de Registro e segurança (da1707a).
- Regra de uma alteração de nome de usuário por mês civil, com reserva local antes da gravação e restauração em falhas (da1707a).

### Alterado

- Calendário sempre acessível no topo, inclusive com preferência antiga calendar:false, preservando os dados antigos (03e8c2a).
- Liquid Glass com valores padrão fixos: opacidade 66%/64%, blur 6px/16px, suavidade escura 70% e intensidade 3; valores customizados anteriores permanecem armazenados (e17a6a7).
- Preferência local da dock com Fixada, Padrão e Mini, mantendo o comportamento existente de Padrão/Mini e suporte a áreas seguras (30fc9e5).

### Corrigido

- Seletores e expectativas de sete testes E2E que ainda dependiam das abas antigas de Configurações: navegação por menu/subtelas, Conta oculta para visitantes, estado ativo e Escape em dois níveis.
- Mantidos fixtures, tempos de espera e asserções de negócio, geometria, foco e teclado. As suites atualizadas concluíram 228 estados de controles e 400 capturas visuais locais.

### Correções locais posteriores (2026-11-06)

- Modo escuro padrão com base preta, superfícies neutras em níveis, texto mais claro e seleção cinza inspirados na imagem fornecida. Azul de marca, modo claro, valores Liquid Glass/Motion e cores dos gráficos protegidos de categorias/investimentos preservados. O guia online da Apple não pôde ser consultado por bloqueio de rede.

- Destaque padrão alterado para azul #0000FF, com adaptação de legibilidade no escuro. Gráficos diários, por período, dívidas, divisões e evolução tributária inspirados na referência: barras suaves, grade discreta e área em degradê. Categorias, metas de investimento, mercado, valores e cálculos preservados; paletas alternativas continuam disponíveis.

- Removidos do login os textos “Seu espaço financeiro”, “TEFinance” e “Mais clareza para o seu dinheiro”. O título de boas-vindas mantém a semântica de título principal e o mesmo estilo; acessos e campos preservados.

- Login redesenhado com logo evidente, textos em português, card Liquid Glass e prévia de entrar/cadastrar com e-mail e senha. Google e visitante preservados. O formulário novo apenas informa indisponibilidade: não autentica, cadastra, envia ou armazena credenciais.

- Envios existentes usam RiFileCloudLine e aceitam renderFileIcon; removida a herança de stroke/fill que ocultava ícones Remix. Formatos e limites preservados. Migração completa da UI BoardUI depende do código oficial indisponível pela rede.

- Campo de pesquisa adaptado do BoardUI enviado pelo proprietário, com React Aria, ícones Remix, limpeza e estado de busca real; filtros, resultados, atalhos e temas preservados.

- Ajuste visual solicitado: logo alinhada verticalmente à barra de conta no mobile, sem deslocamento horizontal; marca de 52 px no desktop. Cores categóricas dos gráficos vinculadas à paleta ativa em tons suaves, preservando dados e alertas.

- F01: quota bancária aplicada no entrypoint HTTP por usuário autenticado e operação; limites independentes e rejeição antes de consultar o Pluggy, com 429/Retry-After ou 503 se a quota não puder ser verificada.
- F02: amigos e propostas de divisão lidos com paginação estável, cancelamento e rejeição de páginas repetidas; nomes de usuário consultados em lotes sem truncar a lista em 100 registros. A regra mensal local foi preservada.

- Login: falha na importação do módulo Google agora é tratada; o acesso de visitante fica disponível independentemente desse módulo, e Tentar novamente recarrega o grafo de módulos após falha.

- F04: leitura incremental limitada dos corpos de banco, compras, tributos e exclusão de conta, com cancelamento antecipado. Limites lógicos, Unicode/BOM e mensagens/status existentes preservados.

- F03: snapshots serializados idênticos são validados uma vez, sem ordenação recursiva; comparação semântica e rejeição de snapshots inválidos preservadas.

- F05 (mitigação): consultas públicas de mercado idênticas e simultâneas compartilham uma chamada e uma quota por instância; cada resposta tem corpo independente e falhas liberam nova tentativa. A repartição da quota global continua sendo decisão do proprietário.

- Task B: revisão segura sem exclusões especulativas, README corrigido e regras permanentes alinhadas; nenhum CSS ou valor Motion foi modificado.
- Verificação local final: 58 scripts de regressão e 19 suítes browser aprovados; 400 estados comparados com a base 1678ded, com 400 pares dentro das tolerâncias de pixels existentes. Execução retomada por grupos completos após interrupção do ambiente, sem editar testes. Uma comparação de pixels inicialmente falhou (399/400); a repetição integral de 320 px escuro passou, e ambos os resultados foram preservados. Essa é uma comparação de regressão local, não uma validação de produção ou aprovação estética externa.

### Limitações conhecidas

- O teste legado tests/profile-layout.cjs proíbe campos email/password e conflita com a prévia de login aprovada nesta rodada. Foi mantido intacto; a suíte completa não está verde até revisão autorizada dessa expectativa.

- A regra mensal de nome de usuário é LOCAL ONLY, por dispositivo/conta; não é imposta no servidor nem garante exclusividade entre aparelhos.
- Safari, iPhone físico e provedores reais não foram verificados nesta rodada. Testes locais usam mocks e bloqueiam tráfego externo.
- Um teste de seleção apresentou falha de medição intermitente na baseline paralela; passou isoladamente e depois das edições, sem alteração de timing.
- F01 (quota bancária) e F02 (paginação social) foram integradas localmente nesta rodada. O stash original 08cc1fd foi preservado; provedores e dados reais não foram consultados.
- Deno/Supabase Edge não foi executado: os handlers foram testados em Node com transportes simulados; empacotamento e runtime Edge requerem validação isolada adicional.
- A quota pública de mercado continua global; a coalescência vale por instância, sem redistribuir limites entre usuários.
- Nenhuma publicação, tag ou deploy foi realizado pelo agente.
