import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Slide,
  SlideProps,
  TextField,
} from '@mui/material';
import React, { useCallback, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { LanguageMode } from '../../enums';
import Yup from '../../locales/yup.ja';

export type FileConfigDialogProps = {
  open: boolean;
  title: string;
  message: string;
  defaultFileName?: string;
  defaultLanguageMode?: LanguageMode;
  affirmativeText?: string;
  negativeText?: string;
  affirmativeAction: { (fileName: string, languageMode: LanguageMode): void };
  negativeAction: { (): void };
};

const Transition = React.forwardRef(function _(
  props: SlideProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} direction="up" {...props} />;
});

export const FileConfigDialog = (props: FileConfigDialogProps) => {
  const [t] = useTranslation();

  const { formState, register, reset, handleSubmit, control } = useForm({
    mode: 'all',
    resolver: yupResolver(
      Yup.object().shape({
        fileName: Yup.string().required(),
        languageMode: Yup.string().required(),
      })
    ),
  });
  useEffect(
    () =>
      reset({
        fileName: props.defaultFileName ?? '',
        languageMode: props.defaultLanguageMode ?? Object.keys(LanguageMode)[0],
      }),
    [reset, props.open, props.defaultFileName, props.defaultLanguageMode]
  );

  const handleAffirmative = handleSubmit(
    (data) => props.affirmativeAction && props.affirmativeAction(data.fileName, data.languageMode)
  );
  const handleNegative = useCallback(() => props.negativeAction && props.negativeAction(), [props]);

  return (
    <Dialog open={props.open} TransitionComponent={Transition} onClose={handleNegative} keepMounted>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{props.message}</DialogContentText>
        {/*
        パフォーマンスの観点で極力 register を使用してバインディングを行う。
        select コンポーネントは register では適用できないので、Controller 経由で設定する。
        */}
        <TextField
          {...register('fileName')}
          error={'fileName' in formState.errors}
          helperText={formState.errors.fileName?.message?.toString()}
          label={t('label.fileConfigDialog__fileName')}
          variant="standard"
          margin="dense"
          fullWidth
          autoFocus
        />
        <Controller
          name="languageMode"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              label={t('label.fileConfigDialog__languageMode')}
              variant="standard"
              margin="dense"
              fullWidth
              select
            >
              {Object.entries(LanguageMode).map(([lang, name]) => (
                <MenuItem key={`fileConfigDialog__languageMode--${lang}`} value={lang}>
                  {name}
                </MenuItem>
              ))}
            </TextField>
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button color="inherit" variant="outlined" onClick={handleNegative}>
          {props.negativeText ?? t('label.cancel')}
        </Button>
        <Button
          color="info"
          variant="contained"
          disabled={!formState.isDirty || !formState.isValid || formState.isSubmitting}
          onClick={handleAffirmative}
        >
          {props.affirmativeText ?? t('label.ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
