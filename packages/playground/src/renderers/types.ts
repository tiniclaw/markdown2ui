import type { AST } from '@markdown2ui/parser';

export type RendererType = 'plain' | 'shadcn' | 'mui' | 'json-render';

export interface RendererProps {
  ast: AST;
  onSubmit?: (result: string) => void;
}

export const RENDERER_LABELS: Record<RendererType, string> = {
  plain: 'Plain',
  shadcn: 'shadcn/ui',
  mui: 'Material UI',
  'json-render': 'json-render (SDUI)',
};
