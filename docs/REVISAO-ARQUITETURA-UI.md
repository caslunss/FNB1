Versão do documento: 0.1.0-alpha.6

# Revisão de arquitetura, interface e dados

Implementação sobre React/Vite, APIs Vercel e Supabase. Nenhuma publicação nem migração de banco foi realizada.

## Correções e inspeção de efeitos relacionados

| Achado | Correção | Verificação relacionada |
| --- | --- | --- |
| TXT capturava `1.23` de `1.234,56` | Normalização explícita do formato brasileiro; formatos ambíguos são rejeitados | Zero, ponto decimal, vírgula decimal, grupos de milhar e pontuação final |
| XML descartava itens após o centésimo | Rejeição do documento antes de importar itens | Limite verificado com DOM real no Chromium e em teste unitário |
| Preço unitário usava arredondamento binário | Conversão decimal com BigInt, arredondamento em centavos e limite monetário validado | `1.005 → 101`, precisão adicional e valores inválidos |
| Prévia antiga continuava usando a rede | AbortController atravessa componente, prévia e cliente HTTP | Cancelamento antes da sessão/requisição; respostas antigas continuam protegidas |
| Limites de espera incompatíveis | Constantes compartilhadas: processamento servidor 170 s, cliente 200 s; timeouts individuais continuam ativos | Regressões dos endpoints e validação canônica preservadas |
| Switches não acompanhavam alterações externas | Listeners de storage e do evento de preferências, com remoção ao desmontar | Switch visual atualizado sem remount manual; sino também atualiza |
| Fechamento nativo deixava controlador aberto | onClose reconcilia o estado do controlador | Browser testa chamada externa a dialog.close, leitura, navegação e configurações |
| Popup fechado montava conteúdo e repetia agrupamento | Store tipado com snapshot estável, useSyncExternalStore e conteúdo condicional | Publicação equivalente não notifica assinantes; filtros e leitura preservados |
| Regras de vidro duplicadas nas notificações | Materiais usam os tokens existentes; Tailwind fica responsável pela organização interna | 320/390/768/1440 px, claro/escuro; filtros e estado ativo preservados |
| Texto secundário com opacidade adicional | Uso dos tokens de texto secundário na central | Mantidas paletas e cores sem trocar a fonte global |
| Login poderia esperar indefinidamente | Timeout de configuração, settings e SDK; retry acessível sem recarregar | Falha simulada do SDK seguida de sucesso ao tentar novamente |
| Mensagens de login não distinguiam situações | Mensagens separadas para timeout, configuração e conexão; aria-busy no provedor | Não altera nonce, validação de sessão, visitante ou persistência |
| Templates idênticos eram remontados sempre | Evita remontagem quando markup é idêntico e não há formulário/campo/dialog | Formulários mantêm seu reset síncrono; roots filhos não são desmontados antes dessa decisão |
| Reset de layout tinha impacto pouco claro | Texto explicita paleta/refração/indicadores globais e parâmetros do tema atual | Sem modificar a lógica ou os dados persistidos |

## Arquitetura e tipagem

- notification-store.ts oferece contrato tipado, subscribe/getSnapshot/publish e snapshots estáveis para React.
- notification-groups.ts separa o seletor puro de datas, testável com relógio fornecido. Datas sem informação suficiente ficam explícitas.
- types/finance.ts define contratos iniciais de despesa, notificação e opções da prévia. O tsconfig inclui os novos módulos TypeScript, além de Motion.
- login-network.js isola carregamento do SDK e espera com timeout. taxes/limits.js centraliza o orçamento de tempo.
- Fluxos de cálculo, persistência, rollback e fechamento existentes foram preservados e passaram novamente pela suíte financeira.

A tipagem é incremental: o núcleo JS legado ainda não é integralmente verificado pelo TypeScript. A migração completa de workspace.js e das raízes HTML/React deve ser feita por área, com testes de equivalência. O mesmo vale para remover a cascata CSS global: esta revisão centraliza a central de notificações, mas não elimina indiscriminadamente regras compartilhadas das outras páginas.

## Integração contínua

.github/workflows/quality.yml executa npm ci, testes, tipos, build, release e regressões Chromium de notificações, formulários/login e correções desta auditoria. Playwright é instalado isoladamente no runner, com versão definida. O pipeline não usa credenciais de produção nem efetua deploy. Sua execução no GitHub depende do envio do workflow ao repositório.

## Evidências e limites

- npm test: suíte completa, incluindo audit-fixes-regression.cjs, passou.
- npm run check:types, build e check:release passaram.
- Chromium: notificações e leitura persistida, fechamento externo, destinos/configurações, formulários com teclado simulado, 12 casos de login por tema/largura, sincronização de preferências e retry de login passaram.
- Não houve validação com conta real Google, IBPT ou Open Finance, nem aparelho iOS físico ou medição de desempenho de produção. A existência de configuração não comprova credenciais válidas.
- A revisão não certifica contraste sobre qualquer imagem de fundo nem ausência universal de bugs. Migrações amplas de design e estado exigem comparações por página.

## Conferência contra as propostas originais

| Proposta | Situação após a conferência |
| --- | --- |
| Corrigir TXT, limite XML e precisão dos itens | Concluída, com regressões específicas |
| Fechamento nativo e evitar conteúdo pesado com popup fechado | Concluída |
| Cancelar prévias ao mudar/fechar rascunho | Concluída no cliente; teste cobre cancelamento antes e durante a chamada HTTP. Não implica rollback do servidor |
| Recuperação de login sem recarregar | Concluída com SDK simulado; autenticação real não verificada |
| Preferências entre abas | Implementada; browser simula o evento externo na chave da conta. Não equivale a teste de duas sessões Google reais |
| Centralizar materiais e reduzir Tailwind redundante | Concluída na central de notificações; aplicação global permanece parcial |
| Substituir bridges por stores e extrair seletores | Implementada para notificações; financeiro permanece no controlador legado |
| Tipar o aplicativo | Parcial: store/agrupamento tipados e contratos iniciais; checkJs continua false e o núcleo financeiro JS não está integralmente coberto |
| Reduzir remontagens | Implementada para markup idêntico sem campos/formulários/dialogs; não elimina o adaptador HTML/React |
| Remover disputa global de CSS | Pendente por área. A contagem permanece em 622 usos de !important; não houve limpeza global |
| Executar testes no CI | Workflow preparado e comandos locais verificados; execução no GitHub pendente de publicação |
| Certificar alinhamento, contraste, animações e performance de todas as páginas | Não concluída globalmente: houve testes funcionais/responsivos dos fluxos citados, sem benchmark de produção ou comparação visual integral |

Esta tabela prevalece sobre qualquer interpretação de que todas as recomendações estruturais tenham sido concluídas. A revisão não encontrou falhas nos testes direcionados reexecutados, mas ainda existem as pendências acima.

## Atualização após migração estrutural

A situação registrada na tabela anterior é histórica. A API financeira dos componentes agora é modular, com snapshots reativos para todas as áreas que já tinham estado financeiro React, apresentações por domínio e cálculos centrais tipados. A fundação CSS foi centralizada e consolidada globalmente. O relatório atual é MIGRACAO-ESTRUTURAL-E-DESIGN.md, que diferencia separação estrutural de conversão integral do código legado para TypeScript/JSX e registra as exceções de compatibilidade mantidas.
