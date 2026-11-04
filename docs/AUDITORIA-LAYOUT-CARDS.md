# Auditoria de layout e componentes

Revisão de 03/11/2026. Código de referência: navegação atual de cinco áreas.

## Problemas encontrados e correções

| Problema | Correção |
| --- | --- |
| A seção integrada de hábitos herdava a regra de card reordenável, ocupando apenas uma fração da grade. Também mantinha estilos restritos à antiga aba Comportamento. | O contêiner ocupa a linha completa do Resumo e não recebe borda/padding de card. Os cards internos usam duas colunas a partir de 768 px e uma coluna abaixo disso. |
| A pesquisa de Planejamento usava display:contents, eliminando a caixa da superfície, enquanto compra planejada usava outro espaçamento. | Cards reais com finance-layout-card, reaproveitando FinanceGlassCard. Pesquisa, edição, planos, confirmação, compras confirmadas, ofertas e metas compartilham material, raio, padding, borda e sombra. |
| Margens de seções e barras somavam espaço ao gap da grade. | A grade controla os gutters: 24 px no desktop e 16 px no mobile. Removidas as margens duplicadas. |
| Formulários apresentavam outra moldura dentro do card; checkbox herdava uma coluna de campos. | Uma superfície externa por editor. Checkbox e texto alinhados em linha; campos avançados empilham em telas pequenas. |
| O ícone de data usava transform para centralizar e disputava a mesma propriedade com a animação do botão. | Centralização por inset vertical e margem automática. |
| Meses e data do editor de meta voltavam ao valor inicial ao alternar o prazo. Salvar recriava a árvore antes de mostrar o sucesso. | Campos controlados; salvamento sem remontar o editor, com a gravação financeira validada original. |
| Resposta antiga de pesquisa podia substituir o resultado salvo de uma consulta mais recente após sair e voltar à tela. | Geração de requisição: somente a consulta mais recente atualiza o resultado. |
| Nome longo da seção de compartilhamento. | Rótulo Dividir conta; chave interna friends preservada. |

## Arquivos

- src/styles/shared-controls.css: material/medidas compartilhados, grades, gaps e contenção.
- src/finance/workspace.tsx: composição dos cards, busca e contrato de atualização da meta.
- src/components/GoalEditor.tsx: estado controlado e preservação do editor.
- src/services/navigation.ts: rótulo Dividir conta.

## Validação

Testes de regressão financeira, tipos, build e release. Chromium com dados fictícios em 320, 390, 768 e 1440 px, claro/escuro: contenção de títulos/campos, ausência de overflow horizontal, pesquisa com API simulada, seleção, compra e confirmação, alternância/salvamento de prazo da meta. Os estilos computados de padding, borda, raio e sombra são comparados entre Hábitos e Planejamento. Verificação específica de largura da grade de comportamento e existência de caixas reais nos cards de pesquisa.

A revisão local não equivale a verificar todos os estados de produção, Safari/iOS físico ou integrações com credenciais reais. Nenhuma regra de cálculo, categoria persistida ou migração de dados foi alterada.
