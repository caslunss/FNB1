# Registro de alterações

Este arquivo segue o estilo Keep a Changelog, em português, com versões SemVer. Registra apenas alterações verificáveis na história local e nesta rodada de trabalho.

## [0.1.0-alpha.1] - 2026-11-05

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
