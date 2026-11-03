# TEFinance — Alpha 1.0 para Vercel

Projeto React/Vite organizado para publicar frontend e APIs na Vercel. Comece por [PUBLICAR-VERCEL.md](PUBLICAR-VERCEL.md).

## Estrutura

- `src/`: interface e lógica financeira.
- `public/`: imagens, estilos e configuração pública do login.
- `api/`: sete entradas HTTP da Vercel.
- `server/functions/`: controladores das integrações, fora da pasta pública.
- `server/taxes/`: regras tributárias e consultas do servidor.
- `supabase/`: migrações e funções existentes de referência; não executar novamente em produção sem revisar.
- `docs/`: guias de layout, animações e arquitetura. `historico/` guarda instruções da versão Netlify, que não se aplicam a este pacote.
- `tests/`: regressão financeira e testes das APIs.
- `scripts/`: verificações de publicação.
- `vercel.json`: build e funções. `package.json` e `package-lock.json`: dependências fixadas.

## Desenvolvimento

Use Node.js 22.12 ou superior, dentro da série 22.

```sh
npm ci
npm run dev
```

Vite atende somente a interface. Para testar as APIs locais use a Vercel CLI (`vercel dev`) com seu projeto e variáveis configurados.

```sh
npm test
npm run check:types
npm run build
npm run check:release
```

O build gera `dist/`, que não precisa ser enviado ao GitHub. Não abra index.html diretamente pelo explorador de arquivos.

Nenhum visual ou cálculo financeiro foi redesenhado nesta adaptação. Google, IBPT, IA, mercado e bancos dependem da configuração de produção e das credenciais de cada fornecedor. As chamadas de impostos passam pela API da Vercel, mantendo o Supabase existente como banco/autenticação.
