Versão do documento: 0.1.0-alpha.1

# Movimento universal — auditoria e preservação

## Fonte de verdade

`src/services/motion-presets.ts` exporta MOTION, molas, FADE, INSTANT, estados de botão, perfil e funções de página/card. Esse módulo publica as mesmas constantes em variáveis CSS `--motion-*`; não há uma segunda tabela independente de duração em CSS. MotionProvider, IOSButton, PageTransition, LoginEntrance, controladores de página/sessão/perfil e CSS da aplicação reutilizam os presets.

A camada `universal-motion.css` aplica microinterações a controles nativos e aos ícones do cabeçalho. Botões IOSButton usam Motion; seu CSS não interpola transform em paralelo. Switches/sliders/segmentos mantêm as interações da biblioteca, com timing CSS compartilhado. Não foi alterado o código interno da dependência Liquid Glass nem de widgets externos (Google/Pluggy).

## Passagem 1: preservar e aplicar

- Centralizados timings/easings CSS e React, amplitudes de hover/tap e frames de entrada/saída.
- Transições de cor, sombra, borda, largura, altura, padding, grid e stroke-dasharray foram removidas das folhas próprias. Estados finais continuam com os valores existentes; foco aparece imediatamente, com o indicador original.
- Barra inferior mantém os mesmos tamanhos expandido/compacto. Ao mudar o estado, mede o tamanho anterior/novo uma vez e anima scaleX/scaleY, sem interpolar dimensões a cada frame. Resize e troca de breakpoint não reutilizam medidas incompatíveis.
- O antigo grow de largura do gráfico usa scaleX. Skeletons usam apenas opacidade.
- Busca e atalhos também recebem entrada pelo controlador dos dialogs. CSS de entrada é suprimido quando Motion controla o dialog, evitando duas animações concorrentes.
- Fluxos que fecham o dialog sincronamente continuam com esse contrato e seus eventos; não foram introduzidos atrasos globais no fechamento, clones de formulários ou duplicação de IDs. Perfil e trocas de página mantêm suas saídas coordenadas existentes.

## Passagem 2: estados e acessibilidade

- Botão compartilhado: hover desloca discretamente, tap comprime, repouso restaura; amplitudes em constantes. Movimento reduzido usa repouso e remove deslocamentos em andamento, inclusive ao mudar a preferência durante hover.
- Controles nativos e ícones: microinteração de escala; hover apenas para ponteiro fino; disabled não recebe press/hover novo.
- Links/disclosures: resposta por opacidade, sem alteração de cores ou layout.
- Foco: mantém halo, cores e forma existentes, sem interpolar box-shadow/border-color.
- prefers-reduced-motion remove transições CSS, repetições e atrasos. Páginas/dialogs podem usar crossfade sem deslocamento. Posicionamentos estáticos por transform (ex.: centro de popup) não são redefinidos globalmente.

## Evidências

- Comparação automática de estilos estáticos antes/depois em 20 combinações: cinco áreas (Resumo, Compromissos, Planejamento, Investimentos, Análises), dois temas e duas larguras (390/1440). Cores, fontes, bordas, sombras, padding/margin, display/grid/gap e dimensões dos elementos medidos coincidiram. Transições foram suspensas somente nas páginas de comparação e as APIs receberam respostas iguais, para comparar os estados finais.
- Auditoria das declarações CSS contra cópia anterior: propriedades não relacionadas a movimento permaneceram iguais. A exceção intencional é width dentro do keyframe grow, substituído por transform; a largura final do elemento não mudou.
- Chromium: hover, tap, focus-visible, botão desabilitado pelas props React, mudança de preferência reduced-motion durante hover, compactação por scroll e restauração após pausa.
- Regressões de modal: abertura, Escape, backdrop, foco de retorno, temas e telas pequenas.
- Suíte completa, TypeScript, build, distribuição e git diff --check.

Essas verificações cobrem componentes e estados exercitados, não todas as combinações possíveis de dados, navegadores e widgets de terceiros. A biblioteca mantém seu motor interno de gesto/refração. Não foram alterados cálculos financeiros, chamadas de API ou persistência. As correções visuais de calendário/Análises já pendentes antes desta etapa foram preservadas; a comparação usa essa versão pendente como base.
