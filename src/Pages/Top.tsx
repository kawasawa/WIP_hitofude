import { loader } from '@monaco-editor/react';
import {
  Delete as DeleteIcon,
  DriveFileRenameOutline as DriveFileRenameOutlineIcon,
  NoteAdd as NoteAddIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Undo as UndoIcon,
} from '@mui/icons-material';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Divider, Fab, ListItemIcon, ListItemText, Menu, MenuItem, Tab } from '@mui/material';
import { liveQuery } from 'dexie';
import { Turn as Hamburger } from 'hamburger-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable, DropResult } from 'react-beautiful-dnd';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { v4 as uuidV4 } from 'uuid';

import { Editor } from '../components';
import { ConfirmDialog, FileConfigDialog, OptionDialog } from '../components/dialogs';
import { EditorContext } from '../contexts';
import { db, Documents } from '../db';
import { LanguageMode, SettingsKeys } from '../enums';
import { convertToBoolean, convertToNumber, orderBy } from '../utils';

const observableDocuments = () => liveQuery(async () => await db.documents.toArray());

// eslint-disable-next-line complexity
export const Top = () => {
  loader.config({ 'vs/nls': { availableLanguages: { '*': 'ja' } } });

  const [t] = useTranslation();
  const editorRefs = useRef<{ [key: string]: any }>({});

  // プロパティ
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

  // タブの選択状態
  const [tabValue, setTabValue] = React.useState('');
  const onChangeTabIndex = useCallback(
    async (event: React.SyntheticEvent, newValue: string) => {
      // タブ切り替え時にドキュメントが変更されていれば保存する
      if (editorRefs.current[tabValue].current.isDirty()) await editorRefs.current[tabValue].current.save();
      setTabValue(newValue);
    },
    [tabValue]
  );

  // ドキュメント
  const [documents, setDocuments] = useState<Documents[]>([]);
  useEffect(() => {
    const subscription = observableDocuments().subscribe(
      (result) => {
        setDocuments(result);
        setTabValue(orderBy(result, 'order')[0]?.id);
      },
      () => {
        setDocuments([]);
        setTabValue('');
      }
    );
    return () => {
      subscription.unsubscribe();
      setDocuments([]);
      setTabValue('');
    };
  }, []);

  // ドラッグ処理
  const onDragEnd = useCallback(
    async (result: DropResult) => {
      if (!documents || !result.destination) {
        return;
      }
      if (result.source.index === result.destination.index) {
        setTabValue(documents[result.destination.index].id);
        return;
      }

      // ドキュメントの並び順を入れ替える
      const newDocuments = [...documents];
      const [removedDocument] = newDocuments.splice(result.source.index, 1);
      newDocuments.splice(result.destination.index, 0, removedDocument);
      setDocuments(newDocuments);

      // ドラッグされたタブをアクティブにする
      setTabValue(newDocuments[result.destination.index].id);

      // オーダーを保存する
      await Promise.all(
        newDocuments.map(async (doc, i) => {
          if (i < Math.min(result.source.index, result.destination!.index)) return;
          if (Math.max(result.source.index, result.destination!.index) + 1 < i) return;
          await db.documents.update(doc.id, { order: i });
        })
      );
    },
    [documents]
  );

  // メニュー開閉
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>();
  const openHamburger = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget),
    []
  );
  const closeHamburger = useCallback(() => setAnchorEl(null), []);

  // オプション
  const [optionOpened, setOptionOpened] = React.useState(false);
  const openOption = useCallback(() => setOptionOpened(true), []);
  const closeOption = useCallback(() => setOptionOpened(false), []);
  useHotkeys('ctrl+,', openOption);

  // ファイルの新規作成
  const [newFileOpened, setNewFileOpened] = React.useState(false);
  const openNewFile = useCallback(() => {
    closeHamburger();
    setNewFileOpened(true);
  }, [closeHamburger]);
  const okNewFile = useCallback(
    async (fileName: string, languageMode: LanguageMode) => {
      setNewFileOpened(false);
      await db.documents.add({
        id: uuidV4(),
        order: documents.length,
        title: fileName,
        languageMode: languageMode,
        text: '',
      });
    },
    [documents]
  );
  const cancelNewFile = useCallback(() => setNewFileOpened(false), []);
  useHotkeys('ctrl+N', openNewFile);

  // ファイルの設定変更
  const [editFileOpened, setEditFileOpened] = React.useState(false);
  const openEditFile = useCallback(() => {
    closeHamburger();
    setEditFileOpened(true);
  }, [closeHamburger]);
  const okEditFile = useCallback(
    async (fileName: string, languageMode: LanguageMode) => {
      setEditFileOpened(false);
      const doc = documents.find((d) => d.id === tabValue)!;
      await db.documents.update(doc.id, { title: fileName, languageMode: languageMode });
    },
    [documents, tabValue]
  );
  const cancelEditFile = useCallback(() => setEditFileOpened(false), []);
  useHotkeys('F2', openEditFile);

  // ファイルの削除
  const [removeOpened, setRemoveOpened] = React.useState(false);
  const openRemove = useCallback(() => {
    closeHamburger();
    setRemoveOpened(true);
  }, [closeHamburger]);
  const okRemove = useCallback(async () => {
    setRemoveOpened(false);
    const doc = documents.find((d) => d.id === tabValue)!;
    await db.documents.delete(doc.id);
  }, [documents, tabValue]);
  const cancelRemove = useCallback(() => setRemoveOpened(false), []);

  // 保存
  useHotkeys('ctrl+s', () => editorRefs.current[tabValue].current.save());

  if (!documents) return null;

  return (
    <EditorContext.Provider
      value={{
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

      <FileConfigDialog
        open={newFileOpened}
        title={t('label.menu__newFile')}
        message={t('text.fileConfigDialog__newFile--message')}
        affirmativeAction={okNewFile}
        negativeAction={cancelNewFile}
      />

      <FileConfigDialog
        open={editFileOpened}
        title={t('label.menu__editFile')}
        message={t('text.fileConfigDialog__editFile--message')}
        defaultFileName={documents.find((d) => d.id === tabValue)?.title}
        defaultLanguageMode={documents.find((d) => d.id === tabValue)?.languageMode}
        affirmativeAction={okEditFile}
        negativeAction={cancelEditFile}
      />

      <ConfirmDialog
        open={removeOpened}
        title={t('label.menu__removeFile')}
        message={t('text.confirmDialog__removeFile--message')}
        affirmativeAction={okRemove}
        negativeAction={cancelRemove}
      />

      <TabContext value={tabValue!}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable" direction="horizontal">
            {(provided) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const DraggableTab = (props: any) => (
                <Draggable
                  draggableId={`draggable_${props.index}`}
                  index={props.index}
                  disableInteractiveElementBlocking
                >
                  {(provided) => (
                    <Box ref={provided.innerRef} {...provided.draggableProps}>
                      {/* props を経由して Tab と DnD 処理のプロパティを伝播させる */}
                      <Tab label={props.label} {...props} {...provided.dragHandleProps} />
                    </Box>
                  )}
                </Draggable>
              );
              return (
                <TabList
                  variant="scrollable"
                  onChange={onChangeTabIndex}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* タブはオーダー順に並べる */}
                  {orderBy(documents, 'order').map((doc, i) => (
                    <DraggableTab key={`top__tab--${i}`} index={i} label={doc.title} value={doc.id} />
                  ))}
                  {provided?.placeholder ?? null}
                </TabList>
              );
            }}
          </Droppable>
        </DragDropContext>

        {documents.map((doc, i) => {
          editorRefs.current[doc.id] ??= React.createRef();
          return (
            <TabPanel key={`top__tabPanel--${i}`} value={doc.id} sx={{ p: 0 }}>
              <Editor
                ref={editorRefs.current[doc.id]}
                document={doc}
                openOption={openOption}
                openNewfile={openNewFile}
                openEditFile={openEditFile}
              />
            </TabPanel>
          );
        })}
      </TabContext>

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
            openNewFile();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <NoteAddIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__newFile')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openEditFile();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <DriveFileRenameOutlineIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__editFile')}</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            openRemove();
            closeHamburger();
          }}
        >
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText>{t('label.menu__removeFile')}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            await editorRefs.current[tabValue].current.save();
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
            editorRefs.current[tabValue].current.undo();
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
            editorRefs.current[tabValue].current.redo();
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
            editorRefs.current[tabValue].current.find();
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
    </EditorContext.Provider>
  );
};
