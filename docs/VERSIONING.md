Versão do documento: 0.1.0-alpha.6

# Versionamento

## Esquema e autoridade

O projeto usa SemVer com canal de pré-lançamento. A versão atual aprovada é `0.1.0-alpha.6`, lançada em `2026-11-07`. A primeira alpha aprovada é `0.1.0-alpha.1`, com data de lançamento `2026-11-05`. Somente o proprietário decide quando aumentar a versão. Auditorias, correções ou agentes não devem incrementá-la por conta própria.

`src/version.ts` é a fonte de verdade: APP_VERSION, APP_CHANNEL, APP_RELEASE_DATE e APP_VERSION_LABEL. As cópias abaixo devem permanecer sincronizadas e são conferidas por teste:

- version em package.json;
- version na raiz do lockfile e em packages[""].version, quando presentes;
- primeira entrada de lançamento no CHANGELOG.md;
- linha “Versão do documento: <versão>” em README.md e nos Markdown de docs/.

O prefixo documental identifica a revisão documental, sem refazer a auditoria de conteúdos históricos. Não reescrever guias históricos ou regras de negócio para atualizar esse prefixo. Arquivos gerados e relatórios não versionados ficam fora da alteração mecânica dos guias; relatórios produzidos pelo agente registram sua própria versão.

## Canais

A progressão é alpha → beta → rc → estável:

- alpha.N: primeira implementação e validação inicial;
- beta.N: recursos definidos, com validação mais ampla;
- rc.N: candidato a lançamento, sem mudanças não verificadas;
- versão estável: remove o sufixo, por exemplo 0.1.0.

O número N é inteiro sem zero inicial. Cada canal e número são decididos pelo proprietário; não avançar automaticamente porque os testes passaram.

## Quando alterar cada parte

- MAJOR: mudanças incompatíveis em contratos ou comportamento, com decisão e plano de compatibilidade.
- MINOR: funcionalidade compatível aprovada. Antes de 1.0, o proprietário deve explicitar a política de compatibilidade e qualquer impacto de uma mudança de MINOR.
- PATCH: correção compatível aprovada.
- Número de pré-lançamento: nova rodada do mesmo ciclo, como alpha.1 para alpha.2, sem inventar uma nova versão estável.
- Data: atualizar a data do lançamento aprovado e sua entrada no changelog.

Nada autoriza alterar schemas, migrações, API, dados ou design por consequência de uma troca de versão. O lockfile só pode ter campos de versão raiz ajustados com exceção expressa; dependências e integridades ficam intactas.

## Checklist de lançamento

1. Confirmar branch dedicada e árvore limpa; relatórios não entram em commits.
2. Decidir a versão e a data com o proprietário.
3. Alterar a fonte única e os campos espelhados; revisar o diff exato do package/lockfile.
4. Escrever CHANGELOG em pt-BR, no estilo Keep a Changelog, com fatos verificáveis em commits; trabalho em stash não é recurso entregue.
5. Atualizar somente a linha documental dos guias existentes. Não alterar conteúdo histórico por conveniência.
6. Executar check:types, npm test, check:styles, build, check:release e scripts/build-budget.mjs; comparar com a baseline e informar falhas preexistentes.
7. Confirmar a linha de versão em Configurações, no menu principal, em 375/768/1280 e claro/escuro; texto selecionável e sem overflow. Registro e segurança continua vazio.
8. Comparar CSS por tamanho/hash. A versão não é motivo para mudar cores, tipografia, sombras, vidro ou Motion.
9. Registrar Safari/iPhone, APIs reais e comparação visual não verificados como limitações, sem alegar aprovação.
10. Revisar os commits locais. Tags, publicação e deploy não são executados por agentes.

## Tags — execução exclusiva do proprietário

Os exemplos abaixo são apenas documentação para o proprietário, após sua própria revisão. Não foram executados pelo agente:

```sh
git status --short
git tag -a v0.1.0-alpha.1 -m "Primeira alpha 0.1.0-alpha.1"
git show v0.1.0-alpha.1 --no-patch
```

Não usar comandos automáticos de versionamento que criem tags como efeito colateral. Não há autorização de push, merge, release ou deploy neste documento.

## Limites atuais

A regra mensal de nome de usuário é local ao dispositivo, sem imposição no servidor. Safari/iPhone físico e provedores reais não foram verificados. A comparação pixel a pixel depende de uma referência local aprovada; capturas concluídas não são essa comparação. Consulte o changelog e os relatórios da rodada para distinguir entregas, testes antigos atualizados e correções ainda não integradas.
