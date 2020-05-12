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
@permission(SchedulePermissions.UPDATE, false)
@withTranslation(['schedules', 'app'])
class NotificationList extends Component{

    constructor(props){
        super(props);
        this.state = {
            notification: CNotification.createNotification(),
            showUpdateDialog: false,
            showDeleteConfirmation: false,
        };
    }

    changeNotification(notification){
        this.setState({notification});
    }

    /**
     * to show/hide update notification dialog
     */
    toggleUpdateDialog(){
        this.setState({showUpdateDialog: !this.state.showUpdateDialog});
    }

    /**
     * to show/hide delete confirmation dialog
     */
    toggleDeleteConfirmation(){
        this.setState({showDeleteConfirmation: !this.state.showDeleteConfirmation});
    }

    openUpdate(e, notification){
        this.setState({
            notification: CNotification.duplicateNotification(notification),
            showUpdateDialog: true,
        });
    }

    updateNotification(){
        const {notification} = this.state;
        const {updateScheduleNotification} = this.props;
        updateScheduleNotification(notification);
    }

    deleteNotification(){
        const {notification} = this.state;
        const {deleteScheduleNotification} = this.props;
        deleteScheduleNotification(notification);
    }

    renderDeleteConfirmationDialog(){
        const {showDeleteConfirmation} = this.state;
        const {t} = this.props;
        return(
            <Confirmation
                okClick={::this.deleteNotification}
                cancelClick={::this.toggleDeleteConfirmation}
                active={showDeleteConfirmation}
                title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
            />
        );
    }

    renderUpdateDialog(){
        const {showUpdateDialog, notification} = this.state;
        return(
            <Dialog
                actions={[{label: 'Update', onClick: ::this.updateNotification, id: 'schedule_notification_add_ok'},{label: 'Cancel', onClick: ::this.toggleUpdateDialog, id: 'schedule_notification_add_cancel'}]}
                active={showUpdateDialog}
                onEscKeyDown={::this.toggleUpdateDialog}
                onOverlayClick={::this.toggleUpdateDialog}
                title={'Update Notification'}
            >
                <NotificationChange mode={'update'} notification={notification} changeNotification={::this.changeNotification}/>
            </Dialog>
        );
    }

    render(){
        const {t, authUser, schedule} = this.props;
        let classNames = ['schedule_list_action', 'notifications'];
        classNames = getThemeClass({classNames, authUser, styles});
        const {notifications} = schedule;
        return (
            <React.Fragment>
                <Table authUser={authUser} selectable={false} className={styles[classNames.notifications]}>
                    <TableHead>
                        <TableCell><span>{t('NOTIFICATION.NAME')}</span></TableCell>
                        <TableCell><span>{t('NOTIFICATION.EVENT_TYPE')}</span></TableCell>
                        <TableCell><span>{t('NOTIFICATION.NOTIFICATION_TYPE')}</span></TableCell>
                        <TableCell><span>{t('NOTIFICATION.ACTION')}</span></TableCell>
                    </TableHead>
                    {
                        notifications.map((notification, key) => {
                            return (
                                <TableRow key={notification.id}>
                                    <TableCell>
                                        <span title={notification.name}>{notification.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span title={notification.eventType}>{notification.eventType}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span title={notification.notificationType}>{notification.notificationType}</span>
                                    </TableCell>
                                    <TableCell>
                                        <span className={styles[classNames.schedule_list_action]}>
                                            <TooltipFontIcon
                                                id={`schedule_notification_update_${key}`}
                                                value={'edit'}
                                                tooltip={t('NOTIFICATION.UPDATE')}
                                                onClick={(e) => ::this.openUpdate(e, notification)}
                                            />
                                        </span>
                                        <span className={styles[classNames.schedule_list_action]}>
                                            <TooltipFontIcon
                                                id={`schedule_notification_delete_${key}`}
                                                value={'delete'}
                                                tooltip={t('NOTIFICATION.DELETE')}
                                                onClick={::this.toggleDeleteConfirmation}
                                            />
                                        </span>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    }
                </Table>
                {::this.renderUpdateDialog()}
                {::this.renderDeleteConfirmationDialog()}
            </React.Fragment>
        );
    }
}

NotificationList.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default NotificationList;