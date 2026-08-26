export interface Palette {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  primary: string;
  primaryMuted: string;
  danger: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  done: string;
}

export const darkPalette: Palette = {
  background: '#0B0E11',
  surface: '#1B2129',
  surfaceAlt: '#242C36',
  border: '#3A4452',
  primary: '#3DDC97',
  primaryMuted: '#1F5A46',
  danger: '#FF6B6B',
  textPrimary: '#F5F7FA',
  textSecondary: '#C3CBD6',
  textMuted: '#8891A0',
  done: '#4A5568',
};

export const lightPalette: Palette = {
  background: '#F3F5F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4F8',
  border: '#E1E6EC',
  primary: '#189A66',
  primaryMuted: '#D6F5E7',
  danger: '#D92D2D',
  textPrimary: '#12161C',
  textSecondary: '#4B5768',
  textMuted: '#8A94A3',
  done: '#E4E8ED',
};
