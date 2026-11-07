Versão do documento: 0.1.0-alpha.6

# Execução do plano — 05/11/2026

O plano da auditoria foi seguido na sequência para as mudanças locais. A **migração estrutural do controlador foi concluída** e está documentada em [Migração integral](MIGRACAO-INTEGRAL-CONTROLADOR-2026-11-05.md). A instalação/validação no Supabase continua pendente; não houve alteração do banco remoto nem deploy nesta etapa.

| Etapa | Resultado concreto | Situação/continuação |
| --- | --- | --- |
| 1. Preservar análise | Add/Revisar e troca da compra compartilham hidratação pura; revisão, documento e R$ 10,00 mantidos. Erro de requisição antiga não invade resultado atual. | Correção implementada e reprodução completa no navegador passou. |
| 2. Quotas compartilhadas | RPC Postgres atômica e camada comum; compras por usuário/15s; investimentos públicos com teto global de chamadas upstream/minuto; cache não gasta outra permissão. Falha de infraestrutura fecha consultas pagas com 503, cota esgotada retorna 429/Retry-After. | Código e contrato entre duas instâncias testados. **Não ativo remotamente até instalar SQL e credencial de servidor.** |
| 3. Banco recriável | Baseline social com RLS/grants por coluna; schema private explícito; snapshot em transação; ordem de instalação e distinção instalação nova/upgrade documentadas. | SQL preparado. Instalação em Supabase descartável e teste SQL real ainda necessários; não foi declarada validação em Postgres apenas com mocks. |
| 4. Concorrência/paginação | Token também protege catch; listagem e import-metadata paginam IDs com ordem estável. Cliente lê até cursor terminar e detecta repetição de cursor. | Teste de 150 registros, três páginas, sem duplicação e com owner scope passou. Paginação reduz truncamento, mas ainda carrega todas as páginas para as agregações atuais. |
| 5. Recuperação | Cópias de conflitos têm orçamento de 2 MB; exceder preserva versões em vez de descartá-las. Configurações oferece exportar e remover somente cópias antigas com confirmação. | Implementado. Snapshots atuais/outbox não são apagados. Migração geral para IndexedDB segue pendente; não aumentamos artificialmente a quota do navegador. |
| 6. Modularização | Editor tributário compartilhado; comandos em `src/finance/controllers`; estado, persistência, eventos, renderers e serviços em módulos de `src/finance/session`. Entrada reduzida de 3.037 para 37 linhas, com contratos tipados, composição e descarte de recursos. | Decomposição integral do controlador concluída. Testes de sessão, recuperação, centavos, persistência e comparação visual registrados no relatório integral. |
| 7. Performance | Orçamento automatizado dos bundles gzip, integrado ao CI; nova arte servida em WebP lossless, com PNG de fallback, sem alterar pixels. | Budget passou. WebP ~740 KiB versus PNG ~1,2 MiB. Ainda faltam benchmarks de CPU/dados grandes e redução do snapshot/controlador; budget não equivale a melhora de LCP medida. |
| 8. Design/qualidade | Login centralizado, sem logo antiga/títulos decorativos; nova regressão claro/escuro. CSS duplicado consolidado sem elevar as 609 exceções. Job adicional usa preview de produção e contém teste de marca em Chromium/WebKit. | Chromium local passou. Job WebKit preparado, não executado neste ambiente; não foi prometida validação de iPhone físico. Migração de todo o CSS continua pendente. |
| 9. Borda/observabilidade | CSP em Report-Only e telemetria sanitizada no serviço de quotas (operação/status/request ID, sem dados de usuário/payload/segredos). | Base implementada. Report-Only não bloqueia ataques e não há coletor de relatórios configurado; extensão da telemetria aos demais provedores continua pendente. |
| 10. Produto/login | Guaxinim enviado pelo usuário preparado em PNG transparente; branco/margens removidos. Centralização, fade no carregamento, contraste no escuro e marca no loading. Textos decorativos removidos; rótulos funcionais, privacidade e erros preservados. | Implementado. O loading continua acompanhando acesso/preparação; não é certificado de funcionamento das APIs. |

## Arquivos e regressões

- `Taxes.tsx`, `taxes/editor.ts`: bug de sobrescrita resolvido. Reproduzido antes: total 1000 virava null; depois: 1000 permanece 1000 após Add/salvar.
- `server/shared/quota.mjs`, `database/api-budget.sql`: orçamento compartilhado e falha fechada. `api-quota-regression.cjs` testa dois workers contra uma concessão persistente simulada; teste do lock SQL real ainda depende de banco.
- `tax-pagination-regression.cjs`: três solicitações para 150 análises e ausência de duplicação.
- `tax-editor-regression.cjs`: hidratação compartilhada, revisão/documento preservados.
- `login-brand.browser.cjs`: oito combinações de largura/tema; sem PNG antigo/cabeçalhos decorativos, centro geométrico, formulário visitante e reduced motion. Desenvolvimento e produção passaram.
- `mobile-forms-login.browser.cjs`: quatro formulários expandidos e 12 combinações de login passaram; asserções atualizadas para centralização autorizada em vez do split antigo.
- `analysis-selects.browser.cjs`: cinco larguras, dois temas, native popover/fallback passaram; `startup-debt.browser.cjs` passou em dev e produção.
- Checks do projeto: testes automatizados, TypeScript, CSS, build/release e orçamento de bundles executados.

## Próximo bloqueio real

Aplicar e validar as migrações em Supabase de teste antes de habilitar essas APIs em produção. Não há ferramenta Supabase de administração disponível nesta sessão. `database/INSTALLATION.md` lista ordem, limites e variáveis necessárias; valores de secrets não devem ser enviados no chat. O código não foi publicado para evitar ativar handlers protegidos sem sua infraestrutura correspondente.

Depois dessa validação, fechar a etapa 3, validar endpoints reais e continuar a medição de desempenho. A extração do controlador foi concluída; isso não equivale a resolver toda a dívida arquitetural ou ativar provedores externos.
