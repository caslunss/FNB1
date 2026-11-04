# Auditoria técnica — 03/11/2026

## Escopo e limites

Revisão das fronteiras de dados de compras/Open Finance, cálculos em centavos, CDB, crédito/faturas, divisão de gastos, domínio tributário e recibos, seletores de mês/data, perfil e estilos compartilhados. A suíte completa exercita também persistência, backup, meses encerrados, pagamentos, relatórios, autenticação e navegação. Testes de API usam respostas simuladas; não comprovam credenciais, planos, cota ou disponibilidade dos fornecedores em produção. Não houve alteração das categorias canônicas, migração de dados, execução de SQL ou deploy.

Esta auditoria corrige os defeitos abaixo; não constitui garantia de ausência de todos os bugs possíveis.

## Defeitos e análise de impacto

### 1. Arredondamento de valores externos
- Causa: `Math.round(valor * 100)` nas fronteiras bancária e Shopping perde centavos em representações como `1.005`.
- Correção: `services/money.js` converte a representação decimal com BigInt e arredondamento de metade para cima; rejeita tipos inválidos, valores muito longos e resultados fora do inteiro seguro. A importação mantém valor absoluto conforme o tipo bancário validado.
- Dependências inspecionadas: domínio tributário já usa centavos e BigInt para alíquotas; CDB arredonda rendimento e cada tributo em etapas distintas; faturas e divisões operam em centavos. Essas fórmulas não foram substituídas por um parser de API. Preços Shopping continuam limitados e exigem BRL confirmado.
- Evidência: casos 1.005, 1.015, negativos, notação exponencial, infinitos e limites no teste `audit-regression.cjs`.

### 2. Transações bancárias inválidas e colisão de identidade ausente
- Causa: qualquer data com prefixo do mês era aceita; tipos desconhecidos viravam gasto; a ausência de id/providerId gerava a mesma chave para diferentes transações. Um elemento null também derrubava a página inteira.
- Correção: validar dia civil real, tipo CREDIT/DEBIT e identidade; rejeitar linhas inválidas individualmente antes de calcular o hash. Moeda, status, fatura, estorno e transferências conservam os filtros existentes.
- Dependências: foi preservada a precedência providerId/id e a composição do hash para não duplicar transações já importadas. Autorização por usuário/conexão/conta e paginação continuam verificadas em `bank-import-regression.cjs`.

### 3. Resposta parcial da SerpApi derrubava resultados válidos
- Causa: acesso a title em linha null e conversão de preço excessivo dentro de um único try/catch transformavam uma resposta parcialmente válida em erro geral.
- Correção: ignorar linhas sem objeto/título; preço inválido ou fora do limite fica desconhecido; manter produto válido e sanitização de URL.
- Dependências: interface já suporta preço desconhecido e resultado vazio; não inventa desconto, moeda ou frete. Sem mudança na consulta Gemini de links e análise agregada.

### 4. Payloads JSON inválidos retornavam 502
- Causa: parse e acesso a action eram feitos diretamente dentro do catch geral da integração de compras.
- Correção: sintaxe inválida, null e arrays recebem 400 antes da chamada ao fornecedor.
- Dependências: autenticação e limite de tamanho permanecem anteriores ao uso dos dados; connect-token já contém validação equivalente. Mensagens não expõem chave ou resposta bruta do fornecedor.

### 5. Eventos tardios do widget bancário após fechamento
- Causa: cleanup liberava o estado global, mas não marcava a instância como encerrada; callbacks posteriores podiam verificar/gravar uma conexão fechada ou desmontar novamente a instância.
- Correção: cleanup idempotente com estado disposed/finished; ignorar erro tardio durante verificação e sucesso de instância finalizada; callback de sucesso aceita payload ausente sem desestruturação que lance exceção.
- Dependências: verificação no servidor e propriedade da conexão são mantidas; a próxima tentativa pode abrir normalmente. Fluxo inspecionado por leitura; não foi feita conexão bancária real nem teste automatizado do SDK externo.

### 6. Mês inicial do calendário em UTC
- Causa: MonthPicker usava ISO UTC, divergindo do calendário local perto da virada do mês. DatePicker e controlador usavam dias locais.
- Correção: utilitário dates.js padroniza fallback local para mês e data. DatePicker revalida disabled/readOnly/min/max na confirmação, inclusive se o formulário mudar com o popup aberto.
- Dependências: MonthPicker continua para períodos e DatePicker para datas completas, ambos com superfície e tokens compartilhados; calendário de movimentações não é substituído por seletor de formulário. O domínio tributário mantém o fuso explícito America/Sao_Paulo por ter regra distinta. Datas de liquidação bancária continuam sendo datas do documento, sem deslocamento por conversão de timestamp.

