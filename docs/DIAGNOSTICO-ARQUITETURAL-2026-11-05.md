Versão do documento: 0.1.0-alpha.1

# Diagnóstico técnico e arquitetural — TEFinance

Data: 05/11/2026. Base auditada: commit `0a3c874`. Este trabalho entrega diagnóstico e exemplos de correção; não altera a implementação nem publica uma versão.

> Diagnóstico histórico dessa base. O resultado atualizado da decomposição do controlador, incluindo os arquivos que substituem as referências antigas a `workspace.tsx`, está em [Migração integral](MIGRACAO-INTEGRAL-CONTROLADOR-2026-11-05.md). Pendências de banco/provedores permanecem separadas desse trabalho.

## Escopo, evidência e limites

O projeto é **React 19 + Vite 8**, com handlers Web Request/Response na Vercel, Supabase Auth/Postgres/Edge Functions e integrações externas. Não é Next.js. Há TypeScript estrito no frontend, mas os handlers de servidor continuam em JS/MJS.

Revisei os caminhos centrais de inicialização, login, sincronização, persistência monetária, registro de comandos, apresentação adaptada, Análise/tributação, importação bancária, pesquisa de produtos, investimentos, exclusão de conta, CSS compartilhado, SQL disponível e CI. A revisão combina leitura dos módulos citados, execução dos checks e reproduções locais. Não representa leitura manual de todas as linhas de todos os arquivos ou certificação de ausência de vulnerabilidades.

**Executado nesta revisão:**

- `npm test`: aprovado; o runner selecionou **41 scripts** e produziu 127 mensagens `PASS`. Isso não significa 127 testes independentes ou cobertura de 100%.
- `npm run check:types`, `check:styles`, `build` e `check:release`: aprovados. Auditoria CSS: **609 declarações importantes inventariadas**.
- Chromium local, sessão visitante descartável: reprodução de preenchimento e sobrescrita de tributo existente; confirmação de que a revisão manual continua exigida.
- Handlers com `fetch` simulado: limite de compras em dois módulos isolados e consulta de investimentos sem Authorization. Nenhum provedor pago foi acionado por essas reproduções.

**Não verificado:** banco Supabase implantado, políticas/RLS efetivamente instaladas, Google/Pluggy/IBPT/SerpApi/BRAPI reais, faturamento e quotas de produção, Lighthouse/CPU em aparelho real, teste de carga, WebKit/iPhone físico e auditoria de advisories das dependências. Ausência de evidência no repositório não prova ausência de uma configuração no painel da infraestrutura. A matriz visual de 42 estados documentada na entrega anterior não foi repetida integralmente nesta auditoria.

Prioridades: **P1** = integridade de dados, custo ou bloqueio de implantação; **P2** = confiabilidade, desempenho e manutenção; **P3** = acabamento. Não foi comprovada uma falha crítica de invasão de contas nesta revisão.

## 1. Plano de ação

