# Regras de manutenção do TEFinance

Antes de modificar a interface, leia `docs/GUIA-DE-LAYOUT.md`. Esse é o contrato visual deste projeto, solicitado pelo usuário. Atualize o guia quando uma mudança de padrão for explicitamente aprovada.

- Preserve a paleta escolhida, o Liquid Glass existente e as funções financeiras.
- Reutilize os componentes de `src/components/LiquidControls.tsx`; não crie um segundo sistema de botões, menus, campos ou cards.
- Componentes compartilhados devem funcionar tanto em `#app` quanto em `.account-panel-body`. Não restrinja o acabamento dos formulários apenas à página principal.
- Valide estados fechados e expandidos, menus sobre gráficos, claro/escuro e telas pequenas. Texto e controles devem permanecer dentro da superfície correspondente.
- Simplifique textos sem remover unidades, consequências, informações de privacidade, confirmação de exclusão ou regras financeiras necessárias.
- As categorias canônicas são as cinco do guia. Só mude chaves persistidas com pedido explícito e migração compatível, com backup e testes de totais. Nunca descarte categorias antigas durante uma atualização.
- Faça as verificações proporcionais à alteração e descreva o que foi realmente testado. Não prometa ausência universal de bugs.
