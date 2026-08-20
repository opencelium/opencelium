import { Modal } from 'antd';
import {type ModalOptions, useModalStore} from "@app/layouts/AppLayout/GlobalModal/global-modal.store.ts";
import React, {useRef} from "react";
export const openModalStore = (node: React.ReactNode, options?: ModalOptions) => {
    useModalStore.getState().open(node, options);
};
export const GlobalModal = () => {
    const { isOpen, content, contentKey, close, width, top } = useModalStore();
    const wrapperRef = useRef<HTMLDivElement>(null);

    return (
        <Modal
            open={isOpen}
            onCancel={close}
            footer={null}
            width={width ?? 1000}
            style={{
                top: top ?? 50,
                paddingBottom: '50px',
            }}
            // antd otherwise focuses the modal's own wrapper div on open, which
            // shows a stray focus outline around the whole dialog — move focus
            // to the close button instead, same as a native dialog would.
            afterOpenChange={(open) => {
                if (open) wrapperRef.current?.querySelector<HTMLButtonElement>('.ant-modal-close')?.focus();
            }}
            modalRender={(node) => <div ref={wrapperRef}>{node}</div>}
        >
            <React.Fragment key={contentKey}>{content}</React.Fragment>
        </Modal>
    );
};
