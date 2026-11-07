Versão do documento: 0.1.0-alpha.6

# TEFinance — publicação e validação

Verificado em 30/10/2026. Este pacote contém a interface e as Functions; publicar a prévia do ChatGPT não atualiza tefinance.netlify.app.

## O que já foi conferido

- O projeto Supabase qjxwghjamqrqxnrjpglx está ativo.
- Isolamento real da tabela app_finance_workspaces testado com duas identidades temporárias, em transação revertida: leitura/escrita entre contas negadas, visitante negado, versão antiga rejeitada, revisão e proprietário protegidos, registro inválido rejeitado. Nenhum dado de usuário real foi usado ou alterado.
- A Edge Function delete-own-account está ativa; não executei exclusão real.
- Código de sincronização tem fila local, controle de revisão e tratamento explícito de conflitos.
- Adicionados diagnóstico autenticado de configuração, exemplo de variáveis sem valores, cabeçalhos de segurança e verificação de arquivos/segredos antes da publicação.

## 1. Trocar os segredos expostos

Nas contas Google Cloud, Google AI e provedor de Open Finance, gere novos segredos e revogue os enviados anteriormente no chat. Faça isso nos painéis; não envie as novas chaves em mensagens. Configure cada uma apenas no servidor indicado abaixo. O Client ID Google e a chave pública Supabase são configurações públicas; o Client Secret, as chaves Gemini e bancárias são privados.

## 2. Preparar os arquivos

Extraia o ZIP. Abra um terminal na pasta com package.json. Instale Node.js 22.12 ou superior e execute:

```sh
npm ci
npm test
npm run build
npm run check:release
```

Não abra index.html com file://. Para verificar localmente, use npm run dev. Não é necessário rodar os scripts SQL de criação novamente no Supabase existente.

## 3. Configurar o Google e o Supabase

No cliente Web do Google Cloud, mantenha a origem JavaScript https://tefinance.netlify.app e o Client ID público que já está em public/assets/auth-config.json. Configure o novo Client Secret somente no provedor Google do Supabase. O callback do provedor é https://qjxwghjamqrqxnrjpglx.supabase.co/auth/v1/callback.

No Supabase, confira Google habilitado, nonce verificado, Site URL https://tefinance.netlify.app e os usuários de teste autorizados na tela de consentimento Google, se o aplicativo ainda estiver em teste. O login atual usa o botão Google com troca de ID token. Verifique o resultado real; esta entrega não comprova um login Google em produção. LOGIN-GOOGLE.md contém detalhes, mas a nota antiga sobre provedor desativado é histórica, não uma consulta atual.

## 4. Configurar as variáveis no Netlify

Abra o projeto que atende tefinance.netlify.app. Procure a área de configuração do projeto e Environment variables (os nomes dos menus podem variar). Adicione variáveis no ambiente de produção, com acesso pelas Functions:

| Nome | Valor a inserir | Necessidade |
| --- | --- | --- |
| GEMINI_API_KEY | Nova chave da sua conta Google AI | Pesquisa, produto e comportamento |
| GEMINI_MODEL | Modelo disponível na sua conta; o padrão do código é gemini-2.5-flash | Opcional |
| BRAPI_TOKEN | Token da sua conta de dados de investimentos | Investimentos |
| PLUGGY_CLIENT_ID | Client ID bancário | Conexão Open Finance |
| PLUGGY_CLIENT_SECRET | Novo segredo bancário | Conexão Open Finance |
| PLUGGY_SANDBOX | true para homologação; false para produção | Ambiente bancário |

Não use prefixo VITE_ para segredos e não cole valores em .env.example, public, src ou Git. SUPABASE_SERVICE_ROLE_KEY pertence exclusivamente aos segredos da Edge Function no Supabase; não é necessário colocá-la na interface nem no Netlify para as funções atuais.

## 5. Publicar o projeto completo

Opção indicada para continuar editando: suba o código em um repositório seu e conecte esse repositório ao site existente no Netlify. Use build npm run build, publicação dist e funções netlify/functions; netlify.toml já declara isso.

Alternativa por terminal:

```sh
npm install -g netlify-cli
netlify login
netlify link
netlify deploy --build --prod
```

Em netlify link, escolha explicitamente o site existente tefinance.netlify.app. Confira o nome antes de confirmar a publicação. Não crie um site novo por acidente. Arrastar apenas a pasta dist publica a interface, mas não entrega as Functions deste projeto.

## 6. Confirmar servidor e integrações

