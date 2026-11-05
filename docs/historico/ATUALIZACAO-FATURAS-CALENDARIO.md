Versão do documento: 0.1.0-alpha.1

# Cartões, faturas e calendário

## Cartão

Banco e limite permanecem nos campos principais. Fechamento e vencimento ficam em Mais opções. São usados para organizar as faturas; cartões antigos sem datas continuam preservados e exibem Adicionar datas. Não são solicitados número de cartão, código de segurança ou senha.

O melhor dia é estimado como o dia seguinte ao fechamento informado. A regra do emissor pode ser diferente, e a data de fechamento real pode mudar. Datas 29, 30 e 31 se ajustam ao último dia dos meses mais curtos; o dia seguinte ao fechamento pode cair no próximo mês. Compras no fechamento entram na fatura que está fechando neste controle; compras posteriores entram no ciclo seguinte. Confira as datas no banco.

Referências: https://www.itau.com.br/assets/dam/publisher/01_itau/05_Conta_Corrente/2022/inss/pdf/Info4_Uso_consciente_cartao_AF.pdf e https://blog.nubank.com.br/data-de-vencimento-data-fechamento-cartao-de-credito/ (mostra que a regra pode variar entre emissores).

## Fatura

O período corresponde ao mês de vencimento. O saldo inclui pendências anteriores e exclui parcelas com vencimento posterior ao período escolhido. Saldo inicial comprometido fora do aplicativo, quando houver, permanece preservado e entra como pendência não alocada.

Confirmar pagamento registra um pagamento que o usuário já realizou no banco. Não movimenta dinheiro. O pagamento parcial reduz apenas o saldo informado; o total quita o que aparece em aberto nessa fatura, mantendo parcelas futuras comprometidas. Valores maiores que a fatura, zero, negativos e datas futuras são rejeitados. Uma fatura alterada durante a confirmação precisa ser revisada.

O limite é calculado pelo saldo comprometido menos pagamentos, limitado ao teto cadastrado. Se o cartão estiver acima do limite, um pagamento primeiro reduz o excesso; o disponível só volta a crescer quando o saldo ficar abaixo do teto. O sistema não presume juros de rotativo, multas, parcelamentos de fatura nem prazo de compensação bancária. O usuário deve conferir no banco o valor efetivo da fatura.

Pagamentos não criam um segundo gasto: o gasto original já está em Entradas e nos relatórios. Os valores pagos por lançamento e o histórico são preservados no snapshot da conta, incluindo exportação e importação de backup. Alterar um gasto com pagamento parcial preserva o valor pago e impede trocar o cartão ou reduzir a cobrança abaixo do já pago.

## Calendário e layout

Calendário em atalho próprio, junto a perfil, amigos e notificações. Mostra movimentações, fechamento, vencimento, melhor dia estimado e pagamentos registrados. Esses eventos de cartão não são somados novamente aos totais de gastos. Configurações > Layout > Abas > Calendário permite ocultar o atalho sem apagar informações.

Calendário e botão removidos de Entradas. Lista seletora de cartões aparece somente quando há mais de um. Ações individuais de pagamento nos cartões foram substituídas pelo fluxo de fatura, e o card de ranking do calendário fica oculto sem gastos.

Acabamento dos botões React unificado com as ações existentes: formato de pílula, tipografia, profundidade discreta, refração da biblioteca e reflexos verdes. Estado selecionado do calendário mantém contraste nos dois temas.

## Publicação

Build `npm run build`, saída `dist`. No Netlify, publique o projeto completo com `netlify/functions` para manter as integrações. Esta entrega não publica diretamente no domínio tefinance.netlify.app.
