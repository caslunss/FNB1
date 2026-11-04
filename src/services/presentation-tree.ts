import { Children, Fragment, isValidElement, type ReactNode } from 'react';
type RawProps = Record<string, unknown> & {
  children?: ReactNode;
  style?: Record<string, string | number | undefined>;
};
const propNames: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  readonly: 'readOnly',
  autofocus: 'autoFocus',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autocomplete: 'autoComplete',
  autocapitalize: 'autoCapitalize',
  spellcheck: 'spellCheck',
  inputmode: 'inputMode',
  rowspan: 'rowSpan',
  colspan: 'colSpan',
  contenteditable: 'contentEditable',
  referrerpolicy: 'referrerPolicy',
  viewbox: 'viewBox',
  preserveaspectratio: 'preserveAspectRatio',
  srcdoc: 'srcDoc',
};
const booleanAttributes = new Set([
  'hidden',
  'disabled',
  'required',
  'multiple',
  'readOnly',
  'autoFocus',
  'open',
  'controls',
  'loop',
  'muted',
  'autoPlay',
  'noValidate',
  'formNoValidate',
  'checked',
  'selected',
]);
const attributeNames = Object.fromEntries(Object.entries(propNames).map(([html, react]) => [react, html]));
export class TextNode {
  readonly nodeType = 3;
  readonly textContent: string;
  readonly parentElement: ElementNode | null;
  constructor(textContent: string, parentElement: ElementNode | null) {
    this.textContent = textContent;
    this.parentElement = parentElement;
  }
}
export class ElementNode {
  readonly nodeType = 1;
  readonly childNodes: PresentationNode[];
  readonly namespaceURI: string;
  readonly localName: string;
  readonly props: RawProps;
  readonly parentElement: ElementNode | null;
  constructor(localName: string, props: RawProps, parentElement: ElementNode | null) {
    this.localName = localName;
    this.props = props;
    this.parentElement = parentElement;
    this.namespaceURI =
      localName === 'svg' || parentElement?.namespaceURI === 'http://www.w3.org/2000/svg'
        ? 'http://www.w3.org/2000/svg'
        : 'http://www.w3.org/1999/xhtml';
    this.childNodes = presentationTree(props.children, this);
  }
  get tagName() {
    return this.localName.toUpperCase();
  }
  get children() {
    return this.childNodes.filter((node): node is ElementNode => node.nodeType === 1);
  }
  get textContent(): string {
    return this.childNodes.map((node) => node.textContent).join('');
  }
  get classList() {
    return {
      contains: (value: string) =>
        String(this.props.className || '')
          .split(/\s+/)
          .includes(value),
    };
  }
  get id() {
    return this.getAttribute('id') || '';
  }
  get name() {
    return this.getAttribute('name') || '';
  }
  get type() {
    return this.getAttribute('type') || (this.localName === 'input' ? 'text' : '');
  }
  get multiple() {
    return this.hasAttribute('multiple');
  }
  get attributes() {
    return Object.entries(this.props)
      .filter(
        ([name, value]) =>
          name !== 'children' &&
          name !== 'key' &&
          name !== 'ref' &&
          value !== null &&
          value !== undefined &&
          !(value === false && booleanAttributes.has(name)),
      )
      .map(([name, value]) => ({ name: attributeNames[name] || name, value: String(value) }));
  }
  get style() {
    const values = this.props.style || {};
    return {
      [Symbol.iterator]: () => Object.keys(values)[Symbol.iterator](),
      getPropertyValue: (name: string) => String(values[name] ?? ''),
    };
  }
  hasAttribute(name: string) {
    const value = this.props[propNames[name] || name];
    return (
      value !== null &&
      value !== undefined &&
      !(value === false && booleanAttributes.has(propNames[name] || name))
    );
  }
  getAttribute(name: string | null | undefined): string | undefined {
    if (!name || !this.hasAttribute(name)) return undefined;
    return String(this.props[propNames[name] || name]);
  }
  matches(selector: string): boolean {
    return selector.split(',').some((group) => {
      let pattern = group.trim(),
        excluded = false;
      pattern = pattern.replace(/:not\(([^)]+)\)/g, (_, inner: string) => {
        if (this.matches(inner)) excluded = true;
        return '';
      });
      if (excluded) return false;
      const tag = pattern.match(/^[a-z][\w-]*/i)?.[0];
      if (tag && this.localName.toLowerCase() !== tag.toLowerCase()) return false;
      for (const match of pattern.matchAll(/\.([\w-]+)/g))
        if (!this.classList.contains(match[1])) return false;
      for (const match of pattern.matchAll(/#([\w-]+)/g)) if (this.id !== match[1]) return false;
      for (const match of pattern.matchAll(/\[([^\]=]+)(?:=(["']?)([^\]"']*)\2)?\]/g)) {
        if (!this.hasAttribute(match[1])) return false;
        if (match[3] !== undefined && this.getAttribute(match[1]) !== match[3]) return false;
      }
      return true;
    });
  }
  querySelectorAll(selector: string): ElementNode[] {
    const direct = selector.startsWith(':scope > '),
      pattern = direct ? selector.slice(9) : selector;
    return this.children.flatMap((child) => [
      ...(child.matches(pattern) ? [child] : []),
      ...(direct ? [] : child.querySelectorAll(pattern)),
    ]);
  }
  querySelector<T = ElementNode>(selector: string): ElementNode | null {
    return this.querySelectorAll(selector)[0] || null;
  }
  closest(selector: string): ElementNode | null {
    return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;
  }
}
export type PresentationNode = TextNode | ElementNode;
/** JSX is traversed as data: no HTML parser, HTML injection, or live DOM staging. */
export function presentationTree(content: ReactNode, parent: ElementNode | null = null): PresentationNode[] {
  return Children.toArray(content).flatMap((node) => {
    if (isValidElement<RawProps>(node)) {
      if (node.type === Fragment) return presentationTree(node.props.children, parent);
      if (typeof node.type !== 'string')
        throw Error('A apresentação deve usar componentes do sistema de design pelo adaptador.');
      return [new ElementNode(node.type, node.props, parent)];
    }
    return typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint'
      ? [new TextNode(String(node), parent)]
      : [];
  });
}
