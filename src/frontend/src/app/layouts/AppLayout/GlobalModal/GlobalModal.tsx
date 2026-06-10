import { Modal } from 'antd';
import {type ModalOptions, useModalStore} from "@app/layouts/AppLayout/GlobalModal/global-modal.store.ts";
import React from "react";
export const openModalStore = (node: React.ReactNode, options?: ModalOptions) => {
    useModalStore.getState().open(node, options);
};
export const GlobalModal = () => {
    const { isOpen, content, close, width } = useModalStore();

    return (
        <Modal
            open={isOpen}
            onCancel={close}
            footer={null}
            width={width ?? 1000}
            style={{
                top: 50,
                paddingBottom: '50px',
            }}
        >
            {content}
        </Modal>
    );
};
