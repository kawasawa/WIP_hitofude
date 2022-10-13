import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Slide,
  SlideProps,
} from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  affirmativeText?: string;
  negativeText?: string;
  affirmativeAction: { (): void };
  negativeAction: { (): void };
  bottomContent?: React.ReactNode;
};

const Transition = React.forwardRef(function _(
  props: SlideProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide ref={ref} direction="up" {...props} />;
});

export const ConfirmDialog = (props: ConfirmDialogProps) => {
  const [t] = useTranslation();

  const handleAffirmative = useCallback(() => props.affirmativeAction && props.affirmativeAction(), [props]);
  const handleNegative = useCallback(() => props.negativeAction && props.negativeAction(), [props]);

  return (
    <Dialog open={props.open} TransitionComponent={Transition} onClose={handleNegative} keepMounted>
      <DialogTitle>{props.title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ whiteSpace: 'pre-line' }}>{props.message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" variant="outlined" onClick={handleNegative}>
          {props.negativeText ?? t('label.cancel')}
        </Button>
        <Button color="info" variant="contained" onClick={handleAffirmative} autoFocus>
          {props.affirmativeText ?? t('label.ok')}
        </Button>
      </DialogActions>
      {props.bottomContent}
    </Dialog>
  );
};
