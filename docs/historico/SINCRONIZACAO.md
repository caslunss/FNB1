Versão do documento: 0.1.0-alpha.1

# Sincronização por conta

## O que já foi configurado

A tabela public.app_finance_workspaces e suas permissões já foram criadas no projeto Supabase qjxwghjamqrqxnrjpglx. Não é necessário executar o SQL novamente nesse projeto. database/finance-sync.sql documenta a estrutura para outros ambientes.

Publique o projeto atualizado no Netlify. A sincronização usa o Supabase diretamente, por HTTPS e com a sessão validada do usuário; não depende da Function do Gemini nem de GEMINI_API_KEY. Nenhuma chave secreta ou service_role foi incluída.

## Funcionamento

- Ao entrar com Google, o app consulta os dados da conta antes de montar os gráficos.
- Se a conta ainda não tem uma base na nuvem, a base v3 já vinculada a essa conta neste navegador é enviada automaticamente. Dados de visitante ou dados globais antigos sem dono identificado não são enviados para uma conta automaticamente.
- Entradas, gastos, dívidas, limites, metas, divisões com confirmações manuais, compras planejadas e relatórios fechados compõem a mesma base. A aparência continua sendo uma preferência deste navegador; não é um registro financeiro.
- Após salvar, a alteração permanece imediatamente na cópia local e entra numa fila de envio com breve espera. Aguarde o indicador **Sincronizado** antes de trocar de dispositivo.
- Sem conexão, as mudanças ficam pendentes neste dispositivo e voltam a ser enviadas na reconexão ou no próximo acesso. Uma alteração ainda pendente não está disponível em outro aparelho. Apagar os dados do navegador antes do envio pode eliminar a cópia pendente.
- O app verifica outras versões ao voltar à aba e a cada 30 segundos. Quando não há formulário aberto, carrega a nova versão e mantém a aba selecionada. Com formulário aberto, aguarda para evitar perder rascunhos.
- Visitantes usam armazenamento temporário na aba; não há sincronização na nuvem para visitantes.

## Conflitos

Dois dispositivos podem editar a mesma revisão enquanto estão offline ou simultaneamente. A versão antiga é recusada pelo salvamento condicionado à revisão. O app mantém os dados locais e mostra **Revisar**.

Em Você → Configurações → Sincronização, escolha **Usar dados da conta** ou **Enviar dados deste dispositivo**. Essa escolha substitui a base inteira; não há fusão automática por lançamento. Antes de trocar, o app guarda cópias das duas versões no armazenamento desta conta no navegador. **Baixar cópias** exporta essas versões em JSON. Se não houver espaço para preservar as cópias, a substituição é bloqueada. Não apague o cache antes de guardar seus dados pendentes.

## Segurança e limites

RLS restringe SELECT, INSERT e UPDATE ao auth.uid() da linha. Usuários não podem alterar o dono, a revisão do servidor ou excluir a linha pela API. Cada atualização incrementa a revisão no banco. O JSON usa schemaVersion 3 e centavos; o limite por base é de 8 MB. O armazenamento do navegador também tem seu próprio limite. A cópia local não é criptografia contra alguém com acesso ao navegador desbloqueado.

Testes: migração de base local, novo dispositivo, fila offline, retomada após recarregar, resposta perdida após gravação, alterações durante envio, conflitos, cópias de segurança e isolamento de contas. No banco, testes transacionais com duas identidades confirmaram RLS, negação a visitantes, bloqueio de revisão antiga e proteção das colunas do servidor; tudo foi revertido ao finalizar o teste. A interface foi verificada com uma conta simulada, sem enviar dados financeiros reais. O fluxo completo com duas contas Google reais em aparelhos distintos ainda deve ser validado no domínio publicado.

A revisão de segurança não apontou alertas novos para esta tabela. Permanecem alertas anteriores de funções públicas SECURITY DEFINER legadas, não usadas pela sincronização nova, e proteção contra senhas vazadas desativada no projeto. Referências para revisão desses avisos:
https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
