import React, { Children, cloneElement, isValidElement, type ReactNode, type ReactElement } from 'react';
type CardProps = React.HTMLAttributes<HTMLElement> & { 'data-card-key'?: string };
function flatten(content: ReactNode): ReactNode[] {
  return Children.toArray(content).flatMap((node) =>
    isValidElement<{ children?: ReactNode }>(node) && node.type === React.Fragment
      ? flatten(node.props.children)
      : [node],
  );
}
/** Ordering changes presentation only. Financial state and persisted card keys are preserved. */
export function arrangeSummary(content: ReactNode, saved: string[], arranging: boolean): ReactNode {
  const nodes = flatten(content).flatMap((node) =>
    isValidElement<CardProps>(node) && node.props.className?.split(/\s+/).includes('lower-insights')
      ? flatten(node.props.children)
      : [node],
  );
  const fixed = nodes.filter(
    (node) =>
      !isValidElement<CardProps>(node) || node.props.className?.split(/\s+/).includes('summary-switch'),
  );
  const cards = nodes
    .filter(
      (node): node is ReactElement<CardProps> =>
        isValidElement<CardProps>(node) && !node.props.className?.split(/\s+/).includes('summary-switch'),
    )
    .map((card, index) => {
      const classes = card.props.className?.split(/\s+/) || [];
      const key = classes.includes('investment-goal-card')
        ? 'investments'
        : classes.includes('debt-min')
          ? '4'
          : String(index);
      return cloneElement(
        card,
        { 'data-card-key': key },
        arranging ? (
          <>
            <div className="reorder-controls">
              <button className="btn g" data-move-card="-1" aria-label="Mover card para cima">
                ↑
              </button>
              <button className="btn g" data-move-card="1" aria-label="Mover card para baixo">
                ↓
              </button>
            </div>
            {card.props.children}
          </>
        ) : (
          card.props.children
        ),
      );
    });
  const order = [...new Set([...saved, ...cards.map((card) => card.props['data-card-key']!)])];
  return (
    <>
      {arranging && (
        <button className="btn" data-finish-arrange="">
          Concluir
        </button>
      )}
      {fixed}
      {order.map((key) => cards.find((card) => card.props['data-card-key'] === key))}
    </>
  );
}
