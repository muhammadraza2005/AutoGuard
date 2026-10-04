---
name: Civic Trust / Kinetic Shield
colors:
  surface: '#f9f9ff'
  surface-dim: '#d1daf4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8ff'
  surface-container-highest: '#d9e2fc'
  on-surface: '#121b2e'
  on-surface-variant: '#44474e'
  inverse-surface: '#273044'
  inverse-on-surface: '#edf0ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4a5f81'
  primary: '#001632'
  on-primary: '#ffffff'
  primary-container: '#142b4a'
  on-primary-container: '#7d93b7'
  inverse-primary: '#b2c7ee'
  secondary: '#765b00'
  on-secondary: '#ffffff'
  secondary-container: '#fece4b'
  on-secondary-container: '#725800'
  tertiary: '#081727'
  on-tertiary: '#ffffff'
  tertiary-container: '#1e2c3d'
  on-tertiary-container: '#8593a8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#b2c7ee'
  on-primary-fixed: '#021c3a'
  on-primary-fixed-variant: '#324768'
  secondary-fixed: '#ffdf94'
  secondary-fixed-dim: '#efc13e'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#594400'
  tertiary-fixed: '#d5e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0e1c2d'
  on-tertiary-fixed-variant: '#3a485a'
  background: '#f9f9ff'
  on-background: '#121b2e'
  surface-variant: '#d9e2fc'
  surface-canvas: '#FFFFFF'
  surface-neutral: '#F5F7FA'
  border-subtle: '#D6DCE5'
  status-success: '#166534'
  status-danger: '#B42318'
  status-warning: '#7A4C00'
typography:
  headline-xl:
    fontFamily: Public Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Public Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Public Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Public Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Public Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.04em
  data-mono:
    fontFamily: Public Sans
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-assurance, civic-grade interface built for the automotive resale validation ecosystem in the Democratic Republic of the Congo, anchored primarily in Kinshasa. The visual tone must instantly convey state-level legitimacy, legal finality, and non-negotiable security. The audience spans private vehicle buyers, street-level field inspection agents operating in harsh sunlight, financial institutions, and municipal administrative bodies. 

The aesthetic is purely **Modern Institutional**: rigorous, restrained, and anti-ornamental. It repudiates decorative consumer patterns (such as frosted glass, decorative gradients, skeuomorphic leather, or oversized pill buttons) in favor of high-contrast planar structures, functional hairline borders, and strict spatial utility. The interface is optimized to perform flawlessly on low-tier Android displays under intense tropical daylight glare, instilling calm confidence during high-stakes financial and legal transactions.

## Colors

The color system functions on crisp polarity to ensure uncompromised legibility in bright sunlight and on low-gamut LCD screens. Light mode is the default and standard operational baseline.

- **Primary (`#142B4A`)**: A deep, commanding ministerial navy. Applied to top navigation app bars, dominant actions, high-level headers, and key identification numbers.
- **Secondary (`#F4C542`)**: A saturated trust gold/yellow. Strictly reserved for active verification states, primary attention focal points, dynamic security QR borders, and high-visibility interaction triggers. Typography placed on this yellow is required to be the Primary Navy (`#142B4A`) for absolute contrast compliance.
- **Tertiary (`#536174`)**: A balanced, cool slate gray for secondary labels, metadata captions, inactive step indicators, and framing lines.
- **Neutral (`#172033`)**: Deep obsidian-slate for standard body copy, field values, and core readable text. Never pure black, avoiding visual vibration on pure white surfaces.

### Semantic & Functional Palette
- **Canvas Base (`#FFFFFF`)**: Pure crisp white for all main page views and active entry cards.
- **Surface Fill (`#F5F7FA`)**: Light institutional off-white used for field inputs, nested data sections, read-only audit modules, and grouped parameter lists.
- **Dividers & Strokes (`#D6DCE5`)**: 1px structural hairline border for clean data separation without rendering heavy raster shadows.
- **Feedback Spectrum**:
  - `status-success` (`#166534`): Confirmed clear titles, legitimate seals, and completed identity checks.
  - `status-danger` (`#B42318`): Stolen flags, invalid chassis numbers, failed checks, and permanent purge actions.
  - `status-warning` (`#7A4C00`): Incomplete transfers, pending agent verifications, and regulatory discrepancies.

## Typography

The type architecture relies exclusively on **Public Sans**, an open, sturdy neo-grotesque developed specifically for civic and governmental interfaces. Its open apertures, distinct glyph definitions, and solid stem weights maintain razor-sharp legibility even on low-cost TN/IPS phone panels.

### Internationalization & French Text Expansion
All layout nodes are engineered for bilingual parity (French and English). French administrative and legal terminologies consistently require between 20% and 35% more horizontal width than their English equivalents (e.g., "Verified" becomes "Vérifié avec succès"). 
- Never truncate critical status markers or legal disclaimers with ellipsis (`...`). 
- Containers must scale vertically to house wrapping labels naturally.
- Explicit label and button heights must be defined as `min-height: 48px` rather than static heights, allowing multiple lines of clear, non-overlapping text when localized.
- VIN numbers, national ID records, and engine codes use `data-mono` styling with explicit letter-spacing to prevent visual confusion between characters like `0`/`O` and `1`/`I`.

## Layout & Spacing

The system is engineered strictly around a **portrait 390px mobile baseline** as the master operational viewport. It employs a rigid 8pt spatial cadence (with 4pt sub-increments for fine component alignment).

