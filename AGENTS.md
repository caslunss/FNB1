# Regras de manutenção do TEFinance

## Primeiro acesso e revisão de alinhamento — 07/11/2026

O proprietário pediu adequar o primeiro acesso ao design existente, verificar botões/UI da aplicação e autorizou explicitamente o deploy ao concluir. Nesta tarefa, corrigir inconsistências confirmadas, atualizar verificações proporcionais aos controles padronizados e publicar em main/Vercel. Preservar funções financeiras, versão atual, cores e padrões existentes; não executar limpeza, migrations ou alterar configurações/segredos.


## Importação de perfis — autorização específica em 07/11/2026

O proprietário autorizou expressamente aplicar database/friend-profiles.sql no projeto da aplicação para concluir a importação por @usuário. A autorização cobre a função privada em namespace dedicado e o wrapper público security invoker, permissões mínimas, testes negativos de autenticação e verificação de advisors. Nenhuma tabela, política ou registro de usuário deve ser alterado por essa etapa. Publicar o endpoint que usa essa função junto dos ajustes autorizados.

## Limpeza integral de pessoas — autorização específica em 07/11/2026

O proprietário confirmou explicitamente excluir todas as contas de login e os dados vinculados para começar do zero. Esta ação autoriza inventário e exclusão transacional de contas, sessões e dados dependentes apenas no projeto referenciado pela configuração pública da aplicação (qjxwghjamqrqxnrjpglx), com verificação posterior por contagens. Não divulgar registros pessoais, alterar esquemas, apagar o projeto ou transportar segredos. Essa autorização destrutiva é exclusiva desta solicitação e não autoriza limpezas futuras.

## Revisão do cadastro de amigos — 07/11/2026

O proprietário pediu substituir o contato fictício por cadastro com nome/foto e vínculo por @usuário, incluir barras por pessoa e corrigir ordem, alinhamento e sobreposição dos cards/menus. A revisão autoriza contratos compatíveis do JSON privado, interface, publicação da identidade escolhida para amigos aceitos via JSON privado, endpoint de leitura do perfil com prova de amizade, documentação e testes proporcionais. Preservar os demais dados existentes, versão atual e isolamento financeiro. Sem migrations, alterações de tabelas/políticas ou acesso a dados reais nos testes. A autorização de deploy da entrega de Amigos permanece válida para esta correção, incluindo aproximar o card do login da logo e resumir Novidades a até três destaques por versão conforme solicitado.


## Exceção da alpha.6 — autorizada em 07/11/2026

O proprietário autorizou expressamente criar Amigos no dock, mover Dividir conta, adicionar contatos fictícios e dívidas por amigo, solicitar dados no primeiro login, alinhar as barras superiores, avançar para a próxima alpha e fazer deploy junto das mudanças pendentes de cobrança. Nesta tarefa estão autorizadas as alterações de interface, contratos e dados do JSON privado do workspace, atualização de testes aos novos contratos, package/lockfile somente nos campos de versão, documentação e publicação em main com deploy Vercel. Não executar migrations nem alterar tabelas/políticas remotas. Não expor credenciais, fazer force-push ou tags.


## Exceção da revisão de visibilidade — 07/11/2026

O proprietário pediu revisar os cards de cada aba e autorizou expressamente o deploy. Nesta tarefa, estão autorizados corrigir o isolamento de cards por aba, incorporar o ajuste pendente de Últimos meses, atualizar documentação e testes que validam esses contratos, publicar os commits em main e concluir o deploy automático da Vercel. A autorização não inclui force-push, tags, migrations, alterações de dados nem exposição de credenciais.

## Regra de pertencimento de cards

Renderizar somente os cards da aba ativa, em vez de manter seções alheias visíveis. No Resumo: Entradas mostra entradas e comparação; Gastos mostra gastos, distribuição, maiores gastos, categorias e dívidas do mês; Metas mostra projeção, editor e acompanhamento de investimentos da meta; Hábitos mostra seus quatro cards. Lançamentos e Previsão têm telas próprias. Preservar filtros e dados ao trocar de aba. Validar presença e ausência dos cards nas próximas mudanças.

## Exceção para as duas revisões — autorizada em 07/11/2026

O proprietário autorizou explicitamente nesta conversa “autorizo tudo e faça os 2”, aprovando publicar juntas as duas entregas locais: restaurar o espaçamento uniforme e o agrupamento/alinhamento dos cards, revertendo o gap zero; e mover os cards de hábitos para uma opção Hábitos ao lado de Entradas, Gastos e Metas. Para essas alterações, sua documentação e novidades, está autorizado enviar os commits para `main` no GitHub e concluir o deploy automático da Vercel. Esta exceção substitui os limites de publicação anteriores somente nesse escopo. Não autoriza force-push, tags, migrations, alterações de dados ou exposição de credenciais.

## Exceção para publicação do contrato de cards — 07/11/2026

