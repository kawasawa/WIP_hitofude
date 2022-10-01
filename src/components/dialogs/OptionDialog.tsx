import {
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Settings as SettingsIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import {
  AppBar,
  Box,
  Container,
  Dialog,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Slide,
  SlideProps,
  Stack,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NumericFormat } from 'react-number-format';
import { NumberFormatValues } from 'react-number-format/types/types';

import { AppContext, EditorContext } from '../../contexts';
import { LanguageMode, SettingsKeys, Theme } from '../../enums';
import { convertToString } from '../../utils';

export type OptionDialogProps = {
  open: boolean;
  closeAction: { (): void };
};

const Transition = React.forwardRef(function _(
  props: SlideProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} direction="up" {...props} />;
});

export const OptionDialog = (props: OptionDialogProps) => {
  const appContext = useContext(AppContext);
  const editorContext = useContext(EditorContext);

  const [t] = useTranslation();
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));

  const onChangeThemeMode = useCallback(
    (event: React.MouseEvent<HTMLElement>, newValue: string) => {
      localStorage.setItem(SettingsKeys.theme, newValue);
      appContext?.setTheme(newValue);
    },
    [appContext]
  );
  const isAllowFontSize = useCallback((values: NumberFormatValues) => {
    if (!values.floatValue) return false;
    if (values.floatValue < 1 || 99 < values.floatValue) return false;
    return true;
  }, []);
  const onChangeFontSize = useCallback(
    (values: NumberFormatValues) => {
      if (values.floatValue) {
        localStorage.setItem(SettingsKeys.fontSize, values.floatValue.toString());
        editorContext?.setFontSize(values.floatValue);
      }
    },
    [editorContext]
  );
  const onChangeLineNumber = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.lineNumber, convertToString(event.target.checked));
      editorContext?.setLineNumber(event.target.checked);
    },
    [editorContext]
  );
  const onChangeMinimap = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.minimap, convertToString(event.target.checked));
      editorContext?.setMinimap(event.target.checked);
    },
    [editorContext]
  );
  const onChangeLineHighlight = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.lineHighlight, convertToString(event.target.checked));
      editorContext?.setLineHighlight(event.target.checked);
    },
    [editorContext]
  );
  const onChangeBracketPairsHighlight = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.bracketPairsHighlight, convertToString(event.target.checked));
      editorContext?.setBracketPairsHighlight(event.target.checked);
    },
    [editorContext]
  );
  const onChangeValidation = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.validation, convertToString(event.target.checked));
      editorContext?.setValidation(event.target.checked);
    },
    [editorContext]
  );
  const onChangeWordWrap = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.wordWrap, convertToString(event.target.checked));
      editorContext?.setWordWrap(event.target.checked);
    },
    [editorContext]
  );
  const onChangeAutoSave = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      localStorage.setItem(SettingsKeys.autoSave, convertToString(event.target.checked));
      editorContext?.setAutoSave(event.target.checked);
    },
    [editorContext]
  );
  const onChangeLanguageMode = useCallback(
    (event: SelectChangeEvent) => {
      localStorage.setItem(SettingsKeys.languageMode, event.target.value as string);
      editorContext?.setLanguageMode(event.target.value as string);
    },
    [editorContext]
  );
  const isAllowAutoSaveDelay = useCallback((values: NumberFormatValues) => {
    if (!values.floatValue) return false;
    if (values.floatValue < 1 || 999 < values.floatValue) return false;
    return true;
  }, []);
  const onChangeAutoSaveDelay = useCallback(
    (values: NumberFormatValues) => {
      if (values.floatValue) {
        localStorage.setItem(SettingsKeys.autoSaveDelay, values.floatValue.toString());
        editorContext?.setAutoSaveDelay(values.floatValue);
      }
    },
    [editorContext]
  );

  const handleClose = useCallback(() => props.closeAction && props.closeAction(), [props]);

  useEffect(() => {
    if (props.open) {
      // ダイアログを開く際にスクロール位置を先頭に戻す
      const scrollDiv = document.getElementsByClassName('MuiDialog-paperScrollPaper')[0] as HTMLDivElement;
      if (scrollDiv) scrollDiv.scrollTop = 0;
    }
  }, [props.open]);

  return (
    <Dialog
      open={props.open}
      TransitionComponent={Transition}
      onClose={handleClose}
      keepMounted
      maxWidth={false}
      fullWidth={!isXs}
      fullScreen={isXs}
      sx={isXs ? { maxHeight: '85vh', mt: '15vh' } : null}
    >
      <AppBar sx={{ position: 'sticky' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <SettingsIcon />
            <Typography sx={{ display: 'flex', p: 1 }} variant="h6" component="div">
              {t('label.menu__option')}
            </Typography>
            <Box sx={{ display: 'flex', flexGrow: 1 }} />
            <IconButton sx={{ display: 'flex' }} onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <Container sx={{ pt: 5, pb: 10 }}>
        <Stack>
          <FormControl sx={{ mb: 2 }}>
            <Typography fontSize={13} color="text.secondary" gutterBottom>
              {t('label.option__theme')}
            </Typography>
            <ToggleButtonGroup value={appContext?.theme} onChange={onChangeThemeMode} color="primary" exclusive>
              {Object.keys(Theme).map((theme) => (
                <ToggleButton key={`option__theme--${theme}`} value={theme}>
                  {theme === Theme.light ? <LightModeIcon /> : theme === Theme.dark ? <DarkModeIcon /> : <SyncIcon />}
                  <Typography sx={{ ml: 0.5 }}>{theme}</Typography>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </FormControl>
          <FormControl sx={{ my: 1 }}>
            <InputLabel>{t('label.option__languageMode')}</InputLabel>
            <Select
              label={t('label.option__languageMode')}
              value={editorContext?.languageMode}
              onChange={onChangeLanguageMode}
            >
              {Object.entries(LanguageMode).map(([lang, name]) => (
                <MenuItem key={`option__editorLanguage--${lang}`} value={lang}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ my: 1 }}>
            <NumericFormat
              label={t('label.option__fontSize')}
              value={editorContext?.fontSize}
              customInput={TextField}
              isAllowed={isAllowFontSize}
              onValueChange={onChangeFontSize}
            />
          </FormControl>
          <Stack sx={{ border: 1, borderRadius: 1, borderColor: 'grey.600', p: 2, mt: 2 }}>
            <FormControlLabel
              label={t('label.option__lineNumber')}
              control={<Switch checked={editorContext?.lineNumber} onChange={onChangeLineNumber} />}
            />
            <FormControlLabel
              label={t('label.option__minimap')}
              control={<Switch checked={editorContext?.minimap} onChange={onChangeMinimap} />}
            />
            <FormControlLabel
              label={t('label.option__lineHighlight')}
              control={<Switch checked={editorContext?.lineHighlight} onChange={onChangeLineHighlight} />}
            />
            <FormControlLabel
              label={t('label.option__bracketPairsHighlight')}
              control={
                <Switch checked={editorContext?.bracketPairsHighlight} onChange={onChangeBracketPairsHighlight} />
              }
            />
            <FormControlLabel
              label={t('label.option__validation')}
              control={<Switch checked={editorContext?.validation} onChange={onChangeValidation} />}
            />
            <FormControlLabel
              label={t('label.option__wordWrap')}
              control={<Switch checked={editorContext?.wordWrap} onChange={onChangeWordWrap} />}
            />
            <FormControlLabel
              label={t('label.option__autoSave')}
              control={<Switch checked={editorContext?.autoSave} onChange={onChangeAutoSave} />}
            />
            <NumericFormat
              label={t('label.option__autoSaveDelay')}
              value={editorContext?.autoSaveDelay}
              customInput={TextField}
              variant="standard"
              isAllowed={isAllowAutoSaveDelay}
              onValueChange={onChangeAutoSaveDelay}
              sx={{ mt: 0.5 }}
            />
          </Stack>
        </Stack>
      </Container>
    </Dialog>
  );
};
