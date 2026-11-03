# Aba Impostos — operação e arquitetura

## Disponível

Interface React responsiva com Liquid Glass e Motion. Quatro indicadores, média ponderada, cobertura, filtros, histórico de compras e gráficos. Cada análise pertence a um lançamento existente. A ação explícita Registrar novo gasto usa o controlador financeiro atual, sem duplicação ao salvar o tributo.

Entrada manual do total aproximado apresentado no documento e classificação por itens. Leitura de XML NFe/NFCe e TXT, com revisão humana obrigatória. Não há OCR de imagem/PDF nem busca automática de NCM por texto; códigos e origem precisam ser confirmados. Documento não é prova do recolhimento efetivo. O arquivo original não sai do navegador.

Cálculo por produto/serviço com origem explícita, centavos e ajuste determinístico dos resíduos de arredondamento. Nacional e Importado são alternativas da parcela federal. Nulos e origem desconhecida ficam pendentes. Cache persistente por licença, tipo/código, UF, EX, versão e vigência; revalidação diária. Sem tabela histórica válida, uma compra antiga não recebe a tabela atual. Limite de 20 consultas em uma análise e 30 análises por usuário/hora. Sem repetição automática em 429; Retry-After bloqueia novas tentativas no cliente.

Perfis de CNAE existem como tabela administrada no servidor, inicialmente vazia. Não foram inventadas alíquotas por atividade. Perfis só devem ser habilitados com fonte e metodologia revisadas, UF e vigência compatíveis.

## Configuração necessária do IBPT

Nesta distribuição, o backend principal é `/api/taxes` na Vercel, usando o mesmo Supabase como banco e autenticação. A Edge Function antiga permanece apenas como referência e não recebe chamadas desta interface.

1. Obter token do IBPT e autorização de uso para o produto, vinculados à empresa consultante.
2. Na Vercel, cadastrar `IBPT_TOKEN`, `IBPT_CNPJ` e `SUPABASE_SECRET_KEY` nas variáveis de ambiente de servidor.
3. O CNPJ é da empresa autorizada a consultar a API, não o CNPJ de cada estabelecimento.
4. As funções serão publicadas no seu deploy. Após alterar segredos na Vercel, faça Redeploy. Nunca os coloque no React.
5. Entrar com uma conta, criar/sincronizar um gasto do mês aberto, adicionar itens com NCM/NBS/LC116, UF, origem, unidade, valor e GTIN quando exigido.
6. Salvar e conferir fonte, versão, vigência e cobertura nos detalhes. Sem credenciais a análise por item fica pendente; o valor informado no documento continua funcionando.

Opcional: `TAX_TIME_ZONE`, padrão `America/Sao_Paulo`, define a virada de dia/mês no servidor. O frontend financeiro segue o relógio local do usuário; validar viagens entre fusos antes de expandir o produto para outros países.

## Importação bancária

A Netlify Function `connect-token` recebeu ações de listar contas e consultar `/v2/transactions` com paginação por cursor. Ela valida a sessão, a propriedade da conexão e da conta. Chaves permanecem no servidor, nas variáveis `PLUGGY_CLIENT_ID` e `PLUGGY_CLIENT_SECRET` já usadas pela conexão.

É necessário publicar esta versão completa no Netlify. A hospedagem estática de demonstração não executa Functions do Netlify. Depois de conectar em Integrações, usar Impostos → Importar banco, selecionar conta, revisar e importar. Há até 100 movimentações por confirmação. As compras entram em Entradas; os metadados tributários são salvos em lote após sincronização. Ganhos entram como entradas pontuais; recorrência/salário requer revisão do usuário.

Pagamento de fatura, estorno, cashback, crédito contratado, transferências reconhecidas, investimentos/empréstimos identificados, moedas diferentes de BRL e movimentações não POSTED são excluídos da prévia. PIX pode ser compra ou transferência: a seleção não é automática. Reimportar o mesmo identificador não duplica o lançamento. Reconexões que alterem identificadores e duplicidades de lançamentos manuais exigem revisão. Alterações ou exclusões posteriores no banco não sobrescrevem silenciosamente o histórico do app; este fluxo é importação assistida, sem webhook automático.

Cartões exigem vínculo com um cartão cadastrado para comprometer o limite correto. Parcelas são apropriadas pelo valor efetivamente registrado, sem repetir o imposto sobre o total integral. XML cujo total dos itens supere a parcela é recusado; não se promete conciliação integral automática de um cupom parcelado sem dados suficientes. Estornos não ajustam automaticamente cálculos já fechados.

## Dados e segurança

- `app_tax_records`: análise atual por usuário/item, com revisão otimista.
- `app_tax_record_history`: snapshot por revisão, escrito pelo trigger na mesma transação; exclusão explícita da análise/conta remove os snapshots vinculados.
- `app_tax_rate_cache`: referências compartilhadas, sem dados bancários.
- `app_tax_activity_profiles`: metodologia setorial administrada, sem escrita do cliente.
- `app_tax_request_budget`: limite atômico de consultas.

As tabelas de usuário têm RLS de leitura por `auth.uid()`. Navegadores não têm INSERT/UPDATE/DELETE. A Edge Function verifica o JWT no Auth e lê o gasto canônico da conta antes de calcular. A plataforma não verifica o JWT na porta da função (`verify_jwt=false`), pois a autenticação é feita explicitamente no handler, inclusive para as chaves publicáveis novas. Nenhum endpoint de dados é anônimo.

A função `/api/taxes` usa segredos de servidor da Vercel. A secret key do Supabase permite escrita validada no servidor e nunca é enviada ao navegador. A interface usa esta rota como caminho padrão; as credenciais são configuradas conforme PUBLICAR-VERCEL.md.

Não registrar query strings do IBPT em logs: sua API recebe token por GET. Respostas públicas são sanitizadas. CORS limita as origens conhecidas. Arquivos rejeitam DOCTYPE/ENTITY e excedentes de 1 MB; revisão confirma o envio dos dados dos itens ao fornecedor. Conexões bancárias e documentos não são enviados ao IBPT.

Relatórios → Impostos exporta as análises atuais. O backup financeiro existente permanece compatível; não substitui essa exportação específica. Zerar dados também solicita a remoção das análises; falhas são comunicadas sem afirmar conclusão completa. Visitantes não sincronizam análises entre dispositivos.

## Verificação

Testes automatizados usam respostas fictícias, sem credenciais reais: nacional/importado, arredondamento conciliado, nulos, vigência, cache, ausência de configuração, timeout/401/429, prioridade do documento, cobertura/média ponderada, faturas excluídas, identificadores estáveis, propriedade de conexão/conta e gravação pelo servidor. Executar `npm test`, build e `npm run check:release`.

A consulta autenticada ao IBPT e a importação com banco real dependem das credenciais/consentimento e não devem ser descritas como verificadas antes dessa etapa. Não há cálculo de imposto de renda, CDB, ganho de capital, restituição ou apuração fiscal nesta aba.
