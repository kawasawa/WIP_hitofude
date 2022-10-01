import 'react-toastify/dist/ReactToastify.css';

import { createTheme, CssBaseline, PaletteMode, ThemeProvider, useMediaQuery } from '@mui/material';
import i18n from 'i18next';
import React, { useEffect, useMemo, useState } from 'react';
import { initReactI18next } from 'react-i18next';
import { ToastContainer } from 'react-toastify';

import { AppContext } from './contexts';
import { SettingsKeys, Theme } from './enums';
import jaJson from './locales/ja.json';
import { Top } from './Pages/Top';

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: jaJson },
  },
  lng: 'ja',
  fallbackLng: 'ja',
});

const App = () => {
  const isSystemColorDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [paletteMode, setPaletteMode] = useState<PaletteMode>(isSystemColorDark ? 'dark' : 'light');
  const [theme, setTheme] = useState<Theme>((localStorage.getItem(SettingsKeys.theme) as Theme) ?? Theme.system);

  const appTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: paletteMode,
        },
        typography: {
          button: {
            textTransform: 'none',
          },
        },
      }),
    [paletteMode]
  );

  useEffect(() => {
    switch (theme) {
      case Theme.light:
        setPaletteMode('light');
        break;
      case Theme.dark:
        setPaletteMode('dark');
        break;
      case Theme.system:
        // システムカラーに追従させる
        setPaletteMode(isSystemColorDark ? 'dark' : 'light');
        break;
    }
  }, [theme, isSystemColorDark]);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppContext.Provider value={{ paletteMode, theme, setTheme }}>
        <Top />
      </AppContext.Provider>
      <ToastContainer
        draggable={false}
        closeButton={false}
        autoClose={5000}
        theme={paletteMode}
        position="bottom-right"
      />
    </ThemeProvider>
  );
};

export default App;
