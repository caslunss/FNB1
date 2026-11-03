# Animações compartilhadas — Alpha 1.0

Implementação React/TypeScript com `motion/react` (pacote `motion`). As molas são uma interpretação amortecida do movimento da plataforma, não constantes oficiais da Apple. O material Liquid Glass e a paleta existentes permanecem.

## Componentes

- `src/components/motion/MotionProvider.tsx`: raiz global com `reducedMotion="user"`.
- `transitions.ts`: presets canônicos `iosDefaultSpring` (440/44/1) e `iosQuickSpring` (650/52/1), compartilhados com os controladores JavaScript.
- `PageTransition.tsx`: uma rota por vez, `AnimatePresence mode="wait"`. Entrada lateral de 18 px, saída de 12 px, escala .99 e opacidade. Conteúdo que sai fica inerte e oculto da árvore acessível.
- `IOSButton.tsx`: aceita atributos nativos, ref, eventos, disabled e submit. Reutiliza GlassButton; hover sobe 1 px e tap comprime .96. CSS neutraliza somente o press transform concorrente da biblioteca.
- `LoginEntrance.tsx`: escala/fade e elementos em cascata, com 45 ms entre grupos; preserva Google, Apple e visitante. Não adicionar email/senha.
- `SmoothState.jsx`: troca carregando/pronto com presença e opacidade, sem animar altura. O espaço mínimo estático reduz saltos; conteúdo pode crescer naturalmente.

```tsx
import MotionProvider from './components/motion/MotionProvider';
import PageTransition from './components/motion/PageTransition';
import IOSButton from './components/motion/IOSButton';

export function Screen({route,children}:{route:string;children:React.ReactNode}) {
  return <MotionProvider>
    <PageTransition routeKey={route} className="ios-page-frame">
      {children}
    </PageTransition>
    <IOSButton type="button" onClick={()=>window.planAuth.signOut()}>Sair</IOSButton>
  </MotionProvider>;
}
```

## Integração com o aplicativo atual

Login e dashboard são documentos HTML separados. Não é possível manter a mesma árvore AnimatePresence através de `location.replace`. `session-motion.js` anima o documento atual, aguarda a conclusão (limite de 550 ms) e só então navega. O logout revoga a sessão em paralelo, bloqueia interação durante a saída e restaura os controles em caso de falha. A notificação de SIGNED_OUT não antecipa esse fluxo deliberado.

O controlador financeiro ainda precisa renderizar formulários sincronamente para focar/ler os campos. `planRouteMotion` aguarda a saída e executa a renderização síncrona, seguida da entrada; não mantém cópias de campos com IDs iguais. Navegação rápida guarda o destino mais recente. Não envolver indiscriminadamente as raízes TemplateView em presença assíncrona.

## Performance e acessibilidade

Somente opacity/x/y/scale nas animações estruturais implementadas. Nenhum layout, clipPath ou backdrop-filter é interpolado. `useWillChange` nos componentes e will-change temporário nos controladores. Não aplicar permanentemente will-change em todos os cards. Blurs/refração continuam parte estática do material; a biblioteca pode ter seus próprios efeitos internos.

Movimento reduzido remove deslocamento/escala; mantém fade curto. Botões disabled não recebem gestos. A navegação fixa fica fora do plano animado. Cards tributários interativos sobem 3 px e comprimem .97, sem transformar cards de leitura em botões.

Validar `npm test`, `npm run check:types`, build e revisão em claro/escuro, mobile/desktop, menus e formulários. O desempenho final depende do dispositivo, navegador e custo do vidro; não há promessa universal de FPS.
