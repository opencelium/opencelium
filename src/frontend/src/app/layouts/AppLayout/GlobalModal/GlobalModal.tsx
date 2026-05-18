import { Modal } from 'antd';
import {useModalStore} from "@app/layouts/AppLayout/GlobalModal/global-modal.store.ts";
import React from "react";
export const openModalStore = (node: React.ReactNode) => {
    useModalStore.getState().open(node);
};
export const GlobalModal = () => {
    const { isOpen, content, close } = useModalStore();

    return (
        <Modal
            open={isOpen}
            onCancel={close}
            footer={null}
            width={1000}
            style={{
                top: 50,
                paddingBottom: '50px',
            }}
        >
            {content}
        </Modal>
    );
};
