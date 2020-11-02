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
import {connect} from "react-redux";
import {withTranslation} from "react-i18next";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import {getThemeClass, setFocusById} from "@utils/app";
import {fetchScheduleNotification} from "@actions/schedules/fetch";
import {updateScheduleNotification} from "@actions/schedules/update";
import {deleteScheduleNotification} from "@actions/schedules/delete";
import Dialog from "@basic_components/Dialog";
import NotificationChange from "./NotificationChange";
import Confirmation from "../../../../general/app/Confirmation";
import {validateChangeNotification} from "@validations/schedules";
import ValidationMessage from "@change_component/ValidationMessage";

import styles from "@themes/default/content/schedules/schedules.scss";
import {API_REQUEST_STATE} from "@utils/constants/app";
import Loading from "@loading";
import CSchedule from "@classes/components/content/schedule/CSchedule";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CScheduleControl from "@classes/voice_control/CScheduleControl";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        fetchingScheduleNotification: schedules.get('fetchingScheduleNotification'),
        updatingScheduleNotification: schedules.get('updatingScheduleNotification'),
        deletingScheduleNotification: schedules.get('deletingScheduleNotification'),
        notificationDetails: schedules.get('notification'),
    };
}

/**
 * List Item of Notification List
 */
@connect(mapStateToProps, {fetchScheduleNotification, updateScheduleNotification, deleteScheduleNotification})
@withTranslation(['schedules', 'app'])
class NotificationListItem extends Component{

    constructor(props){
        super(props);
        this.state = {
            notification: CNotification.createNotification(),
            isMouseOverItem: false,
            showUpdateNotificationDialog: false,
            showDeleteNotificationConfirmation: false,
            validationMessage: '',
            startFetchingNotification: false,
            startUpdatingNotification: false,
            startDeletingNotification: false,
        };
    }

    componentDidMount(){
        setFocusById('notification_search_input', 300);
        CVoiceControl.initCommands({component: this}, CScheduleControl);
    }