| Ordem | Ação | Entrega e critério de aceite |
| --- | --- | --- |
| 1 — P1 | Corrigir abertura do editor tributário | Botão + e Revisar carregam a mesma análise existente. Salvar sem editar preserva valor, classificação e documento; teste de regressão reproduz os R$ 10,00 descritos abaixo. |
| 2 — P1 | Colocar orçamento de consultas no servidor, compartilhado entre instâncias | Limite atômico em Postgres/Redis para consultas pagas. Duas instâncias não podem conceder o mesmo orçamento simultaneamente. Definir explicitamente se investimentos são públicos ou exigem sessão. |
| 3 — P1 | Tornar o banco recriável | Migrações versionadas em ordem, schema `private` explícito, tabelas sociais e políticas incluídas. Banco de teste vazio aplica migrações e executa os testes SQL entre dois usuários. |
| 4 — P2 | Corrigir concorrência e paginação tributária | Resposta antiga não altera estado novo. Listagem por período, com cursor/ordem estável e indicação de próxima página; testar quantidade superior ao limite do PostgREST. |
| 5 — P2 | Proteger recuperação e armazenamento local | Orçamento de bytes para snapshots/cópias, uso progressivo de IndexedDB, retenção explícita e exportação antes de descartar cópias. Testar quota cheia mantendo os dados anteriores. |
| 6 — P2 | Modularizar por domínio | Extrair dívidas, lançamentos, calendário, relatórios e conta do controlador, um domínio por vez. Serviços independentes de DOM; componentes chamam comandos tipados. Manter testes financeiros e paridade visual em cada extração. |
| 7 — P2 | Reduzir custo inicial e trabalho síncrono | Medir waterfall/CPU em build real e dados de 1 mil/10 mil registros; separar código de conta/relatórios quando o grafo permitir e evitar serialização integral em alterações pequenas. Definir orçamento de bundle e duração das interações. |
| 8 — P2 | Concluir governança do design e qualidade | Migrar famílias de seletores legados sem acumular overrides; regressões de estados fechados, teclado, modais, claro/escuro e WebKit. CI também exercita preview de produção. |
| 9 — P2 | Instrumentar falhas e segurança de borda | IDs de correlação, métricas de latência/erro/quota sem dados financeiros ou tokens, CSP em Report-Only e catálogo único de configuração. |
| 10 — P3 | Concluir pendências de produto | Receber arte definitiva do login; apresentar modo local/offline/conflito explicitamente na abertura; deixar integrações indisponíveis explicadas sem tratá-las como recursos ativos. |

Não recomendo introduzir React Query, Redux ou Zustand em todo o projeto de uma vez. O cache público existente já deduplica leituras; uma biblioteca só deve substituir uma responsabilidade claramente delimitada. Também não recomendo aplicar `memo/useMemo` indiscriminadamente: o custo atual inclui renderização síncrona, serialização e adaptação, que essas ferramentas não eliminam sozinhas.

## 2. Erros, bugs e segurança

### B1 — P1 — O botão + pode substituir uma análise preenchida por uma análise vazia

