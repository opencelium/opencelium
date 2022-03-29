import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {Modal, ModalBody, ModalFooter, ModalHeader,} from 'reactstrap';
import {ActionProps, DialogProps} from './interfaces';
import {getFocusableElements} from "../../../utils";
import Button from "../button/Button";
import {TextSize} from "@atom/text/interfaces";
import Text from "@atom/text/Text";
import {ColorTheme} from "../../general/Theme";
import {ActionsStyled} from "@atom/dialog/styles";

const Dialog: FC<DialogProps> =
    ({
        active,
        title,
        isConfirmation,
        actions,
        toggle,
        children,
        dialogClassname,
        dialogTheme,
        styles,
    }) => {
    const [isOpen, toggleDialog] = useState(active);
    useEffect(() => {
        if (isOpen) {
            setFocus();
        }
    },[]);
    useEffect(() => {
        toggleDialog(active);
    }, [active])
    const setFocus = () => {
        setTimeout(() => {
            let focusableElements = getFocusableElements(document.getElementById(`modal_${title}`));
            if(focusableElements.length > 1) {
                if(isConfirmation){
                    focusableElements[focusableElements.length - 1].focus();
                } else {
                    focusableElements[1].focus();
                }
            }}, 500);
    }
    return (
        <Modal id={`modal_${title}`} autoFocus={true} isOpen={isOpen} toggle={toggle} style={styles.modal} className={dialogClassname} modalClassName={dialogTheme.modal} contentClassName={dialogTheme.content} wrapClassName={dialogTheme.wrapper}>
            <ModalHeader toggle={toggle} className={dialogTheme.title} style={styles.header}><Text value={title} size={TextSize.Size_20} isBold={true}/></ModalHeader>
            <ModalBody style={styles.body}>
                {children}
            </ModalBody>
            <ModalFooter style={{borderTop: 'none'}}>
                <ActionsStyled>
                {
                    actions.map((action: ActionProps) => {
                        return <Button key={action.label} isDisabled={action.isDisabled} color={action.isLoading ? ColorTheme.Blue : ''} hasBackground={!action.isLoading} isLoading={action.isLoading} label={action.label} handleClick={action.onClick} id={action.id ? action.id : `button_${action.label}`} size={TextSize.Size_16} iconSize={TextSize.Size_14}/>
                    })
                }
                </ActionsStyled>
            </ModalFooter>
        </Modal>
    )
}

Dialog.defaultProps = {
    isConfirmation: false,
    dialogTheme: {
        modal: '',
        content: '',
        title: '',
        wrapper: '',
    },
    styles: {
        modal: null,
        header: null,
    }
}


export {
    Dialog,
};

export default withTheme(Dialog);