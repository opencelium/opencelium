import type { OpenDialogOptions } from './types';

export interface DialogStackItem extends OpenDialogOptions {
    id: string;
    open: boolean;
}
