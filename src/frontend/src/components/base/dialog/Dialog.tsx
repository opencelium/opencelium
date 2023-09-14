/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, useEffect, useState} from 'react';
import {withTheme} from 'styled-components';
import {Modal, ModalBody, ModalFooter, ModalHeader,} from 'reactstrap';
import {getFocusableElements} from "@application/utils/utils";
import {ColorTheme} from "@style/Theme";
import {ActionProps, DialogProps} from './interfaces';
import Button from "../button/Button";
import {TextSize} from "../text/interfaces";
import Text from "../text/Text";
import {ActionsStyled} from "./styles";

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
        hasNoActions,
        hasNoBody,
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
        <Modal id={`modal_${title}`} autoFocus={true} isOpen={isOpen} toggle={toggle} style={styles.modal} className={dialogClassname} modalClassName={dialogTheme.modal} contentClassName={dialogTheme.content} wrapClassName={dialogTheme.wrapper} backdropClassName={dialogTheme.backdrop}>
            {title && <ModalHeader toggle={toggle} className={dialogTheme.title} style={styles.header}><Text value={title} size={TextSize.Size_20} isBold={true}/></ModalHeader>}
            {hasNoBody ? children :
                <ModalBody style={styles.body} className={dialogTheme.body}>
                    {children}
                </ModalBody>
            }
            {hasNoBody ? children :
                <ModalFooter style={{borderTop: 'none'}} className={dialogTheme.footer}>
                    <ActionsStyled>
                        {
                            actions.map((action: ActionProps) => {
                                return  <Button  
                                            key={action.label} 
                                            isDisabled={action.isDisabled}
                                            color={action.isLoading ? ColorTheme.Blue : ''}
                                            hasBackground={!action.isLoading} 
                                            isLoading={action.isLoading}
                                            label={action.label}
                                            handleClick={action.onClick}
                                            id={action.id ? action.id : `button_${action.label}`}
                                            size={TextSize.Size_16} iconSize={TextSize.Size_14}
                                        />
                            })
                        }
                    </ActionsStyled>
                </ModalFooter>
            }
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
        backdrop: '',
    },
    styles: {
        modal: null,
        header: null,
    },
    hasNoBody: false,
    hasNoActions: false,
}


export {
    Dialog,
};

export default withTheme(Dialog);
