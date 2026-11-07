Versão do documento: 0.1.0-alpha.6

# Metas de produtos

Planejamento → Metas passa a guardar produtos desejados. A meta geral de investimentos continua no Resumo, com os valores e o editor anteriores.

## Cadastro e relatório

- Produto e preço final, incluindo frete/custos conhecidos.
- Valor já reservado, informado manualmente: não é renda nem saldo bancário.
- **Juntar antes de comprar:** reserva mensal planejada do orçamento. O prazo é o restante dividido pela reserva mensal, arredondado para cima. A última reserva se limita ao que falta juntar. A tabela mostra até 12 meses, dentro do horizonte financeiro suportado.
- **Comprar à vista:** impacto do preço total no mês escolhido.
- **Comprar no crédito:** parcelas sem juros, primeira data escolhida e cartão ativo. O valor total precisa caber no limite atual, mesmo parcelado. Os centavos seguem a distribuição exata do fluxo existente.

Os cálculos reaproveitam `monthProjectionCents` e `planProjection`: entradas menos compromissos registrados, limites de categorias e dívidas. Compras podem ocupar a folga já provisionada na categoria, evitando descontar o mesmo orçamento duas vezes. Dívidas em atraso são consideradas no primeiro mês. As reservas mensais são uma alocação adicional do disponível e incluem outras metas de produtos na estratégia de juntar.

O relatório usa **Dentro do orçamento cadastrado nos meses exibidos**, **Dados incompletos** ou **Atenção**. Falta de renda cadastrada não vira confirmação de capacidade de compra. Parcelas representam compromissos na data escolhida; o relatório não prevê o fluxo bancário real de fechamento/vencimento da fatura, juros, rendimento, liberações futuras de crédito, saldo bancário ou outras compras não confirmadas.

Reservas passadas não são promovidas automaticamente a dinheiro poupado. O usuário atualiza o valor já reservado. O planejamento restante parte do mês atual ou da data futura escolhida. Não há transferência automática nem bloqueio de orçamento fora deste relatório.

## Confirmação e compatibilidade

Salvar, editar ou remover uma meta não gera gastos e não altera a meta geral. **Preparar compra hoje** atualiza a data do plano para hoje e abre a revisão já existente em Compras. Apenas a confirmação explícita registra os lançamentos, com transação atômica, proteção contra plano alterado e confirmação repetida. O relatório ainda é uma simulação: orçamento/limite insuficiente é informado, não representa uma autorização ou bloqueio do banco.

O produto usa o armazenamento existente `cart`, com três propriedades opcionais: `productGoal: true`, `goalMode` (`save`, `cash`, `credit`) e `monthlyReserveCents`. Preço, frete, reserva e demais propriedades continuam em centavos. Compras antigas não recebem o marcador e permanecem em Compras. Metas ativas aparecem na nova aba, e compras confirmadas mantêm seu histórico. Validação, backup e sincronização usam o esquema financeiro existente, sem novas tabelas ou credenciais.

## Verificações

`tests/product-goals-regression.cjs` cobre centavos, reserva final limitada ao alvo, múltiplas metas, ausência de renda/cartão, falta de orçamento/limite, persistência e validação sem despesa automática. A suíte financeira existente verifica confirmação única e rollback de gravação. Verificação em Chromium cobre cadastro e recarga, relatório de crédito, confirmação à vista, separação da meta do Resumo e ausência de overflow em 320, 390, 768 e 1440 px, nos temas claro e escuro. Sincronização remota não foi testada contra uma conta real.
