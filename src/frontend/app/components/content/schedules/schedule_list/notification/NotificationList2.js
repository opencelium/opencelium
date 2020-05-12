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
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {permission} from "../../../../../decorators/permission";
import {SchedulePermissions} from "../../../../../utils/constants/permissions";
import TooltipFontIcon from "../../../../general/basic_components/tooltips/TooltipFontIcon";
import {getThemeClass} from "../../../../../utils/app";
import styles from '../../../../../themes/default/content/schedules/schedules.scss';
import Dialog from "../../../../general/basic_components/Dialog";
import {TableCell, TableHead, TableRow} from "react-toolbox/lib/table";
import Table from "../../../../general/basic_components/table/Table";
import NotificationChange from "./NotificationChange";
import Confirmation from "../../../../general/app/Confirmation";
import {updateScheduleNotification} from "../../../../../actions/schedules/update";
import {deleteScheduleNotification} from "../../../../../actions/schedules/delete";
import CNotification from "../../../../../classes/components/content/schedule/CNotification";
import NotificationList from "./NotificationList";
import Button from "../../../../general/basic_components/buttons/Button";
import NotificationListItem from "./NotificationListItem";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to set notification for schedule
 */
@connect(mapStateToProps, {updateScheduleNotification, deleteScheduleNotification})
@withTranslation(['schedules', 'app'])
class NotificationList2 extends Component{

    constructor(props){
        super(props);
        this.state = {
            newNotification: CNotification.createNotification(),
            showAddDialog: false,
        };
    }

    changeNewNotification(newNotification){
        this.setState({newNotification});
    }

    /**
     * to show/hide schedule add notification dialog
     */
    toggleAddDialog(){
        this.setState({
            newNotification: CNotification.createNotification(),
            showAddDialog: !this.state.showAddDialog},
        );
    }

    addNotification(){
        const {newNotification} = this.state;
        const {addScheduleNotification} = this.props;
        addScheduleNotification(newNotification);
    }

    renderNotifications(){
        const {schedule} = this.props;
        return schedule.notifications.map((notification, key) => {
            return (
                <NotificationListItem notification={notification} index={key}/>
            );
        });
    }

    render(){
        const {showAddDialog, newNotification} = this.state;
        const {authUser, closeNotificationList, listStyles} = this.props;
        let classNames = [
            'notification_list',
            'notification_add_button',
            'notification_dialog_body',
            'items',
            'add_icon',
            'close_icon',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        console.log(listStyles);
        return(
            <div className={styles[classNames.notification_list]} style={{...listStyles}}>
                <div className={styles[classNames.items]}>
                    {this.renderNotifications()}
                </div>
                <TooltipFontIcon
                    tooltip={'Add Notification'}
                    value={'add'}
                    onClick={::this.toggleAddDialog}
                    className={styles[classNames.add_icon]}
                />
                <TooltipFontIcon
                    tooltip={'Close'}
                    value={'close'}
                    onClick={closeNotificationList}
                    className={styles[classNames.close_icon]}
                />
                <Dialog
                    actions={[{label: 'Add', onClick: ::this.addNotification, id: 'schedule_notification_add_ok'},{label: 'Cancel', onClick: ::this.toggleAddDialog, id: 'schedule_notification_add_cancel'}]}
                    active={showAddDialog}
                    onEscKeyDown={::this.toggleAddDialog}
                    onOverlayClick={::this.toggleAddDialog}
                    title={'Add Notification'}
                >
                    <NotificationChange notification={newNotification} changeNotification={::this.changeNewNotification}/>
                </Dialog>
            </div>
        );
    }
}

NotificationList2.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default NotificationList2;