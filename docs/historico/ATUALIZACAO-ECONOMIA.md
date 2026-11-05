Versão do documento: 0.1.0-alpha.1

# Crédito e economia — 30/10/2026

- Calculadora de CDB retirada da interface. A biblioteca matemática permanece sem ser carregada pela página.
- Card Economia: Selic (SGS 432, % a.a.), CDI (4389, % a.a.) e IPCA (433, % no mês). Histórico de até 12 meses, com a última observação publicada de cada mês. IPCA acumulado é composto, somente com 12 meses consecutivos disponíveis.
- Consulta pública sem chave em `/.netlify/functions/market-economy`. Não envia dados financeiros do usuário ao BCB. Séries fixas, período limitado, timeout de 12 segundos por série e cache de uma hora. Datas futuras são descartadas.
- Referência oficial consultada em 30/10/2026 disponível quando a consulta ao vivo falhar, identificada como referência salva com data. Nunca é apresentada como cotação ao vivo. A prévia estática usa essa referência pois não executa funções Netlify.
- Cadastro de cartão: banco de origem e limite. Metadados e valores comprometidos já existentes são preservados ao editar.
- Gastos a crédito exigem cartão cadastrado, inclusive notas e confirmação de compras parceladas. Registros antigos sem vínculo continuam preservados; é preciso vincular um cartão para editá-los como crédito ou duplicá-los.
- O valor integral da compra compromete o cartão, mesmo com divisão entre amigos. Centavos de parcelas sem participação própria são contabilizados no primeiro lançamento vinculado.

## Publicar no Netlify

Publique o projeto completo, incluindo `netlify/functions`, `src`, `public`, `package.json` e `netlify.toml`, por um repositório conectado ao Netlify. Build: `npm run build`; diretório publicado: `dist`; funções: `netlify/functions`; Node 22. O endpoint do BCB não precisa de variável de ambiente nem chave. Apenas enviar `dist` por arrastar e soltar não instala as funções. Preserve as variáveis de autenticação e integrações já configuradas. Esta entrega não altera o domínio tefinance.netlify.app automaticamente.

## Verificação Supabase

Consulta restabelecida no projeto configurado em 30/10/2026. `app_finance_workspaces.record` é JSONB, com RLS ativo. Políticas de leitura, inserção e atualização vinculam `auth.uid()` a `user_id`. Cartões continuam no snapshot por conta; nenhuma migração necessária.

O advisor sinaliza três funções SECURITY DEFINER acessíveis a usuários autenticados. As definições consultadas de `load_workspace`, `save_workspace` e `import_browser_data` verificam `auth.uid()`, rejeitam sessão ausente e usam o proprietário autenticado; o alerta, sozinho, não comprova acesso entre contas. A proteção contra senhas vazadas está desativada; não foi alterada (o fluxo atual oferece Google e visitante). Esta consulta de metadados não substitui um teste com duas contas reais autenticadas.

Referências dos alertas: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable e https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