### 7. Foco perdido ao editar lançamento a partir do perfil
- Causa: fechamento animado do perfil ficava pendente enquanto o editor seguinte já abria; seu término podia devolver foco ao avatar e fechar uma superfície no momento incorreto.
- Correção: fechamento imediato ao suspender o perfil para abrir editor; a animação de fechamento permanece para Escape/backdrop/fechar.
- Dependências: restaurar o perfil após o editor mantém o fluxo existente; configurações, sair e contenção de foco nativa são preservados.

### 8. Assinaturas incompletas e status enganoso
- Causa: lista fixa de marcas não mostrava serviços personalizados; cobrança futura no mês era excluída do total, e presença de lançamento era tratada como status ativo do serviço externo.
- Correção: módulo subscriptions.js agrupa lançamentos reais e componente React SubscriptionsCard mostra total do mês, quantidade de lançamentos, data do último registro e seção recolhida com outros registros. Inclui cobranças futuras registradas no mês. Cada grupo permite abrir o lançamento associado; serviços sem data não recebem um mês inventado.
- Dependências: nada é cobrado ou cancelado no fornecedor; sem mudança de valores persistidos, recorrências ou categoria. O card informa explicitamente que contrato/pagamento devem ser conferidos no fornecedor. O usuário pode editar o lançamento existente pelo fluxo financeiro validado.
- UI: LiquidControls, tokens de card, borda/sombra/raio existentes, ações mínimas de 44px, espaçamentos consistentes e quebra de linha no mobile. Outros registros ficam em disclosure, sem grade decorativa de marcas inativas.

### 9. Testes dependentes da diferença UTC/São Paulo
- Causa: fixtures de impostos e importação geravam a data UTC atual; à noite no Brasil ela podia ser futura para o backend, causando 409 indevido no teste.
- Correção: fixtures usam taxToday(), igual à regra de servidor.
- Dependências: preservados os testes explícitos de fronteira de fuso. A aplicação não passou a aceitar lançamentos tributários futuros para satisfazer o teste.

## Verificação

- Suíte completa `npm test`, com novas regressões para limites decimais, transações malformadas, datas reais, identidade estável, assinaturas personalizadas/futuras, resposta parcial Shopping e JSON inválido.
- `npm run check:types`, `npm run build`, `npm run check:release` e `git diff --check`.
- Navegador Chromium: assinaturas com registros fictícios em 320/390/768/1440 px, claro/escuro, total mensal, overflow e abertura de editor pelo perfil; concluído sem falha e sem erros de execução capturados.

## Pendências de produção

Configuração das chaves privadas na Vercel, planos/cotas dos fornecedores, login Google/Supabase e tabelas/RLS precisam ser conferidos na conta real. Importação bancária permanece assistida; não há webhook de sincronização automática. Estimativas IBPT exigem licença, UF, origem e vigência; CNAE sem metodologia cadastrada não vira alíquota presumida. Status ativo/inativo e faturamento do fornecedor de assinatura exigiriam integração específica, além de lançamentos financeiros locais.

## Complemento: CSS, botões, toggles e calendários

### 10. Padding de ações vazava para o calendário
- Causa: a regra global de `FinanceGlassButton` com padding 10/16 px também alcançava os botões de dias e meses. Em células estreitas, esse espaço concorria com a largura da grade.
- Correção: regras específicas de `.date-picker-dialog .date-picker-grid` e `.month-picker-dialog .month-picker-grid` em `control-surfaces.css`; dias mantêm padding zero e altura mínima de 44 px, meses usam 8 px.
- Dependências: botões de navegação de mês/ano continuam circulares; seletores de campos e abas mantêm geometria especializada. Não se aplicou uma altura fixa global a todo botão, pois textos longos, listas e cards interativos precisam crescer.

### 11. DatePicker descartava a referência do consumidor
- Causa: o input recebia `{...props}`, mas seu `ref` era imediatamente substituído pela referência interna.
- Correção: referência composta encaminha o nó ao ref do consumidor (objeto ou função) e preserva o ref interno utilizado pelo popup.
- Dependências: id/name, controle de valor, eventos input/change, constraints, foco e FormData permanecem no input original. `MonthPicker` tem outra API, value/onChange, e não sobrescreve ref de input externo. Verificação do encaminhamento por inspeção de código; não foi adicionado teste que apenas reproduza a implementação.

