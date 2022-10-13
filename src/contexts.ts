import { PaletteMode } from '@mui/material';
import { createContext } from 'react';

import { LanguageMode, Theme } from './enums';

export type AppContext = {
  paletteMode: PaletteMode;
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};
export const AppContext = createContext<AppContext | undefined>(undefined);

export type EditorContext = {
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  lineNumber: boolean;
  setLineNumber: React.Dispatch<React.SetStateAction<boolean>>;
  minimap: boolean;
  setMinimap: React.Dispatch<React.SetStateAction<boolean>>;
  lineHighlight: boolean;
  setLineHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  bracketPairsHighlight: boolean;
  setBracketPairsHighlight: React.Dispatch<React.SetStateAction<boolean>>;
  validation: boolean;
  setValidation: React.Dispatch<React.SetStateAction<boolean>>;
  wordWrap: boolean;
  setWordWrap: React.Dispatch<React.SetStateAction<boolean>>;
  autoSave: boolean;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  autoSaveDelay: number;
  setAutoSaveDelay: React.Dispatch<React.SetStateAction<number>>;
};
export const EditorContext = createContext<EditorContext | undefined>(undefined);
