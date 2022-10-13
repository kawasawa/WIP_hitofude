import MonacoEditor from '@monaco-editor/react';
import { LinearProgress } from '@mui/material';
import MonacoEditorApi, { IDisposable, KeyCode, KeyMod } from 'monaco-editor/esm/vs/editor/editor.api';
import React, { useCallback, useContext, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { AppContext, EditorContext } from '../contexts';
import { db, Documents } from '../db';
import { handleError } from '../errors';

export type EditorProps = {
  document: Documents;
  openOption: { (): void };
  openNewfile: { (): void };
  openEditFile: { (): void };
};

const compositeDisposable: { [key: string]: IDisposable } = {};

// eslint-disable-next-line complexity
export const Editor = React.forwardRef(function _(props: EditorProps, ref: React.ForwardedRef<unknown>) {
  const [t] = useTranslation();
  const appContext = useContext(AppContext);
  const editorContext = useContext(EditorContext);
  const monacoRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [editorMounted, setEditorMounted] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // 自動保存
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout>();
  useEffect(() => {
    if (!isDirty) clearTimeout(autoSaveTimer);
  }, [isDirty, autoSaveTimer]);

  // 保存
  const save = useCallback(async () => {
    try {
      await db.documents.update(props.document.id, { text: monacoRef.current.getValue() });
      setIsDirty(false);
      toast.info(t('message.notify__save--succeeded'));
    } catch (error) {
      handleError(error);
    }
  }, [props, t]);
  useEffect(() => {
    if (!editorMounted) return;
    compositeDisposable.save?.dispose();
    const editor = monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    const disposable = editor.addAction({
      id: 'save',
      label: t('label.menu__save'),
      keybindings: [KeyMod.WinCtrl | KeyCode.KeyS],
      run: async () => await save(),
    });
    compositeDisposable.save = disposable;
  }, [editorMounted, save, t]);

  // 元に戻す
  const undo = useCallback(() => {
    const editor = monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.trigger(null, 'undo', null);
  }, []);

  // やり直し
  const redo = useCallback(() => {
    const editor = monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.trigger(null, 'redo', null);
  }, []);

  // 検索
  const find = useCallback(() => {
    const editor = monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor;
    editor.focus();
    editor.getAction('actions.find').run();
  }, []);

  // オプション
  useEffect(() => {
    if (!editorMounted) return;
    compositeDisposable.open?.dispose();
    const disposable = (monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor).addAction({
      id: 'option',
      label: t('label.menu__option'),
      keybindings: [KeyMod.WinCtrl | KeyCode.Comma],
      run: props.openOption,
    });
    compositeDisposable.open = disposable;
  }, [props, editorMounted, t]);

  // ファイルの新規作成
  useEffect(() => {
    if (!editorMounted) return;
    compositeDisposable.newFile?.dispose();
    const disposable = (monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor).addAction({
      id: 'newFile',
      label: t('label.menu__newFile'),
      keybindings: [KeyMod.WinCtrl | KeyCode.KeyN],
      run: props.openNewfile,
    });
    compositeDisposable.newFile = disposable;
  }, [props, editorMounted, t]);

  // ファイルの設定変更
  useEffect(() => {
    if (!editorMounted) return;
    compositeDisposable.editFile?.dispose();
    const disposable = (monacoRef.current as MonacoEditorApi.editor.IStandaloneCodeEditor).addAction({
      id: 'editFile',
      label: t('label.menu__editFile'),
      keybindings: [KeyCode.F2],
      run: props.openEditFile,
    });
    compositeDisposable.editFile = disposable;
  }, [props, editorMounted, t]);

  // イベントハンドリング
  const onEditorMount = useCallback(
    (editor: MonacoEditorApi.editor.IStandaloneCodeEditor) => {
      monacoRef.current = editor;
      monacoRef.current.setValue(props.document.text);
      editor.focus();
      setEditorMounted(true);
    },
    [props]
  );
  const onEditorChange = useCallback(() => {
    // 最後の編集時点から計測して指定の時間後に保存する
    setIsDirty(true);
    if (editorContext!.autoSave) {
      clearTimeout(autoSaveTimer);
      setAutoSaveTimer(setTimeout(save, editorContext!.autoSaveDelay * 1000));
    }
  }, [editorContext, autoSaveTimer, save]);

  // 公開メソッド
  useImperativeHandle(ref, () => ({
    isDirty: () => isDirty,
    save: async () => await save(),
    undo: () => undo(),
    redo: () => redo(),
    find: () => find(),
  }));

  if (!editorContext) return null;

  return (
    <MonacoEditor
      theme={appContext?.paletteMode === 'dark' ? 'vs-dark' : 'light'}
      language={props.document.languageMode}
      options={{
        // エディター
        fontSize: editorContext.fontSize, // フォントサイズ
        wordWrap: editorContext.wordWrap ? 'on' : 'off', // テキストの折り返し
        copyWithSyntaxHighlighting: false, // コピー時の書式設定

        // 余白
        lineNumbers: editorContext.lineNumber ? 'on' : 'off', // 行番号の表示
        lineDecorationsWidth: editorContext.lineNumber ? 10 : 5, // 行番号の右隣の余白
        lineNumbersMinChars: 2, // 行番号の最小幅
        glyphMargin: false, // デバッグシンボル用の余白
        folding: props.document.languageMode !== 'plaintext', // コードの折りたたみ
        showFoldingControls: 'always', // 折りたたみシンボルの表示

        // スクロールバー、ドキュメントマップ
        minimap: {
          // ミニマップの設定
          enabled: editorContext.minimap,
          showSlider: 'always',
          renderCharacters: false,
          maxColumn: 60,
        },
        scrollbar: {
          // スクロールバーの設定
          vertical: editorContext.minimap ? 'hidden' : 'auto',
          verticalScrollbarSize: editorContext.minimap ? 0 : 10,
        },
        overviewRulerBorder: false, // スクロールバーの境界線の表示

        // ガイド、ハイライト
        renderLineHighlight: editorContext.lineHighlight ? 'all' : 'none', // 現在行の強調
        matchBrackets: editorContext.bracketPairsHighlight ? 'always' : 'never', // 対応する括弧の強調
        guides: {
          // 対応する括弧のガイド設定
          bracketPairs: editorContext.bracketPairsHighlight ? 'active' : false,
        },

        // 描画
        renderValidationDecorations: editorContext.validation ? 'on' : 'off', // 構文エラーの表示
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
  );
});
