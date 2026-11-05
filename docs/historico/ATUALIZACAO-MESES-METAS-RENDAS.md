Versão do documento: 0.1.0-alpha.1

# Meses, metas, rendas e upload

- Seleção de mês no topo. O mês corrente passa a existir automaticamente ao abrir o app, sem exigir adicionar o período manualmente.
- Meses anteriores ao mês corrente, ou com relatório fechado, ficam somente para leitura no aplicativo. Botões de edição são desativados. As gravações locais verificam os lançamentos, limites e relatórios de períodos encerrados e desfazem alterações indevidas. CSV de mês encerrado aparece como linha inválida na prévia; se o mês fechar entre prévia e confirmação, a gravação também é rejeitada.
- Relatórios já fechados permanecem imutáveis. Resumo e movimentações de meses fechados usam seus snapshots; dívidas exibem a composição registrada no fechamento. Copiar limites passa a atingir apenas meses abertos.
- Pagamentos atuais de faturas e confirmações de recebimento de divisões podem atualizar os indicadores de quitação de lançamentos antigos, sem alterar seus valores nem os relatórios. Parcelas e repetições futuras podem ser canceladas, preservando os lançamentos encerrados. Zerar dados continua sendo uma ação separada, com confirmação explícita na interface.
- O bloqueio descrito é do aplicativo e de sua persistência local. Não foi criada nova política ou trigger no Supabase; versões antigas do aplicativo e escritas diretas no banco não passam por essa validação.

## Meta

No Resumo > Metas > Editar meta, escolha valor e prazo: Por meses ou Data específica. O prazo em meses parte da data atual e ajusta os dias 29–31 em meses mais curtos. O prazo exato limita os lançamentos considerados na projeção; limites e dívidas sem dia de vencimento continuam considerados integralmente no respectivo mês. A referência mensal divide o valor alvo pelo prazo; não pressupõe uma conta de poupança separada nem registra aportes automaticamente.

## Rendas

Atalho Salário mensal em Entradas. O formulário oferece Salário mensal, Outro ganho mensal e Ganho pontual. Em Mais opções, informe a data e a quantidade de meses, incluindo o primeiro. As repetições são gravadas nas datas correspondentes, inclusive no calendário, mantendo o dia âncora quando possível. Uma repetição mensal pode ser editada por ocorrência ou ter as próximas ocorrências canceladas. Não é uma conexão automática ao empregador ou ao banco.

## Upload

Botão de upload próprio, com ícone e nome do arquivo, nos importadores de CSV e notas. O leitor de CSV agora recebe eventos na janela de Relatórios, corrigindo o vínculo antigo restrito à área principal. A prévia e confirmação são mantidas. Um CSV sem identificação do cartão não é rotulado automaticamente como compra a crédito; gastos importados ficam como Pix e podem ser revisados em um mês aberto.

## Publicação e validação

Projeto completo para Netlify: build `npm run build`, publicação `dist`, funções `netlify/functions`. Este pacote não altera o domínio tefinance.netlify.app automaticamente.

Testes incluem virada de mês, bloqueio de alteração/exclusão/importação, preservação de pagamentos posteriores, rollback, repetição de rendas em dias 30/31 e metas com corte exato. Teste visual usa dados sintéticos isolados; não altera finanças reais.
