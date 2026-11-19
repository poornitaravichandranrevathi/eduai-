---
name: EduSphere AI
colors:
  surface: '#0f131d'
  surface-dim: '#0f131d'
  surface-bright: '#353944'
  surface-container-lowest: '#0a0e18'
  surface-container-low: '#171b26'
  surface-container: '#1c1f2a'
  surface-container-high: '#262a35'
  surface-container-highest: '#313540'
  on-surface: '#dfe2f1'
  on-surface-variant: '#ccc3d8'
  inverse-surface: '#dfe2f1'
  inverse-on-surface: '#2c303b'
  outline: '#958da1'
  outline-variant: '#4a4455'
  surface-tint: '#d2bbff'
  primary: '#d2bbff'
  on-primary: '#3f008e'
  primary-container: '#7c3aed'
  on-primary-container: '#ede0ff'
  inverse-primary: '#732ee4'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#007184'
  on-tertiary-container: '#b7efff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#eaddff'
  primary-fixed-dim: '#d2bbff'
  on-primary-fixed: '#25005a'
  on-primary-fixed-variant: '#5a00c6'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#0f131d'
  on-background: '#dfe2f1'
  surface-variant: '#313540'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  gutter-lg: 2rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style
The design system positions itself as an intelligent, focused, and deeply empowering academic copilot. It merges the gravitas of institutional academia with the frictionless velocity of cutting-edge artificial intelligence. 

The aesthetic is Modern Technical Glassmorphism layered over Deep Navy Canvas. It prioritizes extreme legibility under sustained cognitive strain (late-night research, thesis structuring, active recall study), while utilizing luminous indigo, violet, and electric cyan accents to highlight breakthroughs, completion states, and AI suggestions. The interface feels weightless yet deliberate, eschewing distracting skeuomorphic clutter in favor of crisp boundary delineation, translucent dark surfaces, and razor-sharp typographic hierarchy.

## Colors
The palette leverages a deep nocturnal canvas to minimize eye fatigue during intensive study sessions, balanced by high-energy bioluminescent accents.

- **Background & Canvas (`#0B0F19`)**: Base deep navy space for the underlying viewport.
- **Surface & Containers (`#111827`)**: Primary elevated card layer, configured with subtle alpha blending (`rgba(17, 24, 39, 0.75)`) when paired with backdrop filters.
- **Primary Violet Accent (`#7C3AED`)**: Core brand anchor, primary action items, AI inference triggers, and highlighted interactive pathways.
- **Secondary Indigo Accent (`#6366F1`)**: Secondary hierarchy, academic tracking timelines, focused state outlines, and interactive hover shifts.
- **Tertiary Cyan Highlight (`#06B6D4`)**: Key performance metrics, GPA trackers, real-time AI status pills, and active verification markers.
- **Neutrals & Text**: Pure white (`#FFFFFF`) for primary headings, slate blue (`#94A3B8`) for secondary body and metadata, and muted deep border tone (`#1E293B`) for low-contrast containment lines.

## Typography
Typographic rhythm combines the geometric precision of **Plus Jakarta Sans** for structural elements and titles with the utilitarian legibility of **Inter** for dense contextual copy, research citations, and telemetry labels.

All large heading tokens automatically clamp into their `-mobile` equivalents below the 768px threshold to prevent awkward word wrapping in multi-syllable academic terminology. Academic metadata, code snippets, and metric counters should employ monospace numbers (tabular figures) using font feature settings (`tnum`).

## Layout & Spacing
The layout follows a fluid-responsive 12-column grid on desktop screens, transitioning to an 8-column layout on tablets and a 4-column stack on mobile devices.

- **Breakpoints**: 
  - Mobile: `< 768px` (Fluid 4-column, margins `1rem`, gutters `1rem`)
  - Tablet: `768px – 1023px` (Fluid 8-column, margins `2rem`, gutters `1.5rem`)
  - Desktop: `≥ 1024px` (12-column with a maximum bounded container width of `1360px`, margins `3rem`, gutters `2rem`)

Vertical pacing adheres strictly to multiples of `0.5rem` (8px base). Metric grids, syllabus timelines, and AI generation stream views use `space-md` gaps on mobile, scaling to `space-lg` across desktop configurations to ensure expansive breathing room without fragmenting visual grouping.

