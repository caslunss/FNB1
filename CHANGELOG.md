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

### Limitações conhecidas

- A regra mensal de nome de usuário é LOCAL ONLY, por dispositivo/conta; não é imposta no servidor nem garante exclusividade entre aparelhos.
- Safari, iPhone físico e provedores reais não foram verificados nesta rodada. Testes locais usam mocks e bloqueiam tráfego externo.
- Testes E2E de origem legada tiveram os seletores de Configurações atualizados; a comparação pixel a pixel continua dependente de referência local aprovada. Capturas concluídas não equivalem a essa comparação.
- Um teste de seleção apresentou falha de medição intermitente na baseline paralela; passou isoladamente e depois das edições, sem alteração de timing.
- F01 (quota bancária) e F02 (paginação social) estão preservados no stash 08cc1fd, ainda não integrados nesta branch. Não são correções entregues nesta versão local.
- A limpeza de código da Task B e os demais fixes da auditoria não foram executados nesta rodada. A falha de resiliência do login quando seu módulo não carrega permanece reportada.
- Nenhuma publicação, tag ou deploy foi realizado pelo agente.
