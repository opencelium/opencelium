// shared/ui/dialog/DialogHost.tsx
import { Dialog } from '@/shared/ui/primitives/Dialog';
import { useDialogController, useDialogStack } from './DialogContext';

export const DialogHost = () => {
    const stack = useDialogStack();
    const { closeById } = useDialogController();

    return (
        <>
            {stack.map((dialog, index) => {
                const isTop = index === stack.length - 1;

                return (
                    <Dialog
                        key={dialog.id}
                        open={dialog.open}
                        onClose={() => closeById(dialog.id)}
                        title={dialog.title}
                        footer={dialog.footer}
                        width={dialog.width}
                        closable={dialog.closable}
                        fullscreen={dialog.fullscreen}
                        maximizable={dialog.maximizable}
                    >
                        {dialog.content}
                    </Dialog>
                );
            })}
        </>
    );
};
