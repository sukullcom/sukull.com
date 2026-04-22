declare module 'react-katex' {
  import type { ComponentType } from 'react';

  export interface KatexProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => JSX.Element;
    settings?: Record<string, unknown>;
  }

  export const InlineMath: ComponentType<KatexProps>;
  export const BlockMath: ComponentType<KatexProps>;
}
