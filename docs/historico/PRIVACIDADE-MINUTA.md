Versão do documento: 0.1.0-alpha.6

# Privacidade — minuta para revisão antes da publicação

Este texto ainda não está publicado e precisa dos dados reais do responsável pelo aplicativo. Preencha: nome/razão social, contato para privacidade, data de vigência, regras de retenção e canal para solicitações.

## Dados utilizados

O login Google fornece nome, e-mail, foto e identificador de conta. O aplicativo guarda os registros financeiros inseridos pelo usuário, cartões sem dados sensíveis (banco, limite e datas), metas, planejamentos, amizades, divisões e relatórios. Não cadastre senha bancária, número completo de cartão, CVV ou documentos nos campos de descrição.

## Finalidades e armazenamento

Os dados são usados para organizar a conta, apresentar cálculos e relatórios, sincronizar dispositivos e compartilhar propostas de divisão entre usuários. Contas usam Supabase e uma cópia local separada por usuário. O acesso de visitante usa armazenamento temporário da sessão do navegador. A restauração de sessão pelo navegador pode conservar esse armazenamento.

## Serviços externos

Google fornece autenticação. Netlify hospeda a interface e funções quando o projeto é publicado nesse serviço; Supabase processa autenticação e dados por conta. Consultas de produto, ofertas e análises solicitadas pelo usuário usam Gemini. Na análise de comportamento, o código envia agregados por categoria, dia e mês, sem nome, e-mail ou descrições; consultas de produtos enviam o termo ou link informado. Dados enviados em descrições livres de pesquisas podem revelar informações pessoais: evite inseri-las. O leitor de imagens de notas usa OCR no navegador e pode carregar arquivos do mecanismo pela internet.

A integração bancária disponível conecta o usuário ao provedor externo mediante seu fluxo de consentimento; a importação financeira automática ainda está pendente. Investimentos usa dados de mercado de terceiros. Preços e estimativas não constituem garantia de retorno ou disponibilidade.

## Compartilhamento entre usuários

Ao compartilhar uma divisão, o destinatário recebe informações necessárias para avaliar a proposta, como descrição e valor. Cada destinatário confirma sua própria participação. Links compartilhados fora do app seguem também as regras do serviço de comunicação utilizado.

## Controle e exclusão

O usuário pode exportar seus dados em Relatórios, zerar os registros financeiros e solicitar a exclusão da própria conta em Configurações/Conta. Excluir no app não exclui a conta Google, cópias exportadas pelo usuário ou cópias guardadas em outros dispositivos. Pedidos de direitos e informações de retenção devem ser direcionados ao contato do responsável, a preencher acima.

## Pontos que o responsável deve definir

Prazo e fundamento de retenção, fornecedores efetivamente contratados, regiões de armazenamento/transferências, práticas de backup, contato para incidentes e tratamento de menores. Não publique esta minuta com campos pendentes nem a apresente como revisão jurídica concluída.