Após revisar a entrega local de organização dos cards, o proprietário autorizou explicitamente uma nova exceção nesta conversa. Para esta tarefa, é permitido enviar para `main` no GitHub e concluir o deploy automático da Vercel das alterações que removem espaços externos entre cards, centralizam o layout em `src/styles/card-layout.css` e registram a regra permanente, o changelog e as novidades. Esta autorização prevalece sobre a proibição de publicação abaixo somente neste escopo; não autoriza force-push, tags, alterações de dados, migrations ou exposição de credenciais.

## Regra permanente de organização dos cards — revista em 07/11/2026

O proprietário reverteu o gap zero: cards devem formar grupos em grades responsivas, com alinhamento nas linhas e espaçamento uniforme de 24 px no desktop e 16 px no celular, pelo token --content-card-gap. O container controla o espaçamento, sem margens duplicadas, offsets ou posicionamento avulso. Cards na mesma linha devem preencher sua célula; no celular ficam empilhados em uma coluna. Preservar padding, foco e áreas de toque. A revisão solicitada corrige a entrega de cards já autorizada para publicação e substitui sua regra anterior de gap zero.

## Exceção desta tarefa — autorizada pelo proprietário em 07/11/2026

O proprietário autorizou explicitamente publicar Novidades da versão em Configurações, renomear a paleta para Azul essencial e melhorar as sobreposições; depois autorizou a exceção para atualizar os testes de tema. Para esta entrega, é permitido ajustar `tests/dark-surfaces-regression.cjs` e `tests/layout-regression.cjs` às novas cores e opacidades, mantendo as verificações de contraste, adicionar a regressão de novidades da versão, enviar os commits desta tarefa para `main` no GitHub e concluir o deploy automático da Vercel. Esta exceção prevalece sobre as proibições de publicação e edição de testes abaixo somente neste escopo. Não autoriza force-push, tags, migrations, alterações de dados ou exposição de credenciais.

Antes de modificar a interface, leia `docs/GUIA-DE-LAYOUT.md`. Esse é o contrato visual deste projeto, solicitado pelo usuário. Atualize o guia quando uma mudança de padrão for explicitamente aprovada.

- Preserve a paleta escolhida, o Liquid Glass existente e as funções financeiras.
- Reutilize os componentes de `src/components/LiquidControls.tsx`; não crie um segundo sistema de botões, menus, campos ou cards.
- Componentes compartilhados devem funcionar tanto em `#app` quanto em `.account-panel-body`. Não restrinja o acabamento dos formulários apenas à página principal.
- Valide estados fechados e expandidos, menus sobre gráficos, claro/escuro e telas pequenas. Texto e controles devem permanecer dentro da superfície correspondente.
- Simplifique textos sem remover unidades, consequências, informações de privacidade, confirmação de exclusão ou regras financeiras necessárias.
- As categorias canônicas são as cinco do guia. Só mude chaves persistidas com pedido explícito e migração compatível, com backup e testes de totais. Nunca descarte categorias antigas durante uma atualização.
- Faça as verificações proporcionais à alteração e descreva o que foi realmente testado. Não prometa ausência universal de bugs.

## Versioning (permanent)

- Scheme: SemVer with pre-release channel. Current: 0.1.0-alpha.6.
- Single source of truth: src/version.ts. package.json "version" and the root version fields of the lockfile must match it; CHANGELOG.md top entry must match it.
- Every task that changes behavior must add an entry to CHANGELOG.md (pt-BR, Keep a Changelog style). Never create git tags, never push.
- Only the owner decides to bump the version.
- Every version change must add dated, user-facing changes to src/release-notes.ts for Configurações → Novidades da versão. Keep prior entries and ensure the current version/date match src/version.ts.

## Current project facts (updated)

- Calendar lives at the TOP of the app (not in the dock). Dock styles: pinned/default/mini via dockStyle in plan12layout_v1. Glass values are fixed at defaults. Settings is a grouped menu with sub-screens (src/components/settings/).
- No lint script exists. Use: tsc strict, npm test, check:styles, build, check:release/build-budget, Playwright local only (127.0.0.1).
- Seven older E2E scripts had their Settings selectors updated in the authorized Task E. Existing tests/snapshots remain protected unless an explicit task exception permits changes. Baseline browser runs can have intermittent selection failures; report the original run and any isolated repeat separately.
- Reports (AUDIT_REPORT.md, CLEANUP_REPORT.md, FEATURE_REPORT.md) are git-ignored. Never commit them.


## Regras permanentes do ciclo de verificação (fonte: proprietário)

### Stack, fatos e leitura prévia

React 19, TypeScript strict, Vite 8, Tailwind CSS 4 + CSS próprio, Liquid Glass, Motion, Supabase, Node.js + Vercel Functions (`api/`, `server/`), Vercel, GitHub e Playwright. Antes de assumir detalhes, leia `package.json`, configurações Vite/TypeScript/Vercel, `api/`, `server/`, `supabase/`, `tests/` e `.github/`. Use somente scripts existentes.

