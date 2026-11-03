# Publicar o TEFinance na Vercel

Pacote Vercel — 03/11/2026. Extraia o ZIP antes de enviar ao GitHub.

## 1. Enviar ao GitHub

Crie um repositório privado. Coloque o conteúdo deste ZIP na raiz: `package.json`, `package-lock.json`, `vercel.json`, `index.html` e as pastas `src`, `api`, `server` e `public` precisam aparecer diretamente na página principal do repositório. Não envie o ZIP como arquivo único nem coloque o projeto dentro de uma pasta adicional.

Não envie `node_modules`, `.env`, `.vercel` ou `dist`. O `.gitignore` já os exclui quando você usa Git/GitHub Desktop; no upload manual pelo navegador, selecione apenas os arquivos do pacote. Há mais de 100 arquivos: se o navegador limitar o lote, envie em lotes ou use GitHub Desktop.

## 2. Importar na Vercel

Acesse vercel.com, escolha Add New → Project, importe o repositório e confirme:

| Opção | Valor |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | raiz do repositório (`.`) |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22.x |

O `vercel.json` já registra build, funções e limite de execução. Não configure Next.js e não coloque `dist` como Root Directory. São duas entradas reais: `/index.html` e `/login.html`; não há rewrite genérico de SPA que possa capturar as APIs.

## 3. Variáveis de ambiente

Em Settings → Environment Variables, cadastre somente as integrações que utilizará, no ambiente Production. Habilite Preview separadamente se desejar testar nesse ambiente. Depois de alterar valores, faça Redeploy.

| Nome | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Pesquisa, produtos e comportamento |
| `GEMINI_MODEL` | Modelo opcional; padrão `gemini-2.5-flash` |
| `BRAPI_TOKEN` | Dados de investimentos |
| `PLUGGY_CLIENT_ID` | Conexão bancária |
| `PLUGGY_CLIENT_SECRET` | Conexão bancária |
| `PLUGGY_SANDBOX` | `false` em produção; `true` apenas em testes |
| `SUPABASE_SECRET_KEY` | Operações tributárias no servidor; manter absolutamente privada |
| `SUPABASE_SERVICE_ROLE_KEY` | Alternativa legada à secret key; não precisa das duas |
| `IBPT_TOKEN` | Consultas tributárias |
| `IBPT_CNPJ` | CNPJ autorizado pela licença IBPT |
| `TAX_TIME_ZONE` | Opcional; padrão `America/Sao_Paulo` |
| `APP_ORIGIN` | Seu domínio próprio completo, ex. `https://financas.seudominio.com`, sem caminho |

As URLs de deploy/produção `.vercel.app` são reconhecidas pelas variáveis de sistema `VERCEL_URL` e `VERCEL_PROJECT_PRODUCTION_URL`. Não use wildcard de domínio. Para domínio próprio, informe APP_ORIGIN e faça Redeploy.

O projeto já contém a configuração pública do Supabase e o Google Client ID da versão anterior em `public/assets/auth-config.json`. Publishable key e Client ID são públicos. As chaves privadas acima não estão incluídas no ZIP e não são copiadas automaticamente do Netlify. Nunca use prefixo `VITE_` para elas.

Sem uma chave de integração, a interface pode ser publicada, mas a integração correspondente permanecerá indisponível. Serviços bancários, IBPT e IA também dependem de conta ativa, consentimento e cota/faturamento do fornecedor.

## 4. Autorizar o novo domínio no login

Depois do primeiro deploy, copie o endereço HTTPS estável que a Vercel mostrou.

1. No Google Cloud/Google Auth Platform, abra o cliente OAuth Web do projeto. Adicione o novo domínio em **Authorized JavaScript origins**. É o domínio, sem `/login.html`.
2. No Supabase, em Authentication → URL Configuration, atualize Site URL para o domínio principal e inclua as URLs necessárias em Redirect URLs. Se continuar usando Netlify, mantenha o domínio antigo autorizado também.
3. Se houver um fluxo OAuth de redirecionamento, o callback continua sendo o do seu projeto Supabase (`https://SEU-PROJETO.supabase.co/auth/v1/callback`), não `/api/connect-token`. A versão atual usa o botão Google com ID token/nonce.
4. Confira o login Google em aba anônima no domínio novo. Visitante continua disponível.

Não crie outro Supabase para esta migração. Usando o mesmo projeto e a mesma conta Google, os dados sincronizados continuam vinculados ao usuário. Os dados temporários/locais do domínio antigo não aparecem automaticamente no domínio novo; exporte um backup antes da troca. Revise as migrações em `supabase/` e `database/` somente se estiver instalando em uma base nova; não reexecute scripts de reset em produção.

## 5. Testar antes de divulgar

- Abrir `/login.html`, entrar como visitante e conferir navegação.
- Entrar com Google e conferir dados e sincronização da conta.
- Abrir Impostos, Investimentos, conexão bancária e pesquisa; validar as funções configuradas.
- No perfil → configurações, usar o diagnóstico de serviços. Presença de configuração não comprova chave válida ou cota disponível.
- Conferir logs de Functions na Vercel se ocorrer 401/403/500/503. Não compartilhar tokens ou documentos privados nos logs.

## Rotas de servidor

`/api/connect-token`, `/api/shopping`, `/api/investments`, `/api/market-economy`, `/api/market-rates`, `/api/service-status`, `/api/taxes`.

Autorização de usuário, centavos, cache e tratamento de erros existentes foram preservados. Impostos continua com RLS e escrita validada pelo servidor; esta preparação não executa alterações no banco real.

## Referências oficiais

- https://vercel.com/docs/frameworks/frontend/vite
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/environment-variables/system-environment-variables
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google

A configuração foi preparada e testada localmente. O login e as consultas com credenciais reais precisam ser validados após seu deploy; não houve publicação na sua conta Vercel nesta etapa.
