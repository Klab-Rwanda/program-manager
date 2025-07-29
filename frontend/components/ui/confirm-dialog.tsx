// components/ui/confirm-dialog.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Assuming path to your shadcn ui alert-dialog

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Optional: for showing loading state on confirm button
  destructive?: boolean; // Optional: for destructive button styling
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
  destructive = false,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isConfirming}
            className={destructive ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};