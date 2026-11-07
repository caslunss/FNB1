Versão do documento: 0.1.0-alpha.5

# Ativar o login Google

A integração usa Google Identity Services e Supabase Auth. O Supabase valida o token Google, cria a conta e emite a sessão. Nenhum Client Secret vai no HTML. O SDK oficial 2.118.0 está incluído localmente, com licença.

## 1. Google Cloud

No cliente OAuth do tipo Aplicativo da Web, mantenha o Client ID:

`638401315665-1dq6qm1ot9ps7sbjtaj01mda727ed0em.apps.googleusercontent.com`

Em Origens JavaScript autorizadas:

`https://tefinance.netlify.app`

Em URIs de redirecionamento autorizados, conforme o painel do Supabase:

`https://qjxwghjamqrqxnrjpglx.supabase.co/auth/v1/callback`

Configure o nome do aplicativo, contato de suporte e público na tela de consentimento. Se o aplicativo estiver em teste, cadastre as contas de teste quando exigido. Gere um novo Client Secret e revogue o que foi exposto no chat. Não compartilhe o novo segredo; cole-o apenas no painel do Supabase.

## 2. Supabase

Abra o projeto Project123s, referência qjxwghjamqrqxnrjpglx.

Em Authentication → Sign In / Providers → Google:

- Ative o Google.
- Cole o Client ID acima.
- Cole o NOVO Client Secret no campo próprio do painel.
- Mantenha a verificação de nonce ativada (não habilite Skip nonce checks).
- Salve.

Em Authentication → URL Configuration, configure Site URL como:

`https://tefinance.netlify.app`

A implementação usa o botão oficial Google com callback e troca de ID token, não depende de uma rota POST no site estático. O callback Supabase é o endereço de referência para a configuração do provedor e para fluxos OAuth.

## 3. Testar

Abra o site: a primeira tela é o login. Recarregue após salvar as configurações. O site consulta se o provedor está ativo e então carrega o botão oficial. Entre com uma conta permitida na tela de consentimento. Em Você, confira nome, e-mail e foto. Em Configurações, teste Sair da conta. Verifique a criação da conta em Authentication → Users.

## Dados e limites desta entrega

- Visitantes precisam informar um nome. Seus dados ficam no sessionStorage da aba e são apagados ao encerrar a visita. Fechar a aba normalmente encerra esse armazenamento; restaurar uma sessão do navegador pode recuperá-lo.
- Dados locais antigos são preservados e podem ser baixados em Configurações → Baixar dados locais anteriores, sem migração automática.
- Cada conta validada usa uma cópia local separada por usuário e sincroniza a base financeira com public.app_finance_workspaces no Supabase.
- Entradas, gastos, dívidas, metas, limites, divisões, compras planejadas e relatórios são sincronizados. Consulte SINCRONIZACAO.md para fila offline e resolução de conflitos.
- Separação de chaves locais não é criptografia nem proteção contra uma pessoa com acesso às ferramentas do navegador no mesmo dispositivo.
- A sessão do SDK fica em sessionStorage, limitada à aba. Não é cookie HttpOnly; não há servidor próprio no site.
- O Google ainda estava desativado no provedor durante a verificação. Não foi possível testar entrada real com uma conta Google antes dessa configuração.
- O site mantém a audiência privada atual. Ativar Google não torna a publicação pública.

Documentação oficial:
https://supabase.com/docs/guides/auth/social-sign-in/auth-google
https://supabase.com/docs/reference/javascript/auth-signinwithidtoken

## Tela de acesso atualizada
A tela usa somente botões sociais, sem formulário de visitante, e-mail ou senha. O Google mantém o botão oficial do SDK quando disponível; o ícone de reserva é local e mantém dimensões fixas. A sessão Google real precisa ser validada no domínio autorizado, após ativar o provedor.

## Apple — etapa futura
O botão oficial da Apple foi adicionado como apresentação desabilitada, identificado com Em breve. Ainda não autentica: para ativá-lo, será necessário integrar o fluxo OAuth e configurar o provedor Apple no Supabase com Services ID, Team ID, Key ID, segredo/assinatura e domínio/URL de retorno. As credenciais privadas ficam apenas no painel do backend. Não basta remover disabled do HTML. Não incluímos credenciais Apple nem simulamos sessão.