### Layout Geometry
- **Outer Canvas Margins**: Uniform `1rem` (16px) gutter on mobile edges, preserving maximum active screen real estate while protecting against touch interference from low-end edge-case bezels.
- **Section Rhythm**: A standard gap of `1.5rem` (24px) separates logical verification modules (e.g., identity section vs. mechanical report).
- **Physical Touch Target Rule**: Every interactive hit-box—regardless of visual padding—must resolve to at least **48 × 48 physical logical pixels**. This is mandatory for field workers wearing utility gear or inspecting engine bays.
- **Single-Column Stacking**: Multi-column form layouts are strictly barred on mobile. All data attributes, input fields, and action sequences cascade sequentially in a single vertical stack to prevent horizontal panning or accidental mis-taps.

## Elevation & Depth

To preserve rendering performance on entry-level Android devices (Android 8.0+) and avoid battery depletion under prolonged outdoor use, visual depth is expressed through **tactile structural outlines and tonal surface shifts** rather than blur-heavy raster shadows.

- **Level 0 (Base Canvas)**: Pure White (`#FFFFFF`). The flat canvas upon which cards and forms sit.
- **Level 1 (Inset & Group Surfaces)**: Pale Neutral Surface (`#F5F7FA`) bounded by a 1px solid `#D6DCE5` hairline border. Used for segmented sections, list containers, and vehicle spec boxes.
- **Level 2 (Interactive Floating Modules & Modals)**: Surface White (`#FFFFFF`) with a 1.5px solid Navy border (`#142B4A`) paired with a minimal, zero-blur hard offset shadow: `box-shadow: 0 2px 4px rgba(20, 43, 74, 0.08)`.
- **Level 3 (Overlays & Viewfinders)**: Modal backdrops, PIN confirmation sheets, and camera scanning reticles utilize a solid `rgba(20, 43, 74, 0.72)` dim layer, deliberately using the primary brand navy rather than flat neutral black to maintain institutional identity. Glassmorphism and backdrop-filter blurs are completely forbidden.

## Shapes

The design system enforces a **Soft-Structured (Level 1)** geometric language. Rounding is deliberate, modest, and functional, reinforcing the visual impression of stamped certificates, legal placards, and metal license plates.

- **Core Elements (Buttons, Inputs, Badges)**: Fixed `0.25rem` (4px) corner radius. This prevents the interface from feeling playful or informal while avoiding sharp, unstyled corners.
- **Containers & Cards (`rounded-lg`)**: `0.5rem` (8px) radius on grouping modules, dynamic QR frames, and bottom sheets.
- **System Exception**: Status dot pills and camera scan viewfinders may employ strict circle tokens (`rounded-full`), but standard interactive buttons must never use pill forms.

## Components

### Buttons
- **Primary Action**: Solid Navy background (`#142B4A`) with pure white text (`#FFFFFF`), `font-weight: 600`, 4px radius, `min-height: 48px`, and `padding: 12px 16px`. Focus state displays a 2px outer outline of Yellow (`#F4C542`).
- **Accent Action**: Solid Yellow background (`#F4C542`) with primary navy text (`#142B4A`). Used for the singular primary workflow action (e.g., "Confirm Transfer" / "Valider la transaction").
- **Secondary Action**: White surface with a 1.5px border in `#142B4A` and navy text.
- **Destructive Action**: Transparent or light red background (`rgba(180, 35, 24, 0.08)`) with deep crimson text (`#B42318`) and border.
- **Icon Requirement**: All button labels must be paired with an unambiguous text label. Pure icon buttons are strictly prohibited for actionable commands.

### Role Badges
Distinct, high-contrast indicators that denote user operational authority:
- **Consumer**: Neutral slate fill (`#F5F7FA`), `#536174` text, border `#D6DCE5`.
- **Field Agent**: Light amber background, deep gold text (`#7A4C00`), solid 1px border.
- **Institutional / Bank**: Crisp light blue tint, solid Navy (`#142B4A`) text and border.
- **Administration**: Primary navy fill (`#142B4A`) with white text and gold left indicator dot.

### Form Inputs & Fields
- **Container**: `min-height: 48px`, `#F5F7FA` surface fill with 1px solid `#D6DCE5` border.
- **Typography**: Text input rendered in `#172033` at 16px (to prevent auto-zoom on mobile web browsers).
- **Labels & Hints**: Permanent top-aligned labels in `label-md` (`#536174`). Never rely on floating placeholders that disappear on typing.
- **Focused State**: White background, 2px border in Navy (`#142B4A`).

### Cards & Vehicle Status Containers
- **Structural Blueprint**: White surface card with a 1px border `#D6DCE5`. The header contains an official state badge and date stamp, followed by prominent VIN/chassis identification.
- **Status State Header**: 4px vertical accent bar on the left edge denoting vehicle state:
  - Green (`#166534`) for cleared, non-stolen, legally sealed vehicles.
  - Red (`#B42318`) for flagged, impounded, or disputed vehicles.
  - Gold (`#F4C542`) for ongoing ownership transfer audits.

### Lists & Audit Rows
- Segmented data pairs (e.g., "Chassis Number", "Engine Block Code", "Plate Series") use alternating zebra-stripe cards or thin hairlines (`1px solid #D6DCE5`).
- Keys are left-aligned in `textMuted` (`#536174`), while verified values sit right-aligned in `data-mono` (`#172033`).

### Checkboxes & Radio Controls
- Minimum bounding box of 48px hit-area containing a 20 × 20px geometric box with a 2px solid border (`#142B4A`). Active checkboxes display an authoritative white check glyph over a solid navy fill.