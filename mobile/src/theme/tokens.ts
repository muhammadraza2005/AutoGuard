// Canonical tokens: Clean Trust DESIGN.md + root frontend.md.
export const colors = {
  background: '#FFFFFF',
  primary: '#142B4A',
  accent: '#F4C542',
  text: '#172033',
  textMuted: '#536174',
  surface: '#F5F7FA',
  border: '#D6DCE5',
  success: '#166534',
  successBackground: '#F0FDF4',
  danger: '#B42318',
  dangerBackground: '#FEF3F2',
  warning: '#7A4C00',
  warningBackground: '#FFFBEB',
} as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { input: 6, button: 6, card: 8 } as const;
export const typography = {
  heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  subheading: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
} as const;
// Use the platform font until Gemini supplies and verifies a bundled Public Sans font.

