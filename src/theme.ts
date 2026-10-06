import { useColorScheme } from 'react-native';

// Values mirror replica/design/tokens.json and tokens-dark.json.
const light = {
  bg: '#f7f6f2', surface: '#ffffff', border: '#e4e1d8', borderInput: '#7d7a70',
  text: '#1b1d1a', textMuted: '#5c5f57', accent: '#0e6b4f', onAccent: '#ffffff',
  danger: '#b42323', success: '#17703f', warning: '#8a5a00', track: '#ecebe4',
};
const dark: typeof light = {
  bg: '#111311', surface: '#1c1f1c', border: '#2e322e', borderInput: '#8a8f87',
  text: '#eef0ea', textMuted: '#a6aba1', accent: '#4cc59a', onAccent: '#06281c',
  danger: '#ff7a72', success: '#5fd28c', warning: '#f0b44c', track: '#2a2e2a',
};

export type Colors = typeof light;

export const space = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;
export const radius = { sm: 6, md: 10, lg: 16, pill: 999 } as const;
export const type = {
  xs: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  sm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  base: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  xl: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  display: { fontSize: 40, lineHeight: 44, fontWeight: '700' as const },
};

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