Após publicar, entre com Google e execute no Console do navegador, dentro do próprio site:

```js
const session = await window.planAuth.client.auth.getSession();
const response = await fetch('/.netlify/functions/service-status', {
  headers: {Authorization: 'Bearer ' + session.data.session.access_token}
});
console.log(response.status, await response.json());
```

Não compartilhe o token nem o conteúdo de session. O diagnóstico informa apenas se a sessão é válida e se as configurações existem. Valores true NÃO comprovam chave válida, faturamento ou cota.

- AI: teste um produto e a análise de comportamento; confira a conta/faturamento se houver erro.
- Investimentos: consulte PETR4 e VALE3 e confira data e fonte. Erros 401/429 exigem revisar chave/plano/cota.
- Banco: use homologação primeiro. A conexão é real, mas importação de contas, transações e cartões ainda não está implementada. O diagnóstico declara bankTransactionImport:false. Não trate o botão Conectar banco como sincronização bancária concluída.
- Afiliados: não existe catálogo comercial afiliado integrado; affiliateCatalog:false. Gemini pesquisa produtos, mas não garante preço, estoque ou comissão.

## 7. Testar com duas contas reais

Faça os testes com valores fictícios. Conta A no navegador normal e conta B em outro perfil do navegador:

1. A cadastra entrada e gasto; B não deve vê-los.
2. A recarrega e abre outro aparelho com a mesma conta; os registros devem aparecer após sincronizar.
3. A faz uma alteração offline, reconecta e confirma a sincronização. Se houver conflito, exporte backup antes de escolher qual versão manter.
4. Cadastre um cartão fictício com limite 1.000 e compra à vista de 300: disponível 700. Após confirmar pagamento de 100: disponível 800. Quitando os 200 restantes: disponível 1.000, desde que não existam outros compromissos.
5. Confirme uma compra planejada com parcelas e confira datas, centavos e limite comprometido. Pagamentos futuros ainda comprometem limite.
6. Adicione amizade A/B, envie divisão e aceite em B; cada conta deve registrar apenas a própria parte. Recusar não deve criar gasto.
7. Exporte backup e CSV em Relatórios. Compare os totais com Entradas. Guarde uma cópia antes de testar restauração.
8. Teste visitante separadamente: os dados são temporários da sessão, não sincronizados.
9. Teste Encerrar sessão e login novamente. Teste exclusão somente numa conta descartável criada para isso, pela opção Conta, após exportar backup.

A virada mensal e a imutabilidade dos relatórios são aplicadas pelo aplicativo atual. A base v3 armazena o snapshot por conta; não foi instalado um novo bloqueio de meses encerrados no servidor nesta entrega. Valide o fechamento na virada real ou num ambiente de homologação com relógio controlado, sem alterar contas reais.

## 8. Antes do beta

Preencha a minuta de privacidade com responsável e contato reais e valide seu conteúdo antes de publicar. Configure monitoramento de erros com remoção de tokens e dados financeiros dos registros. Defina backup e recuperação no seu plano Supabase; exportação manual não é backup automático do servidor. Convide poucas pessoas e mantenha um canal para relatar falhas.

## Pendências que exigem desenvolvimento adicional

- Importador bancário idempotente com propriedade da conexão validada, paginação, transações pendentes/efetivadas, estornos, atualização de limites e revisão das categorias. Não gravar automaticamente tudo que for CREDIT como salário, nem pagamento de fatura como nova despesa.
- Confirmação de contratos, permissões e limites de APIs; homologação bancária e testes com consentimento real.
- Catálogo e links dos programas oficiais de afiliados.
- Garantia de meses encerrados no servidor v3, compatível com restauração de backup, reset de dados e sincronização.
- Monitoramento de produção e teste manual de duas contas/dispositivos.

A consulta à documentação externa falhou nesta sessão; não foi implementado importador financeiro baseado em suposições sobre os campos do provedor. As instruções de painéis devem ser conferidas no momento da configuração.

## Avisos do Supabase observados

As três RPCs antigas load_workspace, save_workspace e import_browser_data são SECURITY DEFINER. Inspecionei as definições: derivam o usuário de auth.uid(), recusam sessão ausente e restringem dados ao próprio usuário. Não removi funções antigas sem uma migração de compatibilidade. O aviso pede revisão, não comprova vazamento: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Há também aviso de proteção de senhas vazadas desativada. O app usa Google e visitante, sem formulário de senha; reavalie essa proteção antes de oferecer login por senha: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
