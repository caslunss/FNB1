Versão do documento: 0.1.0-alpha.5

# Ativar pesquisa de produtos no Netlify

O ZIP contém o projeto completo: src/, public/, package.json, package-lock.json, dist/, netlify/functions/shopping.mjs e netlify.toml.
O endpoint depende de Netlify Functions. Arrastar apenas dist/ publica a interface, mas não ativa a pesquisa.

1. Em Google AI Studio, use uma chave Gemini válida, restrita à API Gemini. A chave enviada no chat foi aceita no teste de listagem de modelos; ela não está nos arquivos. Prefira uma nova chave privada, pois a anterior foi compartilhada no chat.
2. No site tefinance do Netlify, configure GEMINI_API_KEY nas variáveis de ambiente com escopo Functions. Não use prefixos públicos. Opcional: GEMINI_MODEL=gemini-2.5-flash (padrão). Verifique cotas e faturamento do projeto Google para Google Search/URL Context.
3. Publique o projeto completo por um repositório Git conectado ao Netlify, ou pelo Netlify CLI. Na raiz extraída, execute `npx netlify-cli deploy --build --prod`, autenticando e selecionando o site tefinance existente. O netlify.toml configura dist como diretório público e netlify/functions como backend. Variáveis novas exigem novo deploy.
4. Ative o login Google no Supabase conforme LOGIN-GOOGLE.md e use uma conta real. O servidor valida a sessão antes de consultar o Gemini. Visitantes mantêm cadastro manual.
5. Carrinhos → Adicionar compra planejada → Link → Buscar produto. Confira nome, variante, preço, foto e características antes de salvar. A importação não confirma compra nem cria gasto.
6. Ofertas → pesquise um produto específico. A resposta mostra preços consultados, condições e fontes. Confira estoque, frete e variante na loja; um resultado de pesquisa não garante desconto.

Limites: lojas com bloqueios/login ou dados não acessíveis podem não fornecer foto, preço ou características. Não há API de afiliados nem comissão automática nesta entrega. O backend faz duas consultas Gemini por busca e limita frequência por usuário por instância; para muitos usuários, configure limite global de gastos/cotas no Google e proteção de tráfego no Netlify. A aplicação não envia histórico financeiro ao Gemini: somente consulta do produto ou link informado. Imagens externas são carregadas da loja. A implantação Sites serve a interface estática; a pesquisa exige Netlify Functions.

Documentação: https://ai.google.dev/gemini-api/docs/google-search
https://ai.google.dev/gemini-api/docs/url-context
https://docs.netlify.com/build/functions/environment-variables/
https://docs.netlify.com/build/functions/get-started/

Validação: autenticação e parsing foram testados com respostas simuladas. A chave foi validada na API de modelos; pesquisa de preços real e importação em produção dependem da configuração acima. Não há garantia de preço/percentual correto gerado por IA.

## Comportamento
Resumo → Comportamento mostra gráficos locais. Analisar usa a mesma Function shopping e GEMINI_API_KEY. Publique novamente o projeto completo após esta atualização. Somente agregados do mês selecionado e dos últimos seis meses são enviados ao Google, sem nomes, e-mails ou descrições dos lançamentos. A análise é sob demanda e fica em memória nesta sessão; ao alterar os dados, o texto anterior deixa de ser mostrado. Datas futuras não entram. Cores de atenção indicam concentração, sem diagnóstico ou julgamento. Meses incompletos não devem ser comparados diretamente com meses completos.
