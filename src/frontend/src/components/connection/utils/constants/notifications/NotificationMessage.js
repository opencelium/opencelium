/*
 * Copyright (C) <2022>  <becon GmbH>
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
import {withTranslation} from "react-i18next";
import i18n from '../../i18n';

import {NotificationMessageHandlers} from './notifications';
import {parseConnectionPointer} from "../../app";
import Dialog from "@basic_components/Dialog";


/**
 * Notification Message component for displaying a notification text
 */
@withTranslation('notifications')
class NotificationMessage extends Component{
    constructor(props){
        super(props);

        this.state = {
            showDialogInDetails: false,
            inDetailsMessage: '',
        };
    }

    toggleShowDialogInDetails(){
        this.setState({showDialogInDetails: !this.state.showDialogInDetails});
    }

    openDialog(e, inDetailsMessage){
        this.setState({showDialogInDetails: true, inDetailsMessage});
    }

    renderDialogInDetails(){
        const {showDialogInDetails} = this.state;
        let {inDetailsMessage} = this.state;
        const {t} = this.props;
        const regColor = RegExp('#[0-9|a-f|A-F]{6}', 'g');
        const lastWord = inDetailsMessage.substr(inDetailsMessage.length - 7);
        const hasColor = regColor.test(lastWord);
        if(hasColor){
            inDetailsMessage = inDetailsMessage.substr(0, inDetailsMessage.length - 7);
        }
        return(
            <Dialog
                actions={[{label: t('DIALOG_DETAILS.CLOSE'), onClick: () => this.toggleShowDialogInDetails(), id: 'dialog_close'}]}
                active={showDialogInDetails}
                toggle={() => this.toggleShowDialogInDetails()}
                title={t('DIALOG_DETAILS.TITLE')}
            >
                <p style={{overflow: 'auto'}}>
                    <span>{inDetailsMessage}</span>
                    {hasColor && <span style={{background: lastWord, width: '30px', height: '17px', verticalAlign: 'sub', display: 'inline-block', borderRadius: '2px', marginLeft: '5px'}}/>}
                </p>
            </Dialog>
        );
    }

    renderServerMessage(comingMessage){
        const {t, notification} = this.props;
        const {shortMessage} = notification;
        let result = '';
        let colorRegExp = /^(.*)#[0-9a-f]{6}(.*)/gi;
        let checkColorRegExp = colorRegExp.exec(comingMessage);
        if(comingMessage.length > 50){
            const {setHasCloseButton} = this.props;
            if(setHasCloseButton) {
                setHasCloseButton(true);
            }
            return <span>{`${shortMessage} (`}<a id='notification_url' href='#' onClick={(e) => this.openDialog(e, comingMessage)}>{t('DETAILS')}</a>)</span>;
        }
        if(checkColorRegExp && checkColorRegExp.length > 2){
            let color = comingMessage.substring(checkColorRegExp[1].length, checkColorRegExp[1].length + 7);
            let colorStyles = {height: '17px', width: '40px', display: 'inline-block', margin: '0 5px'};
            result = <span>{checkColorRegExp[1]}<span style={{...colorStyles, background: color}}/>{checkColorRegExp[2]}</span>;
        } else{
            result = comingMessage;
        }
        return result;
    }

    render() {
        const {t, notification} = this.props;
        const {type, message, params} = notification;
        let notificationMessage = type + '.' + message;
        if(NotificationMessageHandlers[type] && NotificationMessageHandlers[type][message]){
            notificationMessage = NotificationMessageHandlers[type][message](params);
        } else{
            let comingMessage = params && params.hasOwnProperty('response') && params.response && params.response.hasOwnProperty('message') ? params.response.message : '';
            if(comingMessage === ''){
                comingMessage = params &&  params.hasOwnProperty('message') && params.message !== 'No message available' && params.message !== 'ajax error 0' ? params.message : '';
            }
            if(comingMessage){
                if(i18n.exists(`notifications:${type}.${message}.${comingMessage}`)) {
                    if(params.hasOwnProperty('response') && params.response.hasOwnProperty('data') && params.response.data.hasOwnProperty('connectionPointer')){
                        let connectionPointer = parseConnectionPointer(params.response.data.connectionPointer);
                        if(connectionPointer.field !== '' && connectionPointer.color !== '') {
                            notificationMessage = t(type + '.' + message + '.' + comingMessage, {methodPath: connectionPointer.field});
                            notificationMessage = this.renderServerMessage(`${notificationMessage} ${connectionPointer.color}`);
                        } else{
                            notificationMessage = t(type + '.' + message + '.' + comingMessage);
                        }
                    } else {
                        notificationMessage = t(type + '.' + message + '.' + comingMessage);
                        if (notificationMessage === `${type}.${message}.${comingMessage}`) {
                            notificationMessage = t(`${type}.${message}.__DEFAULT__`);
                        }
                    }
                } else{
                    notificationMessage = this.renderServerMessage(comingMessage);
                }
            } else {
                if (i18n.exists(`notifications:${type}.${message}.__DEFAULT__`)) {
                    notificationMessage = t(`${type}.${message}.__DEFAULT__`);
                } else{
                    if(i18n.exists(`notifications:${type}.${message}`)){
                        notificationMessage = t(`${type}.${message}`);
                    } else{
                        notificationMessage = message;
                    }
                }
            }
        }
        return (
            <React.Fragment>
                <span>{notificationMessage}</span>
                {this.renderDialogInDetails()}
            </React.Fragment>
        );
    }
}

NotificationMessage.defaultProps = {
    setHasCloseButton: null,
};

export default NotificationMessage;