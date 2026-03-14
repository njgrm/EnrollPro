# Accent Color Variables Reference

Complete reference of all accent color variables in the EnrollPro system, from default values to dynamically extracted colors from the uploaded logo.

---

## 📋 Table of Contents

1. [CSS Custom Properties](#css-custom-properties)
2. [JavaScript/TypeScript Variables](#javascripttypescript-variables)
3. [Database Schema](#database-schema)
4. [Color Flow](#color-flow)
5. [Current Values](#current-values)
6. [Usage Examples](#usage-examples)

---

## 🎨 CSS Custom Properties

### Default Values (Defined in `client/src/index.css`)

```css
:root {
  /* ─── DEFAULT ACCENT LAYER — blue; replaced on logo upload ─── */
  --accent: 221 83% 53%;                    /* Default blue accent */
  --accent-foreground: 0 0% 100%;           /* White text on accent */
  --accent-muted: 213 97% 94%;              /* Light blue for muted states */
  --accent-ring: 221 83% 53%;               /* Focus ring color */

  /* shadcn/ui semantic aliases — point to accent tokens */
  --primary: var(--accent);                 /* Alias to --accent */
  --primary-foreground: var(--accent-foreground); /* Alias to --accent-foreground */
  --ring: var(--accent-ring);               /* Alias to --accent-ring */

  /* Sidebar colors */
  --sidebar-primary: var(--accent);         /* Sidebar accent color */
  --sidebar-primary-foreground: var(--accent-foreground); /* Sidebar text */
  --sidebar-accent: var(--accent-muted);    /* Sidebar hover background */
  --sidebar-accent-foreground: 222 47% 11%; /* Sidebar hover text (dark) */
  --sidebar-ring: var(--accent-ring);       /* Sidebar focus ring */
}
```

### Dynamic Values (Applied by `client/src/layouts/RootLayout.tsx`)

When a logo is uploaded and colors are extracted, these CSS variables are dynamically updated via JavaScript:

```typescript
// Applied via document.documentElement.style.setProperty()
root.style.setProperty('--accent', accent);                    // Extracted accent color
root.style.setProperty('--accent-foreground', fg);             // Calculated foreground
root.style.setProperty('--accent-ring', accent);               // Same as accent
root.style.setProperty('--primary', accent);                   // Alias to accent
root.style.setProperty('--primary-foreground', fg);            // Alias to foreground
root.style.setProperty('--ring', accent);                      // Alias to accent-ring
root.style.setProperty('--sidebar-primary', accent);           // Sidebar accent
root.style.setProperty('--sidebar-primary-foreground', fg);    // Sidebar text
root.style.setProperty('--sidebar-ring', accent);              // Sidebar focus
root.style.setProperty('--sidebar-accent', mutedAccent);       // Sidebar hover (lightened)
root.style.setProperty('--sidebar-accent-foreground', mutedFg); // Sidebar hover text
```

---

## 💻 JavaScript/TypeScript Variables

### Constants (Defined in `client/src/layouts/RootLayout.tsx`)

```typescript
const DEFAULT_ACCENT_HSL = '221 83% 53%';  // Default blue accent (fallback)
```

### Zustand Store Interface (Defined in `client/src/stores/settingsStore.ts`)

```typescript
export interface PaletteColor {
  hsl: string;        // HSL format: "60 98% 50%"
  hex: string;        // Hex format: "#fcfc03"
  foreground: string; // Foreground color: "0 0% 100%" or "0 0% 0%"
}

interface ColorScheme {
  accent_hsl: string;              // Primary accent color from logo
  accent_foreground?: string;      // Calculated foreground color
  palette?: PaletteColor[];        // Array of extracted colors (up to 8)
  extracted_at: string;            // ISO timestamp of extraction
}

export interface SettingsState {
  colorScheme: ColorScheme | null;        // Full color scheme from logo
  selectedAccentHsl: string | null;       // User-selected accent from palette
  accentForeground: string | null;        // Calculated foreground (session)
  accentMutedForeground: string | null;   // Calculated muted foreground (session)
  // ... other settings
}
```

### RootLayout Variables (Color Selection Priority)

```typescript
// Source priority (highest to lowest):
const accent = selectedAccentHsl                    // 1. User-selected from palette
  ?? colorScheme?.accent_hsl                        // 2. Auto-selected from logo
  ?? DEFAULT_ACCENT_HSL;                            // 3. Default blue fallback

// Calculated values:
const fg = contrastForeground(accent);              // WCAG-compliant foreground
const mutedAccent = `${parts[0]} ${parts[1]} 94%`;  // Lightened accent (94% lightness)
const mutedFg = contrastForeground(mutedAccent);    // Foreground for muted accent
```

---

## 🗄️ Database Schema

### SchoolSettings Table (Prisma Schema)

```prisma
model SchoolSettings {
  id                 Int      @id @default(autoincrement())
  colorScheme        Json?    // Stores ColorScheme object
  selectedAccentHsl  String?  // User-selected accent HSL
  logoPath           String?  // Server file path to logo
  logoUrl            String?  // Public URL to logo
  // ... other fields
}
```

### ColorScheme JSON Structure (Stored in Database)

```json
{
  "accent_hsl": "60 98% 50%",
  "accent_foreground": "0 0% 0%",
  "palette": [
    {
      "hsl": "60 98% 50%",
      "hex": "#fcfc03",
      "foreground": "0 0% 0%"
    },
    {
      "hsl": "60 92% 34%",
      "hex": "#a6a607",
      "foreground": "0 0% 0%"
    }
    // ... up to 8 colors
  ],
  "extracted_at": "2026-03-13T06:57:14.851Z"
}
```

---

## 🔄 Color Flow

### 1. Default State (No Logo)

```
CSS Variables:
  --accent: 221 83% 53%              (Default blue)
  --accent-foreground: 0 0% 100%     (White)
  --accent-muted: 213 97% 94%        (Light blue)
  --primary: var(--accent)           (Points to blue)
  --primary-foreground: var(--accent-foreground)
  --sidebar-accent: var(--accent-muted)

Database:
  colorScheme: null
  selectedAccentHsl: null

Result: All accent colors are default blue (#3b82f6)
```

### 2. Logo Upload & Color Extraction

```
Server (logoColorService.ts):
  1. Resize logo to 64x64 using Sharp
  2. Extract color buckets from pixels
  3. Sort by frequency and saturation
  4. Select up to 8 unique chromatic colors
  5. Calculate WCAG-compliant foreground for each
  6. Auto-select best accent (chromatic, good contrast)

Database Update:
  colorScheme: {
    accent_hsl: "60 98% 50%",
    accent_foreground: "0 0% 0%",
    palette: [8 colors],
    extracted_at: "2026-03-13T06:57:14.851Z"
  }
  selectedAccentHsl: "60 98% 50%"
```

### 3. Client Receives & Applies Colors

```
RootLayout.tsx (useEffect):
  1. Fetch /api/settings/public on mount
  2. Store in Zustand: colorScheme, selectedAccentHsl

RootLayout.tsx (useLayoutEffect):
  1. Determine accent: selectedAccentHsl ?? colorScheme.accent_hsl ?? DEFAULT
  2. Calculate foreground: contrastForeground(accent)
  3. Calculate muted: `${hue} ${saturation} 94%`
  4. Apply to CSS: document.documentElement.style.setProperty()

CSS Variables (Updated):
  --accent: 60 98% 50%               (Bright yellow from logo)
  --accent-foreground: 0 0% 0%       (Black for contrast)
  --accent-muted: 213 97% 94%        (Kept as default)
  --primary: 60 98% 50%              (Same as accent)
  --primary-foreground: 0 0% 0%      (Same as accent-foreground)
  --sidebar-accent: 60 98% 94%       (Light yellow, calculated)
  --sidebar-accent-foreground: 0 0% 0% (Black for contrast)

Result: All accent colors are now bright yellow (#fcfc03) from logo
```

### 4. User Selects Different Color from Palette

```
User Action:
  Click different color swatch in SchoolProfileTab

API Call:
  PUT /api/settings/accent
  Body: { hsl: "60 92% 34%" }

Database Update:
  selectedAccentHsl: "60 92% 34%"
  colorScheme.accent_hsl: "60 92% 34%"

Client Update:
  1. Zustand store updated
  2. useLayoutEffect triggers
  3. CSS variables updated

CSS Variables (Updated):
  --accent: 60 92% 34%               (Darker yellow from palette)
  --accent-foreground: 0 0% 0%       (Black for contrast)
  --primary: 60 92% 34%              (Same as accent)
  --primary-foreground: 0 0% 0%      (Same as accent-foreground)
  --sidebar-accent: 60 92% 94%       (Light yellow, calculated)

Result: All accent colors are now darker yellow (#a6a607) from palette
```

---

## 📊 Current Values

### Default Values (No Logo)

| Variable | Value | Color | Usage |
|----------|-------|-------|-------|
| `--accent` | `221 83% 53%` | ![#3b82f6](https://via.placeholder.com/15/3b82f6/3b82f6.png) `#3b82f6` | Primary accent color |
| `--accent-foreground` | `0 0% 100%` | ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) `#ffffff` | Text on accent |
| `--accent-muted` | `213 97% 94%` | ![#e0f2fe](https://via.placeholder.com/15/e0f2fe/e0f2fe.png) `#e0f2fe` | Muted accent |
| `--accent-ring` | `221 83% 53%` | ![#3b82f6](https://via.placeholder.com/15/3b82f6/3b82f6.png) `#3b82f6` | Focus rings |
| `--primary` | `var(--accent)` | ![#3b82f6](https://via.placeholder.com/15/3b82f6/3b82f6.png) `#3b82f6` | Alias to accent |
| `--primary-foreground` | `var(--accent-foreground)` | ![#ffffff](https://via.placeholder.com/15/ffffff/ffffff.png) `#ffffff` | Alias to accent-foreground |
| `--sidebar-accent` | `var(--accent-muted)` | ![#e0f2fe](https://via.placeholder.com/15/e0f2fe/e0f2fe.png) `#e0f2fe` | Sidebar hover |

### Current Values (With Logo)

Based on the current uploaded logo:

| Variable | Value | Color | Usage |
|----------|-------|-------|-------|
| `--accent` | `60 98% 50%` | ![#fcfc03](https://via.placeholder.com/15/fcfc03/fcfc03.png) `#fcfc03` | Bright yellow from logo |
| `--accent-foreground` | `0 0% 0%` | ![#000000](https://via.placeholder.com/15/000000/000000.png) `#000000` | Black text (WCAG AA) |
| `--accent-muted` | `213 97% 94%` | ![#e0f2fe](https://via.placeholder.com/15/e0f2fe/e0f2fe.png) `#e0f2fe` | Default (not updated) |
| `--accent-ring` | `60 98% 50%` | ![#fcfc03](https://via.placeholder.com/15/fcfc03/fcfc03.png) `#fcfc03` | Yellow focus ring |
| `--primary` | `60 98% 50%` | ![#fcfc03](https://via.placeholder.com/15/fcfc03/fcfc03.png) `#fcfc03` | Same as accent |
| `--primary-foreground` | `0 0% 0%` | ![#000000](https://via.placeholder.com/15/000000/000000.png) `#000000` | Same as accent-foreground |
| `--sidebar-accent` | `60 98% 94%` | ![#fefed7](https://via.placeholder.com/15/fefed7/fefed7.png) `#fefed7` | Light yellow (calculated) |
| `--sidebar-accent-foreground` | `0 0% 0%` | ![#000000](https://via.placeholder.com/15/000000/000000.png) `#000000` | Black text |

### Extracted Palette

| HSL | Hex | Foreground | Preview |
|-----|-----|------------|---------|
| `60 98% 50%` | `#fcfc03` | `0 0% 0%` | ![#fcfc03](https://via.placeholder.com/30/fcfc03/fcfc03.png) Bright Yellow ⭐ (Selected) |
| `60 92% 34%` | `#a6a607` | `0 0% 0%` | ![#a6a607](https://via.placeholder.com/30/a6a607/a6a607.png) Dark Yellow |
| `59 70% 28%` | `#797815` | `0 0% 100%` | ![#797815](https://via.placeholder.com/30/797815/797815.png) Olive |
| `60 86% 18%` | `#555506` | `0 0% 100%` | ![#555506](https://via.placeholder.com/30/555506/555506.png) Dark Olive |
| `309 0% 72%` | `#b8b8b8` | `0 0% 0%` | ![#b8b8b8](https://via.placeholder.com/30/b8b8b8/b8b8b8.png) Gray |
| `253 1% 78%` | `#c7c6c7` | `0 0% 0%` | ![#c7c6c7](https://via.placeholder.com/30/c7c6c7/c7c6c7.png) Light Gray |
| `3 0% 66%` | `#a8a8a8` | `0 0% 0%` | ![#a8a8a8](https://via.placeholder.com/30/a8a8a8/a8a8a8.png) Medium Gray |
| `240 40% 0%` | `#000000` | `0 0% 100%` | ![#000000](https://via.placeholder.com/30/000000/000000.png) Black |

---

## 🎯 Usage Examples

### Confirmation Modal

```tsx
<Button className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
  Confirm
</Button>
```

**Resolves to:**
- Background: `hsl(60 98% 50%)` → `#fcfc03` (Bright yellow)
- Text: `hsl(0 0% 0%)` → `#000000` (Black)

### Button Component (Accent Variant)

```tsx
<Button variant="accent">
  Primary Button
</Button>
```

**CSS Applied:**
```css
.button-accent {
  background-color: hsl(var(--accent));           /* 60 98% 50% */
  color: hsl(var(--accent-foreground));           /* 0 0% 0% */
}
```

### Button Component (Outline Variant - Hover)

```tsx
<Button variant="outline">
  Outline Button
</Button>
```

**CSS Applied:**
```css
.button-outline {
  border: 1px solid hsl(var(--input));
  background-color: hsl(var(--background));
}

.button-outline:hover {
  background-color: hsl(var(--sidebar-accent));   /* 60 98% 94% */
  color: hsl(var(--foreground));
}
```

### Sidebar Active Item

```tsx
<SidebarMenuButton isActive={true}>
  Dashboard
</SidebarMenuButton>
```

**CSS Applied:**
```css
.sidebar-menu-button[data-active="true"] {
  background-color: hsl(var(--accent));           /* 60 98% 50% */
  color: hsl(var(--accent-foreground));           /* 0 0% 0% */
}
```

### Sidebar Hover State

```tsx
<SidebarMenuButton>
  Settings
</SidebarMenuButton>
```

**CSS Applied:**
```css
.sidebar-menu-button:hover {
  background-color: hsl(var(--sidebar-accent));   /* 60 98% 94% */
  color: hsl(var(--sidebar-accent-foreground));   /* 0 0% 0% */
}
```

---

## 🔧 WCAG Contrast Calculation

The system automatically calculates WCAG-compliant foreground colors:

```typescript
function contrastForeground(hsl: string): string {
  const lum = relativeLuminance(hsl);
  const contrastWhite = 1.05 / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? '0 0% 100%' : '0 0% 0%';
}
```

**Examples:**
- Bright yellow (`60 98% 50%`) → Black foreground (`0 0% 0%`)
- Dark olive (`60 86% 18%`) → White foreground (`0 0% 100%`)
- Default blue (`221 83% 53%`) → White foreground (`0 0% 100%`)

**Contrast Ratios:**
- Bright yellow + Black: ~19.5:1 (WCAG AAA ✓✓✓)
- Dark olive + White: ~8.2:1 (WCAG AAA ✓✓✓)
- Default blue + White: ~4.6:1 (WCAG AA ✓)

---

## 📝 Summary

### Variable Hierarchy

1. **CSS Custom Properties** (Applied to DOM)
   - `--accent`, `--accent-foreground`, `--accent-muted`, `--accent-ring`
   - `--primary`, `--primary-foreground`, `--ring` (aliases)
   - `--sidebar-primary`, `--sidebar-accent`, `--sidebar-ring` (sidebar-specific)

2. **TypeScript Constants**
   - `DEFAULT_ACCENT_HSL = '221 83% 53%'` (fallback)

3. **Zustand Store** (Client state)
   - `colorScheme.accent_hsl` (from logo extraction)
   - `selectedAccentHsl` (user selection)
   - `accentForeground`, `accentMutedForeground` (calculated)

4. **Database** (Persistent storage)
   - `colorScheme` (JSON with palette)
   - `selectedAccentHsl` (user preference)

### Priority Order

```
selectedAccentHsl (user choice)
  ↓ (if null)
colorScheme.accent_hsl (auto-extracted)
  ↓ (if null)
DEFAULT_ACCENT_HSL (fallback blue)
```

### Muted Accent Calculation

```typescript
// Takes hue and saturation from accent, sets lightness to 94%
const mutedAccent = `${hue} ${saturation} 94%`;

// Example:
// accent: "60 98% 50%" → sidebar-accent: "60 98% 94%"
```

---

## 🎨 Color Format

All colors use **HSL format without commas**:
- ✅ Correct: `60 98% 50%`
- ❌ Wrong: `hsl(60, 98%, 50%)`
- ❌ Wrong: `60, 98%, 50%`

This format is compatible with Tailwind CSS v4 and CSS custom properties.

---

## 🔄 Update Triggers

CSS variables are updated when:
1. **Page load** - RootLayout fetches settings and applies colors
2. **Logo upload** - Server extracts colors, client refetches and applies
3. **Color selection** - User selects from palette, client applies immediately
4. **Logo removal** - Resets to default blue

All updates use `useLayoutEffect` to prevent visual flash.

---

**Last Updated:** 2026-03-13  
**Current Logo:** Enriqueta Montilla de Esteban Memorial High School  
**Current Accent:** `60 98% 50%` (Bright Yellow #fcfc03)  
**Contrast:** Black text on yellow background (19.5:1 ratio - WCAG AAA)
