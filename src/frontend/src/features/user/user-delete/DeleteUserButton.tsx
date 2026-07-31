import {ConfirmActionButton} from "@shared/ui/actions/ConfirmActionButton.tsx";
import React from "react";

const DeleteUserButton = () => {
    return (
        <ConfirmActionButton
            variant="danger"
            confirm={{
                title: 'Delete',
                message: 'This action cannot be undone',
                confirmText: 'Delete',
                confirmVariant: 'danger',
            }}
            onConfirm={() => {
                console.log('delete user')
            }}
        >
            Login
        </ConfirmActionButton>
    );
};

export default DeleteUserButton;
