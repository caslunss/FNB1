Versão do documento: 0.1.0-alpha.1

# Migração do controlador e correções prioritárias de UI

> Histórico da primeira etapa. A pendência de decomposição do controlador foi concluída em [Migração integral](MIGRACAO-INTEGRAL-CONTROLADOR-2026-11-05.md). As limitações abaixo referentes ao controlador descrevem o estado anterior a essa conclusão.

## Entrega e limite

Implementação local sobre `c85e4ae`, seguindo as prioridades da auditoria geral de UI. Esta rodada não inclui publicação ou alteração de serviços externos.

Os comandos abaixo foram extraídos do controlador para módulos TypeScript com contratos de dependências explícitos. As implementações antigas foram substituídas por delegação; não existem duas cópias de negócio em execução.

| Módulo | Responsabilidade migrada |
| --- | --- |
| `src/finance/controllers/ledger.ts` | Criar/editar entradas e gastos; recorrências; cancelar lançamentos futuros; validações de categoria, período, cartão e valores |
| `src/finance/controllers/debts.ts` | Criar/editar dívida; validar credor, centavos, parcelas, período, pagamento e referência compartilhada |
| `src/finance/controllers/planning.ts` | Salvar meta e registrar divisão; preservar distribuição de centavos e vínculo com o gasto |
| `src/finance/controllers/csv.ts` | Interpretar linhas e datas CSV; validar e gerar prévia sem gravar lançamentos |

`workspace.tsx` conserva inicialização, estado, transações, recuperação, persistência, adaptadores de formulários, dispatcher e outras operações ainda ativas. A entrega conclui a extração desses comandos, **não uma reescrita integral do orquestrador nem a eliminação de toda a compatibilidade legada**. As views e os cálculos anteriormente extraídos continuam em seus módulos.

Os contextos acessam o estado substituível por getters, inclusive após rollback/restauração; a meta usa setter explícito. Nenhum comando novo depende do DOM, de hooks ou de armazenamento global implícito. Os fixtures antigos de testes expandem as implementações reais por AST; testes ESM e de navegador também verificam a ligação utilizada pela aplicação.

## Bugs corrigidos e duplicações removidas

| Prioridade / problema | Causa | Correção e verificação relacionada |
| --- | --- | --- |
| P1 — Escape podia descartar lançamento ao fechar calendário | O listener global do formulário processava Escape apesar do diálogo superior aberto | O controlador respeita `dialog[open]`; regressão abre calendário dentro do formulário, fecha e confirma que o lançamento continua aberto. A guarda também evita disputa de Tab/Enter com o diálogo |
| P1 — Falha da imagem de marca sem recuperação explícita | A fonte WebP preferida não tinha uma sequência de recuperação controlada pelo componente | Login tenta PNG após erro WebP e mostra identificação textual se ambas falharem. As duas falhas foram simuladas; acesso visitante continua utilizável |
| P2 — Notificações altas apesar de CSS compacto | Card da biblioteca aplicava padding inline de 24 px, somado ao espaçamento interno | `NotificationCenter` passa `padding="0px"` pela API, mantendo padding da linha. O navegador confirma padding computado zero; filtros, leitura, limpeza e persistência continuam cobertos |
| P2 — Cabeçalho mobile mantinha linha vazia ao rolar | O título ficava transparente, mas permanecia ocupando a grade | Recolhimento da linha após o fade, com limiares diferentes para recolher/restaurar. Foco do título e movimento reduzido são respeitados; desktop preservado |
| P2 — Navegação de calendários inconsistente | Grades não compartilhavam movimentação de foco por teclado | Helper comum em DatePicker, MonthPicker e agenda, respeitando sete/três colunas e botões desabilitados. Setas/Home/End e fechamento são exercitados no navegador |
| P2 — Ação disponível escondida atrás de menu desnecessário | Menu de ações era exibido mesmo com uma única ação não destrutiva | `FinanceActionMenu` abre essa ação diretamente. Múltiplas ações e exclusões mantêm menu/semântica próprios; testes de Lançamentos cobrem os comandos |
| P2 — Opção Apple inoperante no login | Botão visível sem provedor ativado | Removidos botão e mídia específicos sem alterar Google ou visitante. Testes exercitam acesso e estados do login |
| P2 — Configurações com rótulos de navegação antigos | “Abas” e opções sem destino explícito não acompanhavam a organização atual | “Visibilidade”, “Cartões em Compromissos”, “Calendário no topo”; chaves de preferências preservadas |
| P3 — Dois caminhos para menus de ações | Renderer imperativo e hosts antigos coexistiam com os controles React; callback criava botão temporário no DOM | Removidos openMenu/closeMenu, hosts `#menu` e `#profileMenu`, regras sem consumidor e botão temporário. Componentes chamam o dispatcher diretamente; tabela de ações ativa preservada |
| P3 — Três gerações de CSS do login | Folhas de card antigo, layout dividido e fullscreen concorriam com o login centralizado | Regras ativas consolidadas em `src/styles/login.css`, com ordem de entrada explícita. Eliminados seletores comprovadamente sem consumidor; mantidos tema, formulário, foco, Google e acessibilidade |
| P3 — Mídias antigas e inicialização com marca divergente | Arquivos de versões anteriores permaneciam publicados; loading apontava para logo antiga | Loading HTML e React usam a marca atual. Fases antes/depois do JavaScript preservadas, pois têm funções diferentes |

