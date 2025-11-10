import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationLightTheme, Theme } from '@react-navigation/native';

import { palette } from '@/theme';

const shared = {
  colors: {
    primary: palette.brandPrimary,
    card: palette.surface,
    border: palette.border,
    notification: palette.brandSecondary,
  },
};

export const lightNavigationTheme: Theme = {
  ...NavigationLightTheme,
  dark: false,
  colors: {
    ...NavigationLightTheme.colors,
    ...shared.colors,
    background: '#FFFFFF',
    text: '#111827',
  },
};

export const darkNavigationTheme: Theme = {
  ...NavigationDarkTheme,
  dark: true,
  colors: {
    ...NavigationDarkTheme.colors,
    ...shared.colors,
    background: palette.background,
    text: palette.textPrimary,
  },
};