- Calendário sempre ativo no topo para todos os usuários, inclusive com preferência antiga desativada; preservar dados salvos.
- Dock com `dockStyle: pinned | default | mini` em `plan12layout_v1`, local ao dispositivo.
- Vidro fixo nos padrões: opacidade 66% claro / 64% escuro, blur 6px / 16px, suavidade escura 70%, intensidade 3. Preferências antigas são ignoradas na renderização e preservadas no armazenamento.
- Configurações é um menu agrupado com subtelas em `src/components/settings/`. Conta não aparece para visitantes. A regra mensal de nome de usuário é LOCAL ONLY, não imposta pelo servidor.
- Não existe script lint. Verificar `npm run check:types`, `npm test`, `npm run check:styles`, `npm run build`, `npm run check:release`, `node scripts/build-budget.mjs` e cada Playwright local em `127.0.0.1`.

### Missão

VERIFICAR E CORRIGIR APENAS. Sem novas funcionalidades ou redesign. Mudanças de comportamento, aparência, contratos ou dados exigem decisão explícita do proprietário, salvo correção de bug confirmada e autorizada na tarefa. Liste cada mudança de comportamento/contrato aprovada no relatório e no changelog.

### Proibições absolutas

1. Nunca fazer push, merge, force-push, tag, release ou deploy. GitHub pode publicar ao receber push em main. Somente branches dedicadas e commits locais; não tocar main.
2. Nunca conectar, consultar, migrar ou modificar Supabase/Pluggy reais ou produção. Sem migrations, seeds, db push/reset, escritas remotas ou uso/exposição de service_role. Não conectar MCP/CLI a projetos reais.
3. Nunca ler, imprimir ou commitar segredos, arquivos `.env*`, chaves ou tokens.
4. Nunca executar Playwright/scripts contra URLs ou dados de produção. Somente servidor ou preview local com transportes externos simulados/bloqueados.
5. Não editar lockfiles, `package.json`, `.vercel/`, tipos Supabase gerados, migrations, `.github/workflows`, tsconfig, configs Vite/Vercel ou testes/snapshots existentes. Exceções somente explícitas por tarefa; não tratar uma exceção anterior como permanente.
6. Não instalar ferramentas/dependências, atualizar versões principais ou executar `npm audit fix --force`.
7. Nunca usar `--update-snapshots`, apagar, pular ou enfraquecer testes para obter aprovação.
8. Nunca adicionar `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertions ou afrouxar TypeScript. Preservar React.StrictMode. Não auto-corrigir dependências de hooks nem migrar padrões apenas por existir API nova.

### Congelado por padrão — somente relatar

CSS, `docs/style-exceptions.json`, valores Liquid Glass/Motion, tokens, ordem de imports/cascade/layers, comportamento dock/Configurações/calendário, quota bancária (`server/functions/connect-token.mjs`, `server/shared/quota.mjs`), contratos das APIs e dados. Não mudar cores, tipografia, espaçamento, raio, sombras, ícones, animações, layout ou marca sem exceção explícita. Não remover calendário nem efeito Liquid Glass.

Classes construídas dinamicamente, mapas, condicionais, chaves CSS Modules, lazy/dynamic imports, registros por strings e rotas contam como uso. Não apagar código/CSS/assets por busca estática isolada. Preservar regras legadas inofensivas de negócio, fluxo, nomenclatura e design; somente propor alteração se houver bug, risco de segurança, problema de performance ou inconsistência demonstrada.

### Método e relatórios

- Mudanças pequenas, isoladas e reversíveis. Não misturar refactor com correção de bug. Um commit local por assunto, sem relatórios no commit.
- Antes de apagar/renomear, rastrear imports, imports dinâmicos, strings, configs, rotas, estilos, scripts e documentação em todo o projeto.
- Baseline antes; checks após cada grupo e ao final; comparação Playwright por script. Falha pré-existente é identificada como tal. Nova falha causada pela mudança deve ser corrigida ou revertida.
- Relatar cada verificação como PASSED / FAILED / NOT RUN, com motivo. Ausência de navegador/rede é NOT RUN, não confirmação de sucesso. Não afirmar teste/renderização que não ocorreu.
- Relatórios e checklists manuais em português, com resumo inicial de 10 linhas ordenado por severidade. Não commitar relatórios.
- `AUDIT_REPORT.md`, `CLEANUP_REPORT.md` e `FEATURE_REPORT.md` estão ignorados no repo. Relatórios adicionais só na raiz se já estiverem ignorados; caso contrário, armazenar fora do repositório e informar o caminho, mantendo a árvore limpa. Não alterar regras de ignore sem necessidade/autorização.
- Respeitar o versionamento acima: não aumentar a versão sem decisão do proprietário; mudanças de comportamento ganham registro em CHANGELOG.md, em pt-BR.
- Ao concluir o escopo autorizado, parar e aguardar o proprietário. A autorização para executar etapas enumeradas em sequência não autoriza publicação nem novas fases inventadas.
