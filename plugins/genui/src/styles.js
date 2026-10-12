export const sheets = [];
export function registerStyle(css) { sheets.push(css); }

export const hostTheme = `
.pi-genui {
  --dsw-alias-bg-base: var(--ds-bg-base, transparent);
  --dsw-alias-bg-layer-1: var(--ds-bg-elevated, transparent);
  --dsw-alias-bg-layer-2: var(--ds-bg-elevated, transparent);
  --dsw-alias-bg-layer-3: var(--ds-bg-hover, transparent);
  --dsw-alias-label-primary: var(--ds-text-primary, currentColor);
  --dsw-alias-label-secondary: var(--ds-text-secondary, currentColor);
  --dsw-alias-label-tertiary: var(--ds-text-muted, currentColor);
  --dsw-alias-label-caption: var(--ds-text-muted, currentColor);
  --dsw-alias-border-l1: var(--ds-border-default, currentColor);
  --dsw-alias-border-l2: var(--ds-border-strong, currentColor);
  --dsw-alias-state-business-primary: var(--ds-accent, #4f8ef7);
  --dsw-alias-state-error-primary: var(--ds-error, #dc2626);
  --dsw-alias-state-success-primary: var(--ds-success, #16a34a);
  --dsw-alias-state-warn-primary: var(--ds-warning, #d97706);
  --dsw-alias-markdown-code-block: var(--ds-bg-elevated, transparent);
  --dsw-static-white: #fff;
  --dsw-static-black: #000;
  max-width: min(100%, 960px); min-width: 0; max-height: 3500px; overflow: auto;
  font-family: inherit; color: var(--ds-text-primary, inherit);
}
.pi-genui [role=alert] { color: var(--ds-error, #dc2626); white-space: pre-wrap; }
.pi-genui pre { max-height: 480px; overflow: auto; white-space: pre-wrap; }
@media (prefers-reduced-motion: reduce) { .pi-genui * { animation: none !important; transition: none !important; } }
`;
