import sharp from 'sharp';

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Relative luminance per WCAG 2.1 */
export function relativeLuminance(h: number, s: number, l: number): number {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * toLinear(f(0)) + 0.7152 * toLinear(f(8)) + 0.0722 * toLinear(f(4));
}

/** Returns '0 0% 100%' (white) for dark bg, '0 0% 0%' (black) for light bg — WCAG AA 4.5:1 */
export function contrastForeground(h: number, s: number, l: number): string {
  const lum = relativeLuminance(h, s, l);
  // contrast ratio with white vs black
  const contrastWhite = (1.05) / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? '0 0% 100%' : '0 0% 0%';
}

export interface PaletteColor {
  hsl: string;     // "221 83% 53%"
  hex: string;     // "#3b82f6"
  foreground: string; // "0 0% 100%" or "0 0% 0%"
}

const DEFAULT_ACCENT = '221 83% 53%';

export async function extractPalette(filePath: string): Promise<PaletteColor[]> {
  try {
    const { data, info } = await sharp(filePath)
      .resize(64, 64, { fit: 'cover' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const buckets = new Map<string, { r: number; g: number; b: number; count: number }>();

    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const key = `${(r >> 4) << 4}-${(g >> 4) << 4}-${(b >> 4) << 4}`;
      const existing = buckets.get(key);
      if (existing) {
        existing.r += r; existing.g += g; existing.b += b; existing.count++;
      } else {
        buckets.set(key, { r, g, b, count: 1 });
      }
    }

    const sorted = [...buckets.values()]
      .sort((a, b) => b.count - a.count)
      .map((b) => {
        const avg = rgbToHsl(b.r / b.count, b.g / b.count, b.b / b.count);
        return avg;
      });

    // Deduplicate colors that are too similar (within 10 hue + 10 saturation)
    const unique: { h: number; s: number; l: number }[] = [];
    for (const c of sorted) {
      if (c.s < 5 && (c.l < 10 || c.l > 90)) continue; // skip near-black/white
      const isDupe = unique.some(
        (u) => Math.abs(u.h - c.h) < 15 && Math.abs(u.s - c.s) < 15 && Math.abs(u.l - c.l) < 15
      );
      if (!isDupe) unique.push(c);
      if (unique.length >= 8) break;
    }

    if (unique.length === 0) {
      return [makeColor(221, 83, 53)];
    }

    return unique.map((c) => makeColor(c.h, c.s, c.l));
  } catch (err) {
    console.error('[Palette Extraction Error]', err);
    return [makeColor(221, 83, 53)];
  }
}

function makeColor(h: number, s: number, l: number): PaletteColor {
  return {
    hsl: `${h} ${s}% ${l}%`,
    hex: hslToHex(h, s, l),
    foreground: contrastForeground(h, s, l),
  };
}

export async function extractAccentColor(filePath: string): Promise<string> {
  const palette = await extractPalette(filePath);
  // Pick the first chromatic color
  const chosen = palette.find((c) => {
    const parts = c.hsl.split(' ');
    const s = parseInt(parts[1]);
    const l = parseInt(parts[2]);
    return s >= 20 && l >= 15 && l <= 85;
  });
  return chosen?.hsl ?? DEFAULT_ACCENT;
}
