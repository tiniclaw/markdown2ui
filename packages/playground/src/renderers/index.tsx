import type { RendererType, RendererProps } from './types';
import { PlainRenderer } from './PlainRenderer';
import { ShadcnRenderer } from './ShadcnRenderer';
import { MuiRenderer } from './MuiRenderer';
import { JsonRenderRenderer } from './JsonRenderRenderer';

export type { RendererType, RendererProps };
export { RENDERER_LABELS } from './types';

export function RenderWithStyle({ type, ...props }: RendererProps & { type: RendererType }) {
  switch (type) {
    case 'plain': return <PlainRenderer {...props} />;
    case 'shadcn': return <ShadcnRenderer {...props} />;
    case 'mui': return <MuiRenderer {...props} />;
    case 'json-render': return <JsonRenderRenderer {...props} />;
    default: return <PlainRenderer {...props} />;
  }
}
