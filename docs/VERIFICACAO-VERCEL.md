# Verificação da distribuição Vercel — 03/11/2026

Origem: pacote Alpha 1.0 com animações iOS, publicado anteriormente em 31/10/2026.

## Alterações

- Sete entradas Web Request/Response em api/, com controladores em server/functions/.
- Frontend aponta para /api; impostos usa servidor da Vercel com autenticação e banco Supabase existentes.
- CORS tributário reconhece somente origens exatas configuradas e os domínios de sistema do deploy.
- Links de dívida usam o domínio atual, sem levar o amigo de volta ao Netlify.
- Headers de segurança migrados para vercel.json; nenhum rewrite genérico captura APIs.
- Build configurado com npm ci, npm run build e saída dist; Node 22.x.
- Guia de publicação e .env.example sem valores privados. Instruções antigas isoladas em docs/historico.
- Fixtures históricas de outubro receberam relógio fixo de teste para não falharem com a virada para novembro; o relógio e o fechamento financeiro de produção não foram alterados.

## Executado

- npm ci: concluído.
- npm test: 32 suítes concluídas sem falha, incluindo regressões financeiras, sincronização, autenticação, APIs e sete entradas Vercel.
- npm run check:types: concluído.
- npm run build: concluído.
- npm run check:release: concluído, com arquivos de build e entradas de servidor presentes.
- ZIP validado por CRC, estrutura, referências locais e varredura de padrões conhecidos de chaves privadas.

## Limites

Não houve publicação nem build na conta Vercel do usuário. A integração real depende do deploy, da autorização do domínio no Google/Supabase e das credenciais de servidor. As APIs externas foram exercitadas com mocks nos testes; isso não comprova cota, faturamento, licença ou acesso ao banco real. A interface e a paleta não foram redesenhadas; esta é uma adaptação de organização e hospedagem.
