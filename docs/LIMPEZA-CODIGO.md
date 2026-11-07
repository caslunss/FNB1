Versão do documento: 0.1.0-alpha.5

# Limpeza de código — 03/11/2026

## Escopo

Refatoração sem modificar estilos, nomes de classes, estrutura das telas, textos ativos, regras financeiras ou formatos persistidos. Sem novas dependências.

## Changelog

### Controlador financeiro

- Removidos os controladores do menu antigo de perfil: toggleAccountMenu, positionAccountMenu e closeAccountMenu; estado accountMenuOpen; listeners de reposicionamento, fechamento externo, teclado e delegação desse menu. O avatar atual continua abrindo o ProfileCard no dialog existente, e o shell DOM/CSS foi preservado.
- Removidos profileTabs, youSection e seus handlers de segmentos/cliques, substituídos pela navegação atual em cinco áreas.
- Removidos comingSoon e subscriptionReviewView, funções sem chamadas. O conteúdo ativo de assinaturas, apoio e integrações permanece nas implementações atuais.
- Removidos num, limT, CI e receiptBusy, sem leituras úteis. Mantidos o worker de recibos, o cancelamento e a proteção por geração.
- Simplificado o despacho de páginas para rotas que realmente chegam ao render. A normalização dos atalhos antigos continua intacta.
- Simplificado o render de modais para Perfil, Calendário e Configurações. Cartões, ofertas, amigos, relatórios e integrações continuam encaminhados para as áreas atuais antes dessa etapa.
- O argumento não lido do callback de rótulos do gráfico de meta usa o placeholder _, preservando o índice e a saída.

### React e serviços

- Taxes: removidos editing/setEditing e suas atualizações; os registros/revisões efetivamente usados para salvar e revisar análises permanecem.
- ProgressGauge/TemplateView: removida a prop indicatorKey, nunca lida. Os atributos de identificação nos templates e todas as classes renderizadas permanecem. Também foi simplificada a condição enabled, constante true, sem alterar a classe ou opacidade resultante.
- MobileExperience: removidas condições para atalhos que não fazem parte da lista renderizada; calendário e configurações mantêm os mesmos destinos.
- finance-sync: removido pendingRemote e suas atribuições sem leitura. A resolução de conflitos continua consultando a versão remota, fazendo backup e respeitando revisões como antes.
- login: removida a variável dark, calculada mas não usada pelo botão Google.
- page-motion: removidos o parâmetro blur não utilizado e o argumento correspondente; presets, filtros e animações mantidos.
- Excluído src/services/login-background.js, módulo sem imports, referências HTML ou chamadas. O fundo ativo do login, seus assets e seus estilos permanecem.

### Testes

Sete testes extraíam o núcleo financeiro até a declaração vazia const CI. O delimitador foi atualizado para a função real tiles; os cenários e as asserções financeiras não foram removidos nem relaxados.

## Preservado intencionalmente

Código de leitura de registros antigos, migrações de categorias, recuperação/backup, compatibilidade dos atalhos e APIs públicas/testadas. A biblioteca financeira cdb.js permanece coberta pelos testes. Esses caminhos não são código morto apenas por não aparecerem na tela inicial.

CSS, assets e estrutura de WorkspaceLayout não foram alterados. Nenhum componente ou conteúdo atual foi substituído por mocks na aplicação; APIs simuladas são usadas somente na verificação local.

## Verificação

Varredura de AST dos módulos React/JS, grafo de imports das duas entradas e análise de símbolos não usados. Na análise adicional de JavaScript, os avisos de símbolos não lidos encontrados foram resolvidos; erros de tipagem já existentes dos globals window nessa análise ampla não equivalem ao check:types configurado no projeto.

Comparação de build principal: 242,32 → 240,19 kB; gzip 77,33 → 76,83 kB. Isso é o tamanho do chunk principal, não uma medida de LCP/INP ou redução garantida de tempo de carregamento.


Resultados: 33 arquivos de testes de regressão, check:types, build e check:release passaram. A comparação local de 56 telas (14 estados × 2 larguras × 2 temas) encontrou os mesmos pixels e conteúdo/classes visíveis, com respostas de API simuladas e determinísticas. Login foi comparado separadamente em duas larguras, incluindo entrada como visitante. Pesquisa de ofertas, criação/confirmação de compra e rascunho/salvamento da meta foram exercitados com dados fictícios.

Essas verificações cobrem os estados descritos, não equivalem a certificação de todos os navegadores, contas ou integrações em produção. Não houve publicação/deploy nesta limpeza.