### Arquivos antigos removidos

Sete mídias: `apple-signin.png`, `login-dark-loop.mp4`, `login-light-loop.mp4`, `login-dark.jpg`, `login-light.jpg`, `login-raccoon.png` e `tefinance-logo.png`, em `public/assets/`.

Três folhas substituídas pela folha única: `src/styles/login-base.css`, `src/styles/login-fullscreen.css` e `public/assets/login-design.css`.

Removidos também seletores de avatar/fundo/composição antiga do login, perfil antigo, menu imperativo e progresso de inicialização sem consumidor. O inventário de declarações `!important` passou de 609 para 601; esse número mede exceções da cascata, não quantidade de bugs.

Não removidos: selects ocultos que mantêm contrato de formulário, dados financeiros, migrações de dados antigos, histórico, avisos de acesso, branding oficial Google, tabela de ações, calendários com responsabilidades diferentes ou adaptadores ainda consumidos.

## Validação executada

- `npm test`: 45 scripts aprovados, incluindo o novo teste ESM dos comandos migrados. Cobertura existente inclui centavos, parcelas, recorrências, períodos encerrados, validação, rollback e persistência.
- TypeScript, auditoria/consolidação de CSS, build, verificação de release e orçamento de bundles aprovados.
- Navegador em desenvolvimento: integração dos módulos financeiros, metas/compra planejada, Lançamentos, notificações, formulários/login e 76 estados dos controles compartilhados aprovados.
- Build de produção local: regressões de prioridades de UI, inicialização/dívida/persistência e Lançamentos aprovadas.
- Matriz de produção: 72 estados capturados em 320/1440 px, claro/escuro, incluindo páginas financeiras, diálogos, notificações, calendário, perfil/assinaturas, configurações e login; nenhuma falha reportada pela suíte. São capturas/verificações de estados, **não comparação pixel a pixel com uma versão anterior**.
- Novas regressões de UI adicionadas aos workflows de qualidade e produção.

## Pendências reais

1. Separar gradualmente estado, ciclo de vida, persistência e demais handlers ainda presentes em `workspace.tsx`. A extração feita reduz acoplamento dos comandos listados, mas não converte automaticamente todos os adaptadores em hooks/estado React.
2. Reduzir exceções CSS restantes por componente, verificando consumidores e a prioridade inline da biblioteca. Não apagar indiscriminadamente as 601 declarações inventariadas.
3. Complementar a matriz Chromium com WebKit/iPhone físico, tecnologias assistivas e medição de contraste nas paletas personalizadas. Não há certificação desses ambientes nesta entrega.
4. Ativação e validação de serviços externos continuam dependendo da configuração real de cada provedor. Nenhuma chamada de verificação de UI garante Supabase, Open Finance, Google ou quotas de produção configurados.

As alterações desta rodada estão prontas para revisão no repositório local; não foi feito deploy.