## Elevation & Depth
Depth is articulated primarily through translucent surface containment, hairline luminescence, and colored ambient diffusion rather than harsh drop shadows.

- **Base Layer (Canvas)**: Solid `#0B0F19`. Zero elevation.
- **Layer 1 (Card & Module Containers)**: Background color of `rgba(17, 24, 39, 0.72)` combined with a `16px` backdrop-filter blur. Outlined by a crisp `1px` stroke of `rgba(255, 255, 255, 0.08)`.
- **Layer 2 (Floating Popovers, Prompts, Metrics Drawers)**: Background `rgba(30, 41, 59, 0.85)` with `24px` backdrop blur, a top hairline border of `rgba(124, 58, 237, 0.35)` to create an illuminated top edge, and an ambient tinted drop shadow: `0 12px 32px -4px rgba(0, 0, 0, 0.5), 0 0 24px -2px rgba(99, 102, 241, 0.15)`.
- **Layer 3 (Active Focus / Tooltip Overlays)**: Border illumination increases to `rgba(6, 182, 212, 0.6)` with an inner glow of `inset 0 0 8px rgba(6, 182, 212, 0.1)`.

## Shapes
A balanced medium roundedness approach (`roundedness: 2`) gives the system an approachable yet controlled technical edge. 

- **Cards, Modules, Input Fields**: `0.5rem` (8px). Matches the foundational structural units.
- **Large Panels, Modal Surfaces**: `rounded-lg` (`1rem` / 16px) to gracefully soften macro containers.
- **Hero Containers, Floating AI Command Bars**: `rounded-xl` (`1.5rem` / 24px).
- **Status Badges, Chips, Quick-Action Pills**: Fully rounded pill shapes (`9999px`) are maintained for categorical pills and status badges to clearly isolate them from rectangular content grids.

## Components

### Buttons
- **Primary (AI / Action)**: Solid gradient fill from `#7C3AED` to `#6366F1`, white label text, subtle ambient indigo shadow (`0 4px 14px rgba(99, 102, 241, 0.4)`). On hover, scales slightly (`scale-[1.02]`) with enhanced saturation.
- **Secondary (Structural)**: Background `rgba(255, 255, 255, 0.05)`, border `1px solid rgba(255, 255, 255, 0.12)`, text `#FFFFFF`. Hover reveals `rgba(255, 255, 255, 0.1)`.
- **Tertiary / Ghost**: Transparent fill, text `#94A3B8`, text transition to `#06B6D4` on hover.

### Badges & Academic Status Indicators
- Always pill-shaped (`9999px`), `space-xs` vertical padding by `space-sm` horizontal padding.
- **AI Active**: Background `rgba(6, 182, 212, 0.12)`, text `#06B6D4`, bordered by `1px solid rgba(6, 182, 212, 0.3)`. Accompanied by a pulsing 6px cyan status circle.
- **Course Status**: Indigo muted pill (`rgba(99, 102, 241, 0.12)` background, `#818CF8` text).

### Metric Cards
- Background `rgba(17, 24, 39, 0.75)`, 1px subtle top highlight gradient stroke, `space-lg` internal padding.
- Emphasizes single-glance cognitive read: displays an uppercase `label-sm` category descriptor at the top, a prominent `headline-lg` numeric value with tabular figures in cyan or bright white, and a sparkline or progress delta indicator at the footer.

### Input Fields & Search Bars
- Background `rgba(15, 23, 42, 0.65)`, border `1px solid rgba(255, 255, 255, 0.1)`. Font `body-md`.
- Focus states transition borders instantly to `#7C3AED` with an outer ring blur: `0 0 0 3px rgba(124, 58, 237, 0.25)`. Includes embedded keyboard shortcuts (`⌘K`) in muted slate pills.

### Cards & Content Lists
- Grouped list rows employ dividing strokes using `rgba(255, 255, 255, 0.06)`. Hovering a row triggers a subtle transition to `rgba(255, 255, 255, 0.03)` with no layout shift.
- Expandable research note cards deploy a glassmorphic layer stack with crisp micro-interactions on tap/click.