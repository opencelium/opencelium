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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import Button from "@entity/connection/components/components/general/basic_components/buttons/Button";
import styles from '@entity/connection/components/themes/default/general/basic_components.scss';
import {getFocusableElements} from "@application/utils/utils";
import CVoiceControl from "@entity/connection/components/classes/voice_control/CVoiceControl";
import CDialogControl from "@entity/connection/components/classes/voice_control/CDialogControl";


/**
 * Dialog Component
 */
class Dialog extends Component{

    constructor(props){
        super(props);

        this.state = {
            isOpen: props.active,
        };
    }

    componentDidMount(){
        if(this.state.isOpen){
            this.setFocus();
        }
        if(this.props.active) {
            CVoiceControl.initCommands({component: this}, CDialogControl);
        }
    }

    componentDidUpdate(prevProps){
        const {active} = this.props;
        if(prevProps.active !== active){
            if(active){
                CVoiceControl.removeCommands({component:this}, CDialogControl);
                CVoiceControl.initCommands({component: this}, CDialogControl);
            } else{
                CVoiceControl.removeCommands({component:this}, CDialogControl);
            }
            this.setState({
                isOpen: active,
            }, () => {
                this.setFocus();
            });
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component:this}, CDialogControl);
    }

    setFocus(){
        const {title, isConfirmation, hasAutoFocus} = this.props;
        if(hasAutoFocus) {
            setTimeout(() => {
                let focusableElements = getFocusableElements(document.getElementById(`modal_${title}`));
                if (focusableElements.length > 1) {
                    if (isConfirmation) {
                        focusableElements[focusableElements.length - 1].focus();
                    } else {
                        focusableElements[1].focus();
                    }
                }
            }, 500);
        }
    }

    renderButtons(){
        const {actions} = this.props;
        return actions.map(action => {
            let isLoading = action.hasOwnProperty('isLoading') ? action.isLoading : false;
            return <Button
                key={action.label}
                isLoading={isLoading}
                disabled={isLoading}
                title={isLoading ? ' ' : action.label}
                onClick={action.onClick}
                id={action.id ? action.id : `button_${action.label}`}
            />
        });
    }

    render(){
        const {isOpen} = this.state;
        const {title, toggle, children, theme} = this.props;
        let dialogClassname = `${styles.dialog} ${theme.dialog}`;
        return(
            <Modal id={`modal_${title}`} autoFocus={true} isOpen={isOpen} toggle={toggle} className={dialogClassname} modalClassName={theme.modal} contentClassName={theme.content} wrapClassName={theme.wrapper}>
                <ModalHeader toggle={toggle} className={theme.title}>{title}</ModalHeader>
                <ModalBody className={theme.body}>
                    {children}
                </ModalBody>
                <ModalFooter style={{borderTop: 'none'}} className={styles.buttons}>
                    {this.renderButtons()}
                </ModalFooter>
            </Modal>
        )
    }
}

Dialog.propTypes = {
    title: PropTypes.any.isRequired,
    actions: PropTypes.array.isRequired,
    active: PropTypes.bool,
    toggle: PropTypes.func.isRequired,
    isConfirmation: PropTypes.bool,
    theme: PropTypes.shape({
        wrapper: PropTypes.string,
        title: PropTypes.string,
        content: PropTypes.string,
        modal: PropTypes.string,
        dialog: PropTypes.string,
        body: PropTypes.string,
    }),
    hasAutoFocus: PropTypes.bool,
};

Dialog.defaultProps = {
    theme: {wrapper: '', title: '', content: '', modal: '', dialog: '', body: ''},
    active: false,
    isConfirmation: false,
    hasAutoFocus: true,
};

export default Dialog;
