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
import {HeaderTextSize} from "@entity/application/utils/constants";
import HeaderText from "@app_component/base/text/HeaderText";
import {ColorTheme} from "@style/Theme";
import {setFullScreen as setFullScreenFormSection} from "@application/redux_toolkit/slices/ApplicationSlice";
import {TooltipButton} from "@app_component/base/tooltip_button/TooltipButton";


/**
 * Dialog Component
 */
class Dialog extends Component{

    constructor(props){
        super(props);

        this.state = {
            isOpen: props.active,
            isFullScreen: false,
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
        const {active, actions} = this.props;
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
                if (actions.findIndex(a => a.autoFocus) === -1) {
                    this.setFocus();
                }
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
                autoFocus={action.autoFocus || false}
                isLoading={isLoading}
                disabled={isLoading}
                title={isLoading ? ' ' : action.label}
                onClick={action.onClick}
                id={action.id ? action.id : `button_${action.label}`}
            />
        });
    }

    render(){
        const {isOpen, isFullScreen} = this.state;
        const {title, toggle, children, theme, id, hasFullScreenOption, additionalActions} = this.props;
        const dialogClassName = `${styles.dialog} ${theme.dialog}${isFullScreen ? ` ${styles.fullscreen_dialog}` : ''}`;
        const contentClassName = `${theme.content}${isFullScreen ? ` ${styles.fullscreen_content}` : ''}`;
        const bodyClassName = `${theme.body}${isFullScreen ? ` ${styles.fullscreen_body}` : ''}`;
        return(
            <Modal id={id || `modal_${title}`} isOpen={isOpen} toggle={toggle} className={dialogClassName} modalClassName={theme.modal} contentClassName={contentClassName} wrapClassName={theme.wrapper}>
                <ModalHeader close={
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                    }}>
                        {additionalActions}
                        {hasFullScreenOption && <TooltipButton
                            icon={isFullScreen ? "close_fullscreen" : "open_in_full"}
                            tooltip={isFullScreen ? "Minimize" : "Maximize"}
                            target={`fullscreen_dialog`}
                            hasBackground={false}
                            handleClick={() => this.setState({isFullScreen: !isFullScreen})}
                        />}
                        <TooltipButton
                            position={"bottom"}
                            icon={"close"}
                            tooltip={"Close"}
                            target={`close_dialog`}
                            hasBackground={false}
                            handleClick={toggle}
                        />
                    </div>
                } toggle={toggle} className={theme.title}>
                    <HeaderText value={title}/>
                </ModalHeader>
                <ModalBody className={bodyClassName}>
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
    id: PropTypes.string,
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
    hasFullScreenOption: PropTypes.bool,
};

Dialog.defaultProps = {
    theme: {wrapper: '', title: '', content: '', modal: '', dialog: '', body: ''},
    active: false,
    isConfirmation: false,
    hasAutoFocus: true,
    hasFullScreenOption: false,
    additionalActions: null,
};

export default Dialog;
