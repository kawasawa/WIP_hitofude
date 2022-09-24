import MonacoEditor, { loader } from '@monaco-editor/react';
import {
  Redo as RedoIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { Box, Divider, Fab, LinearProgress, ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { Turn as Hamburger } from 'hamburger-react';
import MonacoEditorApi, { IDisposable, KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { AppContext, EditorContext } from '../contexts';
import { LanguageMode, SettingsKeys } from '../enums';
import { convertToBoolean, convertToNumber, convertToString } from '../utils';
import { OptionDialog } from './dialogs';

const compositeDisposable: { [key: string]: IDisposable } = {};

// eslint-disable-next-line complexity
export const Editor = () => {
  loader.config({ 'vs/nls': { availableLanguages: { '*': 'ja' } } });

  const appContext = useContext(AppContext);
  const editorRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editorMounted, setEditorMounted] = useState<boolean>(false);
  const [t] = useTranslation();

  // ステート管理
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>();
  const [optionOpened, setOptionOpened] = React.useState(false);
  useEffect(() => {
    if (!isDirty) clearTimeout(autoSaveTimer);
  }, [isDirty, autoSaveTimer]);

  // メニュー開閉
  const openHamburger = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget),
    []
  );
  const closeHamburger = useCallback(() => setAnchorEl(null), []);

  // 設定
  const openOption = useCallback(() => setOptionOpened(true), []);
  const closeOption = useCallback(() => setOptionOpened(false), []);
  useEffect(() => {
    if (!editorMounted || !editorRef.current) return;
    compositeDisposable.open?.dispose();
    const disposable = (editorRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor).addAction({
      id: 'option',
      label: t('label.menu__option'),
      keybindings: [KeyMod.WinCtrl | KeyCode.Comma],
      run: openOption,
    });
    compositeDisposable.open = disposable;
  }, [editorMounted, t, openOption]);
  useHotkeys('ctrl+,', openOption);

  // 保存
  const save = useCallback(() => {
    if (!editorRef.current) return;
    localStorage.setItem(SettingsKeys.text, editorRef.current.getValue());
    setIsDirty(false);
    toast.info(t('message.notify__save--succeeded'));
  }, [t]);
  useEffect(() => {
    if (!editorMounted || !editorRef.current) return;
    compositeDisposable.save?.dispose();
    const disposable = (editorRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor).addAction({
      id: 'save',
      label: t('label.menu__save'),
      keybindings: [KeyMod.WinCtrl | KeyCode.KeyS],
      run: save,
    });
    compositeDisposable.save = disposable;
  }, [editorMounted, t, save]);
  useHotkeys('ctrl+s', save);

  // 元に戻す
  const undo = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.trigger(null, 'undo', null);
  }, []);

  // やり直し
  const redo = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.trigger(null, 'redo', null);
  }, []);

  // 検索
  const find = useCallback(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.getAction('actions.find').run();
  }, []);

  // プロパティ
  const [languageMode, setLanguageMode] = useState<LanguageMode>(
    (localStorage.getItem(SettingsKeys.languageMode) as LanguageMode) ?? 'plaintext'
  );
  const [fontSize, setFontSize] = useState<number>(convertToNumber(localStorage.getItem(SettingsKeys.fontSize), 14));
  const [lineNumber, setLineNumber] = useState<boolean>(
    convertToBoolean(localStorage.getItem(SettingsKeys.lineNumber))
  );
  const [minimap, setMinimap] = useState<boolean>(convertToBoolean(localStorage.getItem(SettingsKeys.minimap)));
  const [lineHighlight, setLineHighlight] = useState<boolean>(
    convertToBoolean(localStorage.getItem(SettingsKeys.lineHighlight))
  );
  const [bracketPairsHighlight, setBracketPairsHighlight] = useState<boolean>(
    convertToBoolean(localStorage.getItem(SettingsKeys.bracketPairsHighlight))
  );
  const [validation, setValidation] = useState<boolean>(
    convertToBoolean(localStorage.getItem(SettingsKeys.validation))
  );
  const [wordWrap, setWordWrap] = useState<boolean>(convertToBoolean(localStorage.getItem(SettingsKeys.wordWrap)));
  const [autoSave, setAutoSave] = useState<boolean>(convertToBoolean(localStorage.getItem(SettingsKeys.autoSave)));
  const [autoSaveDelay, setAutoSaveDelay] = useState<number>(
    convertToNumber(localStorage.getItem(SettingsKeys.autoSaveDelay), 10)
  );

  // プロパティ永続化
  useEffect(() => {
    localStorage.setItem(SettingsKeys.languageMode, languageMode);
  }, [languageMode]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.fontSize, fontSize.toString());
  }, [fontSize]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.lineNumber, convertToString(lineNumber));
  }, [lineNumber]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.minimap, convertToString(minimap));
  }, [minimap]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.lineHighlight, convertToString(lineHighlight));
  }, [lineHighlight]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.bracketPairsHighlight, convertToString(bracketPairsHighlight));
  }, [bracketPairsHighlight]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.validation, convertToString(validation));
  }, [validation]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.wordWrap, convertToString(wordWrap));
  }, [wordWrap]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.autoSave, convertToString(autoSave));
  }, [autoSave]);
  useEffect(() => {
    localStorage.setItem(SettingsKeys.autoSaveDelay, autoSaveDelay.toString());
  }, [autoSaveDelay]);

  // イベントハンドリング
  const onEditorMount = useCallback((editor: MonacoEditorApi.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editorRef.current.setValue(localStorage.getItem(SettingsKeys.text));
    editor.focus();
    setEditorMounted(true);
  }, []);
  const onEditorChange = useCallback(() => {
    // 最後の編集時点から計測して指定の時間後に保存する
    setIsDirty(true);
    if (autoSave) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(setTimeout(save, autoSaveDelay * 1000));
    }
  }, [autoSave, autoSaveDelay, autoSaveTimer, save]);

  return (
    <>
      <EditorContext.Provider
        value={{
          languageMode,
          setLanguageMode,
          fontSize,
          setFontSize,
          lineNumber,
          setLineNumber,
          minimap,
          setMinimap,
          lineHighlight,
          setLineHighlight,
          bracketPairsHighlight,
          setBracketPairsHighlight,
          validation,
          setValidation,
          wordWrap,
          setWordWrap,
          autoSave,
          setAutoSave,
          autoSaveDelay,
          setAutoSaveDelay,
        }}
      >
        <OptionDialog open={optionOpened} closeAction={closeOption} />
      </EditorContext.Provider>

      <MonacoEditor
        theme={appContext?.paletteMode === 'dark' ? 'vs-dark' : 'light'}
        language={languageMode}
        options={{
          // エディター
          fontSize: fontSize, // フォントサイズ
          wordWrap: wordWrap ? 'on' : 'off', // テキストの折り返し
          copyWithSyntaxHighlighting: false, // コピー時の書式設定

          // 余白
          lineNumbers: lineNumber ? 'on' : 'off', // 行番号の表示
          lineDecorationsWidth: lineNumber ? 10 : 5, // 行番号の右隣の余白
          lineNumbersMinChars: 2, // 行番号の最小幅
          glyphMargin: false, // デバッグシンボル用の余白
          folding: languageMode !== 'plaintext', // コードの折りたたみ
          showFoldingControls: 'always', // 折りたたみシンボルの表示

          // スクロールバー、ドキュメントマップ
          minimap: {
            // ミニマップの設定
            enabled: minimap,
            showSlider: 'always',
            renderCharacters: false,
            maxColumn: 60,
          },
          scrollbar: {
            // スクロールバーの設定
            vertical: minimap ? 'hidden' : 'auto',
            verticalScrollbarSize: minimap ? 0 : 10,
          },
          overviewRulerBorder: false, // スクロールバーの境界線の表示

          // ガイド、ハイライト
          renderLineHighlight: lineHighlight ? 'all' : 'none', // 現在行の強調
          matchBrackets: bracketPairsHighlight ? 'always' : 'never', // 対応する括弧の強調
          guides: {
            // 対応する括弧のガイド設定
            bracketPairs: bracketPairsHighlight ? 'active' : false,
          },

          // 描画
          renderValidationDecorations: validation ? 'on' : 'off', // 構文エラーの表示
          fontLigatures: false, // リガチャ
          cursorBlinking: 'smooth', // カーソルの点滅方法
          cursorSmoothCaretAnimation: true, // カーソルのスムースアニメーション
          smoothScrolling: true, // スムーススクロール
          roundedSelection: false, // 選択範囲の丸み
        }}
        height="100vh"
        loading={<LinearProgress color="inherit" sx={{ width: '80%' }} />}
        onMount={onEditorMount}
        onChange={onEditorChange}
      />

      <Box
        sx={{
          position: 'fixed',
          left: 16,
          bottom: 16,
          zIndex: 1,
          opacity: 0.75,
        }}
      >
        <Fab onClick={openHamburger}>
          <Hamburger toggled={!!anchorEl} />
        </Fab>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={closeHamburger}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem
          onClick={() => {
            save();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <SaveIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__save')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            undo();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <UndoIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__undo')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            redo();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <RedoIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__redo')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            find();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <SearchIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__find')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            openOption();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__option')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};
