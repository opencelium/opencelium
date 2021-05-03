/*
 * Copyright (C) <2021>  <becon GmbH>
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

import {NotificationType} from '@utils/constants/notifications/notifications';
import NotificationMessage from '@utils/constants/notifications/NotificationMessage';
import {ErrorNotification} from '@utils/constants/errors';

import styles from '@themes/default/general/app.scss';
import FontIcon from "@basic_components/FontIcon";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

/**
 * Notification Component
 */
@withTranslation('notifications')
class Notification extends Component{

    constructor(props){
        super(props);

        this.state = {
            returnNull: false,
            hasCloseButton: props.hasCloseButton,
        };
        this.data = this.selectData();
    }

    componentDidMount(){
        let that = this;
        const {id, timeOfBeing} = that.props;
        if(timeOfBeing !== 'infinite') {
            setTimeout(function () {
                let element = document.getElementById(id);
                if (element && !that.state.hasCloseButton) {
                    element.classList.remove(styles['notification_show']);
                    element.classList.add(styles['notification_hide']);
                }
            }, timeOfBeing);
            setTimeout(() => {
                if(!that.state.hasCloseButton)
                    that.setState({returnNull: true});
            }, timeOfBeing + 2000);
        }
    }

    closeNotification(){
        const {id} = this.props;
        let element = document.getElementById(id);
        if (element) {
            this.setState({returnNull: true});
        }
    }

    setHasCloseButton(){
        if(!this.state.hasCloseButton)
            this.setState({hasCloseButton: true});
    }

    /**
     * to select data to notify
     */
    selectData(){
        const {data, params, t} = this.props;
        const {type, message, systemTitle, shortMessage} = data;
        let result = {};
        switch(type){
            case NotificationType.SUCCESS:
                result.style = styles.success;
                result.icon =  <FontIcon value='done' style={{color: 'green'}}/>;
                break;
            case NotificationType.ERROR:
                result.style = styles.error;
                result.icon =  <FontIcon value='error' style={{color: 'red'}}/>;
                break;
            case NotificationType.WARNING:
                result.style = styles.warning;
                result.icon =  <FontIcon value='warning' style={{color: '#dddd19'}}/>;
                break;
            case NotificationType.NOTE:
                result.style = styles.note;
                result.icon =  <FontIcon value='assignment' style={{color: 'gray'}}/>;
                break;
        }
        result.systemTitle = t(`SYSTEMS.${systemTitle.toUpperCase()}`);
        result.header = t("HEADERS" + '.' + type);
        result.message = <NotificationMessage status={type} message={message} params={params} shortMessage={shortMessage ? shortMessage : ''} setHasCloseButton={::this.setHasCloseButton}/>;
        return result;
    }

    renderCloseButton(){
        if(this.state.hasCloseButton){
            return (
                <TooltipFontIcon size={16} isButton={true} id={'notification_close'} className={styles.close_icon} value={'close'} tooltip={'Close'} onClick={::this.closeNotification}/>
            );
        }
        return null;
    }

    render(){
        const {returnNull} = this.state;
        if(returnNull) return null;
        const {id} = this.props;
        let text = this.data.message || ErrorNotification.TEXT_ABSENT;
        return (
            <div className={styles.notification_show+ ' ' + this.data.style} id={id}>
                {this.renderCloseButton()}
                <div className={styles.notification_header}>
                    <div className={styles.notification_icon}>{this.data.icon}</div>
                        <div className={styles.notification_header_text}>
                            <span>{this.data.systemTitle}</span>
                            {
                                this.data.header !== ''
                                ?
                                    <span>
                                        {`. ${this.data.header}`}
                                    </span>
                                :
                                    null
                            }
                        </div>
                </div>
                <div className={styles.notification_message}>{text}</div>
            </div>
        );
    }
}

Notification.defaultProps = {
    timeOfBeing: 3500,
    hasCloseButton: false,
};

export default Notification;