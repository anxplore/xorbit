/**
 * Canvas 2D fillStyle/strokeStyle do not resolve CSS var() reliably.
 * Use these helpers so theme tokens from global.css work on canvas.
 */

const FALLBACK: Record<string, string> = {
  '--color-space-purple': '#A855F7',
  '--color-industrial-blue': '#3B82F6',
  '--color-mars-orange': '#FF6B35',
  '--color-prototype-amber': '#F59E0B',
  '--color-breadboard-red': '#EF4444',
  '--color-static-grey': '#6B7280',
  '--color-surface': '#111827',
  '--color-border': '#1E293B',
};

let probeEl: HTMLSpanElement | null = null;

function fallbackHex(cssColor: string): string {
  const m = cssColor.match(/var\(\s*([^)]+?)\s*\)/);
  if (m && FALLBACK[m[1].trim()]) return FALLBACK[m[1].trim()]!;
  if (cssColor.startsWith('#')) return cssColor;
  return '#000000';
}

/**
 * Returns a color string canvas can render: `rgb(r, g, b)` or `#rrggbb`.
 */
export function resolveCssColorForCanvas(cssColor: string): string {
  if (typeof document === 'undefined') {
    return fallbackHex(cssColor);
  }
  if (!cssColor.includes('var(') && (cssColor.startsWith('#') || cssColor.startsWith('rgb'))) {
    return cssColor.trim();
  }

  if (!probeEl) {
    probeEl = document.createElement('span');
    probeEl.style.position = 'fixed';
    probeEl.style.left = '-9999px';
    probeEl.style.top = '0';
    probeEl.style.visibility = 'hidden';
    document.body.appendChild(probeEl);
  }
  probeEl.style.color = cssColor;
  const resolved = getComputedStyle(probeEl).color;
  if (resolved && resolved !== 'rgba(0, 0, 0, 0)' && resolved !== 'transparent') {
    return resolved;
  }
  return fallbackHex(cssColor);
}

/**
 * Parse rgb/rgba from resolveCssColorForCanvas output.
 */
function parseRgbComponents(resolved: string): { r: number; g: number; b: number } | null {
  const m = resolved.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return null;
  return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

/** rgba() for overlays (replaces broken `hex + '15'` style appends on var colors). */
export function cssColorWithAlpha(cssColor: string, alpha: number): string {
  const resolved = resolveCssColorForCanvas(cssColor);
  const rgb = parseRgbComponents(resolved);
  if (!rgb) return resolved;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}
