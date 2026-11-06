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

- F01: quota bancária aplicada no entrypoint HTTP por usuário autenticado e operação; limites independentes e rejeição antes de consultar o Pluggy, com 429/Retry-After ou 503 se a quota não puder ser verificada.
- F02: amigos e propostas de divisão lidos com paginação estável, cancelamento e rejeição de páginas repetidas; nomes de usuário consultados em lotes sem truncar a lista em 100 registros. A regra mensal local foi preservada.

- Login: falha na importação do módulo Google agora é tratada; o acesso de visitante fica disponível independentemente desse módulo, e Tentar novamente recarrega o grafo de módulos após falha.

- F04: leitura incremental limitada dos corpos de banco, compras, tributos e exclusão de conta, com cancelamento antecipado. Limites lógicos, Unicode/BOM e mensagens/status existentes preservados.

### Limitações conhecidas

- A regra mensal de nome de usuário é LOCAL ONLY, por dispositivo/conta; não é imposta no servidor nem garante exclusividade entre aparelhos.
- Safari, iPhone físico e provedores reais não foram verificados nesta rodada. Testes locais usam mocks e bloqueiam tráfego externo.
- Testes E2E de origem legada tiveram os seletores de Configurações atualizados; a comparação pixel a pixel continua dependente de referência local aprovada. Capturas concluídas não equivalem a essa comparação.
- Um teste de seleção apresentou falha de medição intermitente na baseline paralela; passou isoladamente e depois das edições, sem alteração de timing.
- F01 (quota bancária) e F02 (paginação social) foram integradas localmente nesta rodada. O stash original 08cc1fd foi preservado; provedores e dados reais não foram consultados.
- Task B: revisão segura concluída sem exclusão de código por busca estática; README alinhado à versão e aos testes locais isolados. Outros fixes continuam separados. A recuperação do login foi corrigida e coberta por testes locais de falha de chunk.
- Nenhuma publicação, tag ou deploy foi realizado pelo agente.
