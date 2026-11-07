Versão do documento: 0.1.0-alpha.6

# TEFinance — Versão Alpha 1.0

Revisão de 31/10/2026. Consulte VERSAO-ALPHA-1.0.md para correções, validação e limites. O visual existente foi preservado.

## React + Vite

O aplicativo usa React 19 e Vite 8, com duas entradas: index.html (aplicativo) e login.html (login). O build gera dist, usado pelo Netlify e pela prévia publicada.

## Rodar no computador

Instale Node.js 22.12 ou superior, extraia o ZIP e abra um terminal na pasta que contém package.json.

```sh
npm ci
npm run dev
```

Abra o endereço mostrado no terminal. Não abra o HTML com file://. Para compilar e verificar a versão de produção:

```sh
npm test
npm run build
npm run preview
```

## Publicar no Netlify

Publique o projeto completo por repositório Git ou Netlify CLI. O netlify.toml já define o comando npm run build, a pasta dist e as funções em netlify/functions. Com a CLI instalada e a conta/site selecionados, use netlify deploy --build --prod. O deploy exige que você confirme o site correto na CLI.

Arrastar apenas dist ao painel publica a interface, mas não instala a função de pesquisa Gemini. Mantenha as variáveis privadas GEMINI_API_KEY e, se necessário, GEMINI_MODEL nas configurações do servidor Netlify. Não coloque segredos em variáveis VITE_* nem no navegador.

No mesmo domínio tefinance.netlify.app, a conta e a cópia local continuam usando as mesmas chaves de armazenamento e o mesmo Supabase. Não é necessário executar SQL novamente nem criar outra base. Domínios diferentes não compartilham o armazenamento do navegador; os dados da conta são recuperados pela sincronização após entrar com a mesma conta Google. Visitantes continuam temporários.

## Código

- src/App.tsx e src/components/WorkspaceLayout.tsx: inicialização e estrutura do aplicativo.
- src/components/Login.tsx: tela de login em JSX.
- src/components/FinanceView.tsx: adaptação dos templates financeiros existentes para elementos React, mantendo atributos, campos e gráficos. Não usa iframe ou dangerouslySetInnerHTML.
- src/finance/workspace.tsx: regras financeiras, persistência atômica, renderizadores de conteúdo e controladores de interação existentes, agora como módulo. Parte dos controladores ainda usa delegação de eventos DOM para preservar os fluxos testados; não houve reescrita integral para hooks.
- src/services: autenticação, sincronização, animações e login social.
- src/styles e public/assets: estilos, vídeos e imagens.
- netlify/functions: backend Gemini, com segredos somente no servidor.
- tests: testes de regressão e revisão React com dados sintéticos. As páginas tests/react-qa.html e tests/react-qa-entry.html funcionam apenas no servidor de desenvolvimento e não entram no build público.

## Funcionalidades mantidas

Entradas e gastos com calendário, categorias e recorrências; metas, dívidas, divisão em centavos, planejamentos, relatórios fechados, importação e exportação CSV, backup, perfil Google, visitante, notificações e sincronização por conta. Ofertas e consulta de produtos usam o backend Gemini já existente; não representam uma integração concluída de afiliados. Apple, Open Finance, bolsa e pagamentos de apoio continuam dependendo das integrações futuras.

## Validação e limites

Os testes financeiros, de autenticação, sincronização e backend foram mantidos e adaptados para ler o código-fonte dos módulos, em vez do HTML compilado. As mesmas regras e o esquema em centavos foram preservados.

O login Google e o Gemini precisam ser conferidos no domínio HTTPS de produção, com as respectivas configurações. O teste de visitante usa dados sintéticos e não comprova o fluxo Google real. Consulte LOGIN-GOOGLE.md, SINCRONIZACAO.md e ATIVAR-GEMINI.md.

## Liquid Glass

A interface integra @zakisheriff/liquid-glass 0.3.8, com botões, cards, segmentos e o switch de tema. Os efeitos usam a paleta atual e mantêm os formulários legíveis. Consulte LIQUID-GLASS.md para a integração e as diferenças entre navegadores.

## Preparação da publicação (30/10/2026)

Siga GUIA-PUBLICACAO.md para publicar o projeto completo no Netlify, configurar segredos e testar duas contas. Execute npm run check:release após o build. O endpoint autenticado /.netlify/functions/service-status verifica apenas presença de configuração, sem expor valores ou consultar APIs pagas. A minuta PRIVACIDADE-MINUTA.md ainda precisa dos dados do responsável e não é uma política já publicada.

## Padrão visual

Antes de alterar a interface, consulte [o guia de layout](docs/GUIA-DE-LAYOUT.md) e as regras em [AGENTS.md](AGENTS.md). O guia documenta páginas, cards, botões, animações, textos e revisão visual.