### 12. Switches dispersos e alinhamento inconsistente
- Causa: Layout, Notificações e Tema importavam switches diretamente e mantinham tokens de cor locais; notificações colocava o texto depois do switch, enquanto Layout usava texto antes.
- Correção: `FinanceGlassSwitch` centraliza o componente da biblioteca. Todos os consumidores atuais usam o wrapper; `--control-switch-on` centraliza o verde existente claro/escuro. Linhas de configurações compartilham alinhamento, gap e altura mínima; notificações alinha o texto visualmente à esquerda.
- Dependências: a biblioteca continua responsável por checked/onChange, arraste e semântica role=switch. Não convertemos checkboxes de seleção bancária ou de consentimento em switches: esses controles representam seleção/consentimento, não preferência ligada/desligada. Forçamos cores de sistema em forced-colors.

### 13. Troca de conta durante consulta bancária
- Causa: o seletor da conta permanecia habilitado enquanto a consulta estava em andamento; a resposta poderia preencher linhas da conta anterior sob a seleção nova.
- Correção: seletor desabilitado durante busy, assim como os botões de consulta/importação.
- Dependências: paginação e limpeza de seleção ao trocar conta são mantidas; a validação de propriedade no servidor continua obrigatória. Isto evita o conflito de UI; não substitui a autorização de backend.

## Inventário de componentes universais

| Família | Implementação e limites |
| --- | --- |
| Botões de ação | FinanceGlassButton → IOSButton → GlassButton; tokens e foco compartilhados. |
| Botões de abas | FinanceTabButton: botão nativo mobile com zoom do SVG e material externo único; desktop usa FinanceGlassButton. Não somar dois motores de transformação. |
| Selects | FinanceSelect + FinanceFieldButton + GlassTextField; apenas uma superfície externa. Fallbacks nativos preservam validação. |
| Switches | FinanceGlassSwitch em Tema, Layout e Notificações. |
| Checkbox | Mantém semântica nativa para seleção de registros, recorrência e consentimento; não é switch de preferência. |
| Data de formulário | DatePicker compartilhado por GlassTextField/templates, CalendarIcon comum e formato date-only. |
| Período mensal | MonthPicker reutilizado no Resumo, Impostos e Faturas, com o mesmo CalendarIcon e superfície month-picker-dialog. |
| Agenda financeira | Calendário de movimentações apresenta lançamentos/eventos; usa os mesmos tokens de estado e controles de navegação. Não é o mesmo componente de um seletor de data, pois tem responsabilidade distinta. |
| Cards | FinanceGlassCard/GlassSurface e tokens de raio, sombra e padding. Formulários internos não ganham outra moldura. |
| Modais | Dialog nativo, foco, Escape/backdrop e variantes responsivas; perfil centralizado é uma exceção explícita às folhas mobile. |
| Assinaturas | SubscriptionsCard, lista real, total mensal, último registro, outros registros recolhidos e uma ação de abrir lançamento. Sem grid de marcas inativas fictícias. |

A revisão das folhas de estilo e dos consumidores não justifica apagar todas as exceções: barras de navegação, células de calendário, campos, cards e botões circulares não podem ter exatamente a mesma dimensão. O padrão universal é a implementação compartilhada, os tokens, a semântica e o estado acessível. Não se afirma cobertura visual de todas as combinações de dados/navegadores.

### Resultado da verificação complementar

- Chromium em 320, 390, 768 e 1440 px, temas claro/escuro: switches de Layout respondem a clique e Espaço, restaurando o estado; Notificações usa a mesma família compartilhada; janelas sem overflow horizontal.
- DatePicker aberto a partir de Compra planejada: grade sem overflow nas quatro larguras, padding zero nas células e retorno do foco ao botão de calendário após Escape.
- Suíte completa sem falhas, checagem de tipos, build, distribuição e diff sem erros. A conexão real com fornecedores e todas as combinações possíveis de conteúdo/navegador não foram certificadas.

### 14. Regras históricas do seletor mensal ainda competiam na cascata
- Causa: layout-settings.css acumulava geometrias para select nativo, input month, botão circular e botão rotulado. Correções locais de Fatura/Impostos precisavam desfazer largura fixa, sombra externa e ícone absoluto.
- Correção visual: remoção dos blocos obsoletos e consolidação em month-controls.css, com variantes sem rótulo e com rótulo. O wrapper somente organiza; FinanceGlassButton mantém o material compartilhado.
- Dependências verificadas: Resumo com id mes preservado, Faturas controladas por cartão, Impostos com seu próprio período, foco, Escape, largura mobile, temas. Containers de grade/flex e funcionamento de MonthPicker não foram alterados. Alterações desta etapa restritas a CSS, importação de estilo e documentação.
