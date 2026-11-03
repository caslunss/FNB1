# Beta e apoio ao projeto

A tag Beta tester aparece para contas autenticadas com ID e data de criação válidos, dentro de COMMUNITY_PROGRAM em src/finance/workspace.js. Visitantes não recebem a tag. A regra usa created_at da conta validada pelo Supabase, sem alterar dados financeiros ou conceder permissões.

Enquanto betaEndsAt for null, novas contas recebem a tag. Para encerrar o período, defina betaEndsAt como uma data/hora ISO com fuso e publique o projeto. Contas criadas até essa data continuam elegíveis; contas posteriores não recebem a tag. betaStartsAt null inclui as contas atuais; pode ser definido se houver uma data de início específica.

O card de apoio é visível na aba Você / Perfil. Sem supportUrl, informa que as contribuições ainda não foram habilitadas. Para ativar, preencha supportUrl com o link HTTPS real da plataforma de contribuição e publique. O app não processa cobrança e não concede selo de apoiador automaticamente. Pagamentos verificados e eventuais benefícios precisam de integração própria.
