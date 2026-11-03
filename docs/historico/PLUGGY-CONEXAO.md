# Conexão Pluggy no Netlify

1. Publique o projeto completo pelo Git ou Netlify CLI, incluindo netlify/functions. Enviar somente dist não instala as funções.
2. Configure PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET no ambiente das Functions. CLIENT_ID e CLIENT_SECRET também são aceitos. Nunca use prefixo VITE_ nessas credenciais.
3. Para testes, configure PLUGGY_SANDBOX=true. Em produção remova a variável ou use false. O padrão é produção.
4. Entre com Google, abra Perfil > Integrações > Conectar banco. Autorize a conexão no widget da Pluggy.

O token é solicitado por POST em /.netlify/functions/connect-token com a sessão Supabase. O ID do usuário é obtido no servidor. Somente o Connect Token chega ao navegador. Após o sucesso, o servidor confere a propriedade do Item antes de registrar a referência no navegador por conta.

Esta versão usa react-pluggy-connect 2.12.0 sob demanda. Webhooks não são necessários para abrir e confirmar a conexão. Ainda não há importação de transações, classificação de salário, sincronização de cartões nem atualização automática. A referência da conexão é local por conta neste dispositivo. A prévia estática Sites não executa Netlify Functions.
