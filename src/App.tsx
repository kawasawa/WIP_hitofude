import 'react-toastify/dist/ReactToastify.css';

import MonacoEditor from '@monaco-editor/react';
import { Save as SaveIcon, Timer as TimerIcon } from '@mui/icons-material';
import {
  Box,
  createTheme,
  Divider,
  Fab,
  LinearProgress,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  PaletteMode,
  ThemeProvider,
  useMediaQuery,
} from '@mui/material';
import { Turn as Hamburger } from 'hamburger-react';
import i18n from 'i18next';
import MonacoEditorApi from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import { toast } from 'react-toastify';

import jaJson from './locales/ja.json';

i18n.use(initReactI18next).init({
  resources: {
    ja: { translation: jaJson },
  },
  lng: 'ja',
  fallbackLng: 'ja',
});

const settingsKeys = {
  text: 'text',
  language: 'language',
  isAutoSave: 'isAutoSave',
  autoSaveInterval: 'autoSaveInterval',
};
type settingsKeys = typeof settingsKeys[keyof typeof settingsKeys];
type EditorLanguage = 'plaintext' | 'json' | 'markdown' | 'yaml';

const App = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null);
  const [t] = useTranslation();
  const isSystemColorDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [theme, setTheme] = useState<PaletteMode>(isSystemColorDark ? 'dark' : 'light');
  const [language, setLanguage] = useState<EditorLanguage>('plaintext');
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isAutoSave, setIsAutoSave] = useState<boolean>(true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(10000);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>();

  const appTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
        },
        typography: {
          button: {
            textTransform: 'none',
          },
        },
      }),
    [theme]
  );

  const save = useCallback(() => {
    if (!editorRef.current || !isDirty) return;
    localStorage.setItem(settingsKeys.text, editorRef.current.getValue());
    setIsDirty(false);
    clearTimeout(autoSaveTimer);
    toast.info(t('message.notify__save--succeeded'));
  }, [isDirty, autoSaveTimer, t]);

  const switchAutoSave = useCallback(() => {
    if (!editorRef.current) return;
    const newIsAutoSave = !isAutoSave;
    setIsAutoSave(newIsAutoSave);
    localStorage.setItem(settingsKeys.isAutoSave, newIsAutoSave ? 'true' : 'false');
  }, [isAutoSave]);

  const onEditorMount = useCallback((editor: MonacoEditorApi.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editorRef.current.setValue(localStorage.getItem(settingsKeys.text));
  }, []);

  const onEditorChange = useCallback(() => {
    // 最後の編集時点から計測して指定の時間後に保存する
    setIsDirty(true);
    if (isAutoSave) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(setTimeout(save, autoSaveInterval));
    }
  }, [isAutoSave, autoSaveInterval, autoSaveTimer, save]);

  const onMenuOpen = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const onMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  useEffect(() => {
    setLanguage((localStorage.getItem(settingsKeys.language) as EditorLanguage) ?? language);
    setIsAutoSave(localStorage.getItem(settingsKeys.isAutoSave)?.toLowerCase() === 'false' ? false : true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // システムカラーに追従させる
    setTheme(isSystemColorDark ? 'dark' : 'light');
  }, [isSystemColorDark]);

  return (
    <ThemeProvider theme={appTheme}>
      <MonacoEditor
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        language={language}
        height="100vh"
        options={{ fontSize: 14, minimap: { enabled: false } }}
        loading={<LinearProgress color="inherit" sx={{ width: '80%' }} />}
        onMount={onEditorMount}
        onChange={onEditorChange}
      />

      <Box sx={{ position: 'fixed', left: 10, bottom: 10, zIndex: 1, opacity: 0.75 }}>
        <Fab onClick={onMenuOpen}>
          <Hamburger toggled={!!anchorEl} />
        </Fab>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={onMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <MenuItem
          disabled={!isDirty}
          onClick={() => {
            save();
            onMenuClose();
          }}
        >
          <ListItemIcon>
            <SaveIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__save')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          selected={isAutoSave}
          onClick={() => {
            switchAutoSave();
            onMenuClose();
          }}
        >
          <ListItemIcon>
            <TimerIcon />
          </ListItemIcon>
          <ListItemText>
            {t('label.menu__isAutoSave')}
            {'\u00A0'}({1000 < autoSaveInterval ? autoSaveInterval / 1000 : autoSaveInterval}
            {1000 < autoSaveInterval ? 's' : 'ms'})
          </ListItemText>
        </MenuItem>
      </Menu>

      <ToastContainer draggable={false} closeButton={false} autoClose={5000} theme={theme} position="bottom-right" />
    </ThemeProvider>
  );
};

export default App;
