---
name: AutoGuardian Clean Trust / Mobile Standard
colors:
  background: '#ffffff'
  primary: '#142b4a'
  accent: '#f4c542'
  on-primary: '#ffffff'
  on-accent: '#142b4a'
  text: '#172033'
  text-muted: '#536174'
  surface: '#f5f7fa'
  surface-card: '#ffffff'
  border: '#d6dce5'
  border-subtle: '#e5e9f0'
  success: '#166534'
  success-bg: '#f0fdf4'
  danger: '#b42318'
  danger-bg: '#fef3f2'
  warning: '#7a4c00'
  warning-bg: '#fffbeb'
  status-enrolled: '#1e3a8a'
  surface-dim: '#cddbf2'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dbe9ff'
  surface-container-highest: '#d5e4fa'
  on-surface: '#0e1c2d'
  on-surface-variant: '#44474e'
  inverse-surface: '#233142'
  inverse-on-surface: '#eaf1ff'
  outline: '#74777e'
  outline-variant: '#c4c6ce'
  surface-tint: '#4a5f81'
  primary-container: '#142b4a'
  on-primary-container: '#7d93b7'
  inverse-primary: '#b2c7ee'
  secondary: '#765b00'
  on-secondary: '#ffffff'
  secondary-container: '#fece4b'
  on-secondary-container: '#725800'
  tertiary: '#231300'
  on-tertiary: '#ffffff'
  tertiary-container: '#3f2500'
  on-tertiary-container: '#b38b5b'
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
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ecbf8a'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#5f4117'
  on-background: '#0e1c2d'
  surface-variant: '#d5e4fa'
typography:
  font-family: Public Sans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
  headline-lg: 24px / 32px, bold
  headline-md: 20px / 28px, bold
  headline-sm: 18px / 24px, 600
  body-lg: 16px / 24px, 400
  body-md: 14px / 20px, 400
  body-sm: 13px / 18px, 400
  label-md: 14px / 20px, 600
  label-sm: 12px / 16px, 600
shapes:
  corner: rounded-lg (8px)
  input: rounded-md (6px), 48px touch height
  button: rounded-md (6px), 48px touch height
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

# AutoGuardian Clean Trust Design System

## Principles
1. **Calm, Legible, Honest:** Avoid bureaucratic legal jargon, pseudo-statutes, and hyperbolic security stamps. State verified workflow facts plainly.
2. **Strict English-First (Clean Separation):** No bilingual mixed text in a single screen. UI labels in clean sentence case.
3. **Touch First (390px Mobile Portrait):** Minimum 48px touch targets, comfortable line heights, clear visual separation without excessive nested borders.
4. **Role Integrity:** Verifiers, Owners, Agents, and Institutional actors share a single cohesive React Native mobile app with authenticated role-scoped navigation and strict action gating.