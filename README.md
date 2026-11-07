Versão do documento: 0.1.0-alpha.1

# TEFinance — Alpha 0.1.0-alpha.1 para Vercel

Projeto React/Vite organizado para publicar frontend e APIs na Vercel. Comece por [PUBLICAR-VERCEL.md](PUBLICAR-VERCEL.md).

## Estrutura

- `src/`: interface e lógica financeira.
- `src/finance/controllers/`: comandos financeiros tipados; `src/finance/session/`: estado, persistência, apresentação e ciclo de vida por domínio. `workspace.tsx` apenas inicia e protege a sessão. Consulte [a migração integral](docs/MIGRACAO-INTEGRAL-CONTROLADOR-2026-11-05.md).
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

Use Node.js 22.18 ou superior, dentro da série 22. Os testes e os módulos de domínio compartilhados utilizam o suporte nativo a TypeScript dessa versão.

```sh
npm ci
npm run dev
```

Vite atende somente a interface. Para verificar os controladores das APIs sem serviços reais, use `npm test`, que inclui transportes simulados. Execute os testes de navegador somente contra um servidor local em `127.0.0.1`, com integrações externas bloqueadas ou simuladas. Não vincule serviços de produção durante auditorias e limpeza.

```sh
npm test
npm run check:types
npm run build
npm run check:release
```

O build gera `dist/`, que não precisa ser enviado ao GitHub. Não abra index.html diretamente pelo explorador de arquivos.

Nenhum visual ou cálculo financeiro foi redesenhado nesta adaptação. Google, IBPT, IA, mercado e bancos dependem da configuração de produção e das credenciais de cada fornecedor. As chamadas de impostos passam pela API da Vercel, mantendo o Supabase existente como banco/autenticação.

O módulo de emissões foi retirado da interface. Dados financeiros e importação de backups permanecem compatíveis; registros locais antigos não são apagados automaticamente.

## Previsão e recorrências locais

A dock mantém quatro áreas. Em **Planejamento → Previsão**, informe o saldo disponível de hoje para estimativas de 30, 60 ou 90 dias. Gastos variáveis estimados são opcionais e identificados separadamente. Compromissos sem vencimento ficam pendentes; o resultado não é confirmação de saldo bancário. O banner de risco também aparece no Resumo; o switch **Alerta de saldo**, em Configurações → Notificações, controla o aviso no sino.

Em **Compromissos → Recorrências**, revise sugestões baseadas em pelo menos três cobranças. Confirmar adiciona somente projeções estimadas; ignorar ou marcar como cancelada preserva os lançamentos e não cancela contratos. Assinaturas do Perfil mantém o resumo e oferece acesso à mesma tela de gerenciamento. Preferências e decisões usam armazenamento local isolado por usuário/visitante, sem sincronização remota nem inclusão nos backups financeiros atuais. Zerar dados financeiros remove esses novos dados locais. Não há IA ou novas APIs nesse fluxo.
