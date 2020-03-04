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
import {withTranslation} from "react-i18next";

import {NotificationType} from '../../../utils/constants/notifications/notifications';
import NotificationMessage from '../../../utils/constants/notifications/NotificationMessage';
import {ErrorNotification} from '../../../utils/constants/errors';

import styles from '../../../themes/default/general/app.scss';
import FontIcon from "../basic_components/FontIcon";


/**
 * Notification Component
 */
@withTranslation('notifications')
class Notification extends Component{

    constructor(props){
        super(props);

        this.data = this.selectData();
    }

    componentDidMount(){
        let that = this;
        const {id} = that.props;
        setTimeout(function(){
            let element = document.getElementById(id);
            if(element){
                element.classList.remove(styles['notification_show']);
                element.classList.add(styles['notification_hide']);
            }
        }, 3500);
    }

    /**
     * to select data to notify
     */
    selectData(){
        const {data, params, t} = this.props;
        const {type, message, systemTitle} = data;
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
                result.icon =  <FontIcon value='warning'  style={{color: '#dddd19'}}/>;
                break;
            case NotificationType.NOTE:
                result.style = styles.note;
                result.icon =  <FontIcon value='note'  style={{color: 'gray'}}/>;
                break;
        }
        result.systemTitle = t(`SYSTEMS.${systemTitle.toUpperCase()}`);
        result.header = t("HEADERS" + '.' + type);
        result.message = <NotificationMessage status={type} message={message} params={params}/>;
        return result;
    }

    render(){
        const {id} = this.props;
        let text = this.data.message || ErrorNotification.TEXT_ABSENT;
        return (
            <div className={styles.notification_show+ ' ' + this.data.style} id={id}>
                <div className={styles.notification_header}>
                    <div className={styles.notification_icon}>{this.data.icon}</div>
                    <div className={styles.notification_header_text}>{this.data.systemTitle}{`. `}<span>{this.data.header}</span></div>
                </div>
                <div className={styles.notification_message}>{text}</div>
            </div>
        );
    }
}

export default Notification;