    componentDidUpdate(prevProps, prevState){
        const {fetchingScheduleNotification, updatingScheduleNotification, deletingScheduleNotification, notificationDetails} = this.props;
        const {startFetchingNotification, startUpdatingNotification, startDeletingNotification} = this.state;
        if(startFetchingNotification && fetchingScheduleNotification !== API_REQUEST_STATE.START) {
            this.setState({
                notification: CNotification.duplicateNotification(notificationDetails),
                showUpdateNotificationDialog: true,
                startFetchingNotification: false,
            });
        }
        if(startUpdatingNotification && updatingScheduleNotification !== API_REQUEST_STATE.START) {
            this.setState({
                startUpdatingNotification: false,
            });
        }
        if(startDeletingNotification && deletingScheduleNotification !== API_REQUEST_STATE.START) {
            this.setState({
                startDeletingNotification: false,
            });
        }
        if(this.props.notification.name !== prevProps.notification.name){
            CVoiceControl.removeCommands({component: this, props: prevProps, state: prevState}, CScheduleControl);
            CVoiceControl.initCommands({component: this}, CScheduleControl);
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component: this}, CScheduleControl);
    }

    /**
     * to change updating notification
     */
    changeNotification(notification){
        this.setState({
            notification,
            validationMessage: '',
        });
    }

    /**
     * to show actions
     */
    mouseOver(){
        this.setState({isMouseOverItem: true});
    }

    /**
     * to hide actions
     */
    mouseLeave(){
        this.setState({isMouseOverItem: false});
    }

    /**
     * to show/hide update notification dialog
     */
    toggleUpdateNotificationDialog(){
        this.setState({showUpdateNotificationDialog: !this.state.showUpdateNotificationDialog});
    }

    /**
     * to show/hide delete confirmation dialog
     */
    toggleDeleteNotificationConfirmation(){
        this.setState({showDeleteNotificationConfirmation: !this.state.showDeleteNotificationConfirmation});
    }

    /**
     * to open update dialog
     */
    fetchNotification(){
        const {schedule, notification, fetchScheduleNotification} = this.props;
        this.setState({startFetchingNotification: true});
        fetchScheduleNotification({...notification.getObject(), schedulerId: schedule.id});
    }

    /**
     * to update notification
     */
    updateNotification(){
        const {notification} = this.state;
        const {t, schedule, updateScheduleNotification} = this.props;
        let pureNotification = notification.getObject();
        const validateResult = validateChangeNotification(pureNotification);
        if(validateResult.success) {
            this.setState({startUpdatingNotification: true});
            updateScheduleNotification({...pureNotification, schedulerId: schedule.id});
            this.toggleUpdateNotificationDialog();
        } else{
            setFocusById(validateResult.id);
            this.setState({
                validationMessage: t(`schedules:NOTIFICATION.VALIDATION.${validateResult.message}`),
            });
        }
    }

    /**
     * to delete notification
     */
    deleteNotification(){
        const {schedule, notification, deleteScheduleNotification} = this.props;
        this.setState({startDeletingNotification: true});
        deleteScheduleNotification({...notification.getObject(), schedulerId: schedule.id});
        this.toggleDeleteNotificationConfirmation();
    }

    renderUpdateDialog(){
        const {showUpdateNotificationDialog, notification, validationMessage} = this.state;
        const {t} = this.props;
        return(
            <Dialog
                actions={[{
                    label: t('schedules:NOTIFICATION.UPDATE_DIALOG.UPDATE'),
                    onClick: ::this.updateNotification,
                    id: 'schedule_notification_add_ok'
                },{
                    label: t('schedules:NOTIFICATION.UPDATE_DIALOG.CANCEL'),
                    onClick: ::this.toggleUpdateNotificationDialog,
                    id: 'schedule_notification_add_cancel'
                }]}
                active={showUpdateNotificationDialog}
                toggle={::this.toggleUpdateNotificationDialog}
                title={t('schedules:NOTIFICATION.UPDATE_DIALOG.TITLE')}
                theme={{dialog: styles.notification_dialog}}
            >
                <NotificationChange notification={notification} changeNotification={::this.changeNotification}/>
                <ValidationMessage message={validationMessage}/>
            </Dialog>
        );
    }

    renderDeleteConfirmationDialog(){
        const {showDeleteNotificationConfirmation} = this.state;
        const {t} = this.props;
        return(
            <Confirmation
                okClick={::this.deleteNotification}
                cancelClick={::this.toggleDeleteNotificationConfirmation}
                active={showDeleteNotificationConfirmation}
                title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {isMouseOverItem, startFetchingNotification, startUpdatingNotification, startDeletingNotification} = this.state;
        const {authUser, t, notification, index} = this.props;
        let classNames = ['item', 'action', 'loading'];
        let title;
        const eventTypeTitle = notification.getTranslatedEventType(t);
        const notificationTypeTitle = notification.getTranslatedNotificationType(t);
        const showActions = isMouseOverItem || startFetchingNotification || startUpdatingNotification || startDeletingNotification;
        if(notification.name){
            title = `${notification.name} (${eventTypeTitle}/${notificationTypeTitle})`;
        } else{
            title = `${eventTypeTitle}/${notificationTypeTitle}`;
        }
        classNames = getThemeClass({classNames, authUser, styles});
        let itemStyles = {};
        if(showActions){
            itemStyles.width = '80%';
            itemStyles.background = '#DEEBFF';
        } else{
            itemStyles.width = '100%';
            itemStyles.background = 'none';
        }
        return (
            <div onMouseOver={::this.mouseOver} onMouseLeave={::this.mouseLeave}>
                <div key={notification.id} style={itemStyles} className={styles[classNames.item]} title={title}>
                    {title}
                </div>
                {
                    showActions
                    ?
                        <React.Fragment>
                            <span className={styles[classNames.action]}>
                                {
                                    startFetchingNotification || startUpdatingNotification
                                    ?
                                        <Loading className={styles[classNames.loading]}/>
                                    :
                                        <TooltipFontIcon
                                            id={`schedule_notification_update_${index}`}
                                            value={'edit'}
                                            tooltip={t('NOTIFICATION.UPDATE')}
                                            onClick={::this.fetchNotification}
                                        />
                                }
                            </span>
                            <span className={styles[classNames.action]}>
                                {
                                    startDeletingNotification
                                    ?
                                        <Loading className={styles[classNames.loading]}/>
                                    :
                                        <TooltipFontIcon
                                            id={`schedule_notification_delete_${index}`}
                                            value={'delete'}
                                            tooltip={t('NOTIFICATION.DELETE')}
                                            onClick={::this.toggleDeleteNotificationConfirmation}
                                        />
                                }
                            </span>
                        </React.Fragment>
                    :
                        null
                }
                {::this.renderUpdateDialog()}
                {::this.renderDeleteConfirmationDialog()}
            </div>
        );
    }
}

NotificationListItem.propTypes = {
    schedule: PropTypes.instanceOf(CSchedule).isRequired,
    notification: PropTypes.instanceOf(CNotification).isRequired,
    index: PropTypes.number.isRequired,
};

export default NotificationListItem;