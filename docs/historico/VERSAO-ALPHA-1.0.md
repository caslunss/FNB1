Versão do documento: 0.1.0-alpha.6

# Versão Alpha 1.0

Revisão de 31/10/2026. Versão técnica: 1.0.0-alpha.1.

## Escopo

Revisão estática do código da interface, dos controladores financeiros, persistência/sincronização, serviços e funções de servidor, combinada com testes de regressão e inspeção no navegador. Sem redesign: paletas, Liquid Glass, tipografia, cards e disposição atual preservados. Não houve migração ou edição de dados reais no Supabase.

## Correções

- Ocultar Cartões nas preferências não bloqueia mais Investimentos. O atalho de Cartões respeita a preferência; as demais seções continuam independentes.
- Atualizações explícitas de Amigos/Perfil reconhecem os popups, em vez das rotas antigas. O polling em segundo plano não redesenha formulários em edição.
- O ranking do calendário conta gastos pelo conjunto de dados do período, incluindo o relatório de um mês encerrado. Não consulta a lista atual para recontar cada dia. Entradas não aumentam a contagem de gastos.
- Sete regras CSS antigas da barra do Resumo, que não alcançavam mais o componente atual, removidas. Não foram trocados componentes Liquid Glass.
- Removidos ícone auxiliar, constante e ref sem uso. Nenhuma mudança no esquema dos registros ou nos cálculos monetários existentes.

## Validação

- 27 suítes de testes funcionais, cobrindo migração local, rollback em falha de gravação, centavos, parcelas, pagamentos, CSV, relatórios, leitura de notas, busca, vínculos de divisões, conta/visitante, sincronização/conflitos e funções de servidor.
- Testes novos para independência Cartões/Investimentos, atualização dos popups sociais e contagem do calendário com relatório fechado.
- Auditoria npm de dependências de produção e desenvolvimento sem vulnerabilidades conhecidas reportadas na execução de 31/10/2026. Isso não é garantia contra vulnerabilidades desconhecidas.
- Matriz no Chrome: larguras 320, 390, 768, 1024, 1440 e 1920 px; claro e escuro. 168 combinações de página/tamanho/tema e 72 estados expandidos passaram sem falhas de layout detectadas. A rodada dedicada de 12 combinações com mês efetivamente encerrado também passou: total de 252 combinações sem falhas de layout detectadas.
- Inspeção de formulários expandidos em Ofertas, Cartões, seletor de mês, Layout e leitura de notas. Teste de tempo controlado e verificação manual de Outubro/2026 encerrado: inclusão/edição bloqueadas e leitura preservada.
- Confirmado manualmente: após ocultar Cartões, a navegação para Investimentos funciona.
- Build de produção e check:release executados no empacotamento.

## Limites e pendências

Não é possível testar literalmente todas as combinações de dispositivos, navegadores, dados, redes e serviços externos. A matriz cobre Chrome com dados sintéticos, não Safari/iOS/Firefox reais. As sete paletas e o modo de pouca animação são tratados pelos testes de preferências e tokens; não foi feita uma captura de cada combinação de paleta, dispositivo e página.

Não foi executado login Google real, consentimento bancário, exclusão real de conta, consulta paga Gemini nem chamada real a todos os serviços de mercado nesta revisão. Os testes de funções usam respostas controladas para sucesso, falha, dados nulos, autenticação e limites. O acesso bancário externo precisa de homologação no domínio Netlify; seu widget de terceiros ainda exige validação junto aos popups nativos. Não foram implementados importador bancário nem catálogo afiliado.

O bloqueio de meses encerrados continua sendo aplicado pelo aplicativo; não há nova garantia de imutabilidade no servidor v3. Testes locais não certificam disponibilidade ou configuração de produção. Os avisos históricos e a configuração de serviços estão detalhados em GUIA-PUBLICACAO.md.

O ZIP inclui fonte, build e Functions. Publicar a prévia no ChatGPT não atualiza tefinance.netlify.app. Para o domínio, siga GUIA-PUBLICACAO.md e não publique apenas dist se precisar das Functions.

## Revisão dos gráficos e cálculos — 31/10/2026

- Gráficos diários e de comportamento passaram a usar os relatórios fechados, incluindo a série do mês anterior, preservando os valores históricos.
- A linha de metas respeita a data final da meta e mantém a projeção após esse prazo, coerente com o total exibido.
- A comparação mensal calcula diferenças em centavos, evitando variações decorrentes de ponto flutuante. A comparação com base zero mostra o valor monetário, sem dividir por zero.
- Regressões verificam snapshots após remoção dos registros atuais, metas com entradas posteriores à data final, base negativa, base zero e somas de R$ 0,10 + R$ 0,20.
- As 27 suítes automatizadas passaram, incluindo parcelas, faturas parciais/completas, limites, divisões, categorias e séries econômicas. Auditoria de 12 combinações de mês encerrado, seis larguras e dois temas: sem falhas detectadas.
- Sem mudanças de CSS, cores ou controles. A auditoria visual usa Chromium e dados sintéticos; não valida dados bancários reais ou cotações ao vivo.