**Comprovado em navegador.** [Taxes.tsx](../src/components/Taxes.tsx#L31), abertura do editor; salvamento em `submit`, linha 47; persistência visitante em [client.ts](../src/services/taxes/client.ts#L16).

`open(null)` seleciona `available[0]`, mas obtém os dados de `expense?.record`, que é nulo. A compra existente fica selecionada com campos vazios. O salvamento usa a revisão atual obtida de `records`, portanto a proteção de concorrência aceita a alteração, mesmo sendo uma sobrescrita involuntária.

Reprodução em dados descartáveis:

```text
Compra R$ 100,00; tributo salvo R$ 10,00
Abrir pelo botão +: campo de tributos = ""
Abrir pelo botão Revisar: campo = "10,00"
Abrir +, marcar revisão e salvar sem preencher: totalCents = null
```

Não foi demonstrada alteração do valor do gasto. A perda é da análise tributária; no modo visitante, `saveTax` substitui o registro sem histórico de revisões. No servidor existe tabela de histórico, mas isso não impede a sobrescrita nem oferece restauração automática pela UI.

Correção sugerida para o núcleo da abertura, preservando o restante do modal:

```tsx
const id = expense?.id ?? available[0]?.id ?? '';
const current = expense?.record ?? records.find(row => row.itemId === id) ?? null;
setSelected(id);
setNewExpense(!id);
setInput(current?.input ?? empty);
setTaxText(current?.input?.documentTotalCents == null
  ? '' : decimal(current.input.documentTotalCents));
// O useCallback que usa essa leitura precisa depender de [available, records].
```

Inspecione também mudança da compra no select, importação de documento, prévia e revisão: esses caminhos precisam compartilhar uma função de hidratação do editor para não divergir novamente. O checkbox de revisão já existe e funcionou no teste; ele não resolve um preenchimento incorreto.

### B2 — P2 — Falha de uma atualização antiga pode aparecer sobre dados novos

**Confirmado pela lógica.** [Taxes.tsx](../src/components/Taxes.tsx#L27).

O sucesso e o `finally` de `refresh` verificam `token === version.current`; o `catch` verifica apenas montagem. Se A iniciar, B iniciar/concluir e A falhar depois, o erro antigo é exibido sobre o resultado atual de B.

```tsx
catch (error) {
  if (mounted.current && token === version.current) {
    setError(errorDetails(error).message);
  }
}
```

Teste recomendado: duas promises controladas, B resolve antes de A rejeitar; somente B pode afetar a tela. A mesma regra deve valer para loading, mensagens e dados, não apenas `setRecords`.

### B3 — P1 — A limitação da pesquisa não é global entre instâncias

**Comprovado com transporte simulado.** [shopping.mjs](../server/functions/shopping.mjs#L5), mapa `requests` e verificação na linha 6.

A chave de limitação é o usuário, mas o armazenamento é um `Map` do processo. O token do usuário foi validado normalmente no mock; não houve bypass da autenticação. Ao usar duas instâncias de módulo isoladas, ambas têm seus próprios mapas:

```text
Mesmo usuário, worker A: 200, depois 429
Mesmo usuário, worker B imediatamente: 200
Total de chamadas ao provedor: 2
```

Cold starts e múltiplas instâncias serverless anulam a expectativa de intervalo global de 15 segundos. Isso permite ampliar consumo de SerpApi/Gemini com sessões válidas. O cache/`blockedUntil` de investimentos tem a mesma limitação de escopo de processo.

Integração proposta, **contrato ilustrativo** — `quotaStore` ainda precisa ser implementado com operação atômica:

```js
const allowance = await quotaStore.take({
  subject: user.id, operation: 'shopping', limit: 1, windowSeconds: 15,
});
if (!allowance.allowed) {
  return Response.json({error: 'Aguarde para consultar novamente.'}, {
    status: 429, headers: {'Retry-After': String(allowance.retryAfter)},
  });
}
```

Use como referência a ideia de orçamento persistente já existente em `app_tax_take_budget`, não uma sequência não atômica de GET/SET. Inclua limites por operação e orçamento de custo; uma consulta de produto pode fazer duas chamadas ao Gemini.

### B4 — P1 — Endpoint público de investimentos consome credencial paga sem orçamento próprio

**Comprovado com transporte simulado.** [investments.mjs](../server/functions/investments.mjs#L4).

Uma requisição GET sem `Authorization`, com configuração de servidor válida no mock, retornou 200 e acionou o provedor. `BRAPI_TOKEN` fica corretamente no servidor, mas a rota funciona como proxy público dessa cota. O handler só reage ao 429 do provedor; não impede consumo excessivo antes dele. O cache tem chaves variáveis e `Cache-Control: no-store`.

Ser público pode ser uma decisão de produto; não é automaticamente acesso indevido aos dados privados. A falha de proteção é não ter um orçamento de uso no servidor. Se exigir login, valide o usuário antes da chamada. Se continuar público, use rate limit compartilhado, cache/CDN somente de dados públicos e limite de custo por operação. Não reutilize cache público em endpoints de conta/banco/impostos.

### B5 — P2 — Listagem tributária sem paginação pode apresentar cobertura incompleta

**Lacuna de código; impacto em produção depende da configuração do PostgREST.** [handler.js](../server/taxes/handler.js#L26), [client.ts](../src/services/taxes/client.ts#L15), [TaxHistory.tsx](../src/components/TaxHistory.tsx#L7).

A API usa `limit=10000` em uma chamada, sem paginação nem filtro de período, e o cliente trata a resposta como completa. O limite de linhas configurado no PostgREST pode ser menor; não foi consultado neste ambiente. O botão “Mostrar mais” apenas amplia a fatia do array já recebido e não busca linhas omitidas pelo servidor. A comparação de cobertura pode ficar incompleta sem aviso.

Implementar consulta por mês e cursor estável `(data,item_id)`, retornar `nextCursor/hasMore` e validar a quantidade recebida. Testar também a listagem de IDs usada em `import-metadata`: ela igualmente assume que recebeu todos os registros existentes.

### B6 — P1 de implantação — Os arquivos SQL não recriam todo o banco sozinhos

**Ausências confirmadas no repositório; banco implantado não inspecionado.** [finance-sync.sql](../database/finance-sync.sql#L25) cria função no schema `private`, sem criá-lo nesse arquivo ou nos demais SQL versionados. Em um banco sem esse schema, a instrução falha. O arquivo também não envolve toda a instalação numa transação.

[account-deletion.sql](../database/account-deletion.sql#L4) exige tabelas sociais e nomes exatos de constraints. Não encontrei as instruções de criação dessas tabelas no conjunto SQL disponível. Isso não prova que faltam no Supabase atual; prova que uma recuperação a partir apenas deste repositório depende de estado externo não versionado.

Pré-requisito mínimo para a função:

```sql
create schema if not exists private;
```

Isso sozinho não completa a migração. Versionar tabelas, constraints, grants e políticas sociais, além da ordem de instalação. Executar a recriação em banco descartável com Auth compatível e rodar `finance-sync-security-test.sql`; não reaplicar SQL destrutivo cegamente no banco existente.

### Segurança: o que está protegido e o que ainda precisa ser validado

- Os handlers de banco, impostos e exclusão validam identidade no servidor. Pluggy verifica `clientUserId` e a conta pertencente ao item. Não identifiquei IDOR demonstrado nesses caminhos.
- O SQL de snapshot limita leitura/escrita ao dono com RLS, restringe colunas e gera revisão no banco. Impostos escreve pelo servidor e usa revisão nas alterações. É uma base positiva, mas os scripts não foram executados contra o Supabase real nesta sessão.
- Não encontrei SQL montado para execução arbitrária ou XSS explorável demonstrado nos caminhos revisados. A sugestão HTML de pesquisa está em iframe com sandbox sem `allow-scripts`/`allow-same-origin` (`workspace.tsx:2786`); não se deve remover esse isolamento.
- Chaves Supabase **publishable** no cliente não são segredos. O problema de manutenção é haver configuração duplicada no `shopping.mjs`, no JSON público e nos demais adaptadores, não o simples fato de a chave pública estar no frontend.
- `vercel.json:13` define alguns headers, mas não contém Content Security Policy. Com tokens em `sessionStorage` e dados financeiros locais, eventual XSS teria impacto alto. Adotar CSP primeiro em Report-Only, compatível com Google, Pluggy, imagens e estilos do Liquid Glass, sem quebrar login. Não alego que uma XSS foi encontrada só por faltar CSP.
- Os handlers limitam o tamanho **depois** de `req.text()`. Isso limita o processamento do JSON, mas não a leitura inicial. Avaliar leitura com limite de bytes e os limites efetivos do gateway; não afirmar memória ilimitada na Vercel, que também aplica seus próprios tetos.

## 3. Problemas futuros e dívida técnica

### D1 — P2 — Snapshot completo, serialização e armazenamento síncrono

[workspace.tsx](../src/finance/workspace.tsx#L221), [finance-sync.ts](../src/services/finance-sync.ts#L97), [finance-runtime.ts](../src/services/finance-runtime.ts#L9).

Uma alteração pequena serializa o workspace, grava no storage e prepara sincronização do documento completo. A sincronização calcula representação canônica/hash e lê o snapshot inteiro; o polling visível ocorre a cada 30 segundos (`finance-sync.ts:106`). Os snapshots para React também usam JSON para comparação/clonagem.

Isso escala com **volume de dados por usuário e usuários simultâneos**, não só com quantidade de componentes. O SQL admite documentos de até 8 MB; a quota local do navegador pode impedir salvar antes disso, especialmente com backups. Não foi realizado benchmark para afirmar quantos milissegundos trava em cada celular.

Curto prazo: medir operações com 1 mil/10 mil registros, impedir payloads próximos da quota, reduzir reprocessamento por domínio e evitar polling inútil. Médio prazo: entidades/tabelas por domínio e sincronização incremental, preservando revisão, outbox, recuperação e atomicidade das operações financeiras. Não trocar diretamente por atualizações sem controle de concorrência.

### D2 — P2 — Cópias de conflito crescem sem retenção

[finance-sync.ts](../src/services/finance-sync.ts#L69).

Cada resolução adiciona cópias completas local/nuvem ao mesmo array no storage. Não há limite de quantidade/bytes ou UI de retenção. Depois de conflitos sucessivos, `setItem` pode exceder a quota e bloquear a resolução.

A implementação falha antes de substituir a versão escolhida, o que é preferível a perder os dados silenciosamente. A dívida é a falta de recuperação administrável: exportar, consultar espaço, mover cópias para IndexedDB e oferecer descarte explícito. Não cortar o array automaticamente sem informar o usuário.

### D3 — P2 — Migração de sintaxe concluída não significa migração arquitetural concluída

[workspace.tsx](../src/finance/workspace.tsx) tem **3.058 linhas**. [FinanceView.tsx](../src/components/FinanceView.tsx) tem **509**, interpreta atributos/classes e monta componentes através de uma árvore de apresentação adaptada (`presentation-tree.ts`). `renderView:490` serializa conteúdo, pode desmontar roots e utiliza `flushSync` com uma nova chave de revisão.

Continua existindo acoplamento entre regra financeira, IDs DOM, delegação de clique, montagem React e ciclo de foco. O caso recente de Adicionar dívida, convertido por regra genérica de apresentação, é um exemplo de fragilidade desse contrato. Não significa que o botão continue quebrado: a exceção direta já está no código atual.

Plano: separar comandos/consultas de renderização e converter uma tela por vez para composição React direta. Manter um adaptador estreito enquanto integrações antigas precisarem dele. Exemplo de direção:

```tsx
function DebtToolbar({onCreate}: {onCreate: () => void}) {
  return <FinanceGlassButton aria-label="Adicionar dívida" onClick={onCreate}>+</FinanceGlassButton>;
}
// O controlador valida/salva; o componente não depende de data-a, querySelector ou IDs globais.
```

Não remover `flushSync` globalmente: os comandos atuais leem/focam campos logo após renderizar. Antes de removê-lo, migrar esses consumidores.

### D4 — P2 — Cascata CSS continua difícil de prever

`src/styles/layout-settings.css`, `mobile.css`, `option-controls.css` e o inventário `docs/style-exceptions.json` coexistem com estilos da biblioteca. Há **609 declarações `!important`** inventariadas. Isso é uma contagem de manutenção, não uma prova de 609 bugs.

A camada universal de controles e os imports ordenados são avanços reais. Ainda há seletores amplos como `body ...` e regras específicas de página na mesma folha extensa. Alterar um ancestral pode afetar menus/top layer/fixed; o blur no ancestral da navegação foi corrigido na entrega anterior e não deve ser reintroduzido.

Migrar por família de componente, preservando tokens, cor e geometria. Substituir exceções de forma mensurada, em vez de remover todos os `!important`. Matriz necessária: fechado/aberto, hover/teclado/desativado, claro/escuro, movimento/transparência reduzidos e popup sobre gráfico.

### D5 — P2 — Bundle inicial ainda relevante para mobile

Build atual, tamanhos emitidos pelo Vite:

| Artefato | Sem compressão | gzip |
| --- | ---: | ---: |
| chunk compartilhado `preload-helper-*.js` | 650,41 kB | 195,87 kB |
| `app-*.js` | 285,96 kB | 87,41 kB |
| CSS do app | 302,76 kB | 53,40 kB |
| CSS do login | 234,20 kB | 41,83 kB |

Há lazy loading real para impostos, investimentos, metas e banco (`DeferredPage.tsx`). Portanto a recomendação não é “adicionar lazy em tudo”. Investigar o grafo dos chunks compartilhados, bibliotecas de motion/refração, styles realmente necessários no login e custo do controlador inicial. Esses tamanhos não equivalem a tempo de carregamento ou prova de travamento; medir waterfall/parse/execução em rede e CPU limitadas. Evitar `manualChunks` arbitrário que apenas mova os mesmos bytes entre nomes.

### D6 — P2 — Tipos e testes não cobrem toda a fronteira backend

`tsconfig.json:22` inclui somente `src`, com `allowJs:false`. Os JS/MJS de servidor e a instalação SQL ficam fora do check de tipos do frontend. Há validações manuais e mocks úteis, mas TypeScript não valida respostas remotas em runtime.

Introduzir schemas de entrada/saída e testes de contratos com payloads desconhecidos, resposta não JSON, timeout, permissões e limites. Backend pode migrar progressivamente para TS ou usar `checkJs`/JSDoc próprio. Em `TaxBankImport.tsx:11`, o retorno JSON tipado por asserção genérica não garante que `accounts`/`rows` vieram como arrays.

### D7 — P2 — CI valida o servidor de desenvolvimento, não toda a publicação

[quality.yml](../.github/workflows/quality.yml#L33) executa build/release e depois inicia **`npm run dev`** para regressões de navegador. Não executa a mesma bateria sobre `vite preview`. SQL de RLS também não é aplicado/executado nesse workflow. WebKit não está instalado.

Adicionar job de navegador em build de produção para caminhos críticos e job de banco descartável com migrações + testes entre dois usuários. Manter mocks determinísticos dos provedores e separar testes de contratos reais com credenciais próprias de teste. Não conectar CI de PR a dados financeiros de produção.

A integração GitHub/Vercel pode publicar em paralelo ao CI; o repositório não prova que o painel da Vercel espera os checks. Confirmar proteção da branch e estratégia preview/promoção no serviço, sem assumir que `npm test` bloqueia deploy automaticamente.

### D8 — P2 — Diagnóstico operacional insuficiente e configuração repetida

`connect-token.mjs:44`, `shopping.mjs:21` e o helper `db` em `server/taxes/handler.js:23` simplificam erros, o que evita expor segredos ao cliente, mas perdem distinções úteis de timeout, upstream, credencial, schema ausente e rede. A tax API, por exemplo, converte muitos erros diferentes de PostgREST em 502 genérico.

Adicionar eventos estruturados com request ID, operação, duração e status, sem JWTs, chaves, XML, descrições de gastos ou respostas bancárias. Centralizar a configuração pública e privada com validação de bootstrap, mantendo secrets só no servidor. Um endpoint que confirma presença de variável não comprova chave válida/faturamento; `service-status.mjs` já avisa corretamente dessa limitação.

### D9 — P2/P3 — Abertura e pendências visuais precisam de estados explícitos

`finance-sync.ts:46` captura erro e devolve `{mode:'offline'|'error'}`, enquanto `App.tsx:17` marca a preparação como pronta quando a Promise resolve. Isso **não é necessariamente bug**: manter acesso à cópia local é desejável. Mas o loading não é uma auditoria completa da conta nem das APIs e deve distinguir “pronto local”, “sincronizado” e “precisa de recuperação”, sem bloquear indiscriminadamente o modo offline.

O PNG central em `Login.tsx:35` continua sendo o logo provisório; a arte definitiva ainda depende do arquivo do usuário. `login-fullscreen.css:40` faz fade/máscara, mas não substitui a necessidade do asset correto. Apple permanece um controle desativado, não uma integração pronta. Não incluir esses itens como “concluídos” em uma lista de features ativadas.

Os testes emitiram warnings React de keys ausentes, apesar de passarem. Corrigir listas por IDs estáveis no local de origem e fazer o teste falhar para warnings inesperados selecionados; não confundir mensagens `PASS` com ausência de avisos.

## Conclusão técnica

A aplicação tem proteções relevantes: dinheiro em centavos e conversão decimal explícita, validação de sessão no servidor, RLS proposta, revisão otimista, backups de conflito, cache público com deduplicação, componentes universais e ampla regressão. Não recomendo uma reescrita completa.

As primeiras correções devem ser **preservar análises tributárias existentes**, **controlar custo de integrações entre instâncias** e **tornar o banco reproduzível**. Depois, reduzir os custos de snapshots/controlador/CSS gradualmente, com medições e contratos de dados. A prova de que compila e passa nos testes é necessária, mas não valida implantação do banco, comportamento em iOS real ou funcionamento dos provedores contratados.
