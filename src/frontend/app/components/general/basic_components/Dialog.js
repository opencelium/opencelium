/*
 * Copyright (C) <2020>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
} from 'reactstrap';
import Button from "@basic_components/buttons/Button";
import styles from '@themes/default/general/basic_components.scss';
import {getFocusableElements, setFocusById} from "@utils/app";


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
    }

    componentDidUpdate(prevProps){
        const {active} = this.props;
        if(prevProps.active !== active){
            this.setState({
                isOpen: active,
            }, () => {
                this.setFocus();
            });
        }
    }

    setFocus(){
        const {title, isConfirmation} = this.props;
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

    renderButtons(){
        const {actions} = this.props;
        return actions.map(action => {
            return <Button key={action.label} title={action.label} onClick={action.onClick} id={action.id ? action.id : `button_${action.label}`}/>
        });
    }

    render(){
        const {isOpen} = this.state;
        const {title, toggle, children, theme} = this.props;
        let dialogClassname = `${styles.dialog} ${theme.dialog}`;
        return(
            <Modal id={`modal_${title}`} autoFocus={true} isOpen={isOpen} toggle={toggle} className={dialogClassname} modalClassName={theme.modal} contentClassName={theme.content} wrapClassName={theme.wrapper}>
                <ModalHeader toggle={toggle} className={theme.title}>{title}</ModalHeader>
                <ModalBody>
                    {children}
                </ModalBody>
                <ModalFooter style={{borderTop: 'none'}}>
                    {this.renderButtons()}
                </ModalFooter>
            </Modal>
        )
    }
}

Dialog.propTypes = {
    title: PropTypes.string.isRequired,
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
    }),
};

Dialog.defaultProps = {
    theme: {wrapper: '', title: '', content: '', modal: '', dialog: ''},
    active: false,
    isConfirmation: false,
};

export default Dialog;