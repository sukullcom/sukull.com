declare module 'monaco-editor' {
  export type BuiltinTheme = 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';

  export interface ThemeRule {
    token: string;
    foreground?: string;
    background?: string;
    fontStyle?: string;
  }

  export interface ThemeData {
    base: BuiltinTheme;
    inherit: boolean;
    rules: ThemeRule[];
    colors: Record<string, string>;
  }
} 