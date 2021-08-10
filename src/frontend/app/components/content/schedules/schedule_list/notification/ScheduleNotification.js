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
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {withTranslation} from "react-i18next";
import {permission} from "@decorators/permission";
import {SchedulePermissions} from "@utils/constants/permissions";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {getThemeClass} from "@utils/app";
import NotificationList from "./NotificationList";
import {addScheduleNotification} from "@actions/schedules/add";
import {fetchScheduleNotifications} from "@actions/schedules/fetch";

import styles from '@themes/default/content/schedules/schedules.scss';
import {API_REQUEST_STATE} from "@utils/constants/app";
import CNotification from "@classes/components/content/schedule/notification/CNotification";
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CScheduleControl from "@classes/voice_control/CScheduleControl";
import {schedules} from "@root/app/reducers/schedules";
import CSchedule from "@classes/components/content/schedule/CSchedule";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        stateSchedule: schedules.get('schedule'),
        fetchingScheduleNotifications: schedules.get('fetchingScheduleNotifications'),
        notifications: schedules.get('notifications').toJS().map(notification => CNotification.createNotification(notification)),
    };
}

/**
 * Component to set Notifications for Schedule
 */
@connect(mapStateToProps, {addScheduleNotification, fetchScheduleNotifications})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class ScheduleNotification extends Component{

    constructor(props){
        super(props);

        this.state = {
            showScheduleNotifications: false,
            animationName: styles.AScaleAppear,
            startFetchingScheduleNotifications: false,
        };
    }

    componentDidMount(){
        CVoiceControl.initCommands({component: this}, CScheduleControl);
    }

    componentDidUpdate(prevProps, prevState){
        const {startFetchingScheduleNotifications, showScheduleNotifications, animationName} = this.state;
        const {fetchingScheduleNotifications, stateSchedule, schedule} = this.props;
        if(startFetchingScheduleNotifications && fetchingScheduleNotifications !== API_REQUEST_STATE.START) {
            this.setState({
                startFetchingScheduleNotifications: false,
                animationName: styles.AScaleAppear,
                showScheduleNotifications: true,
            });
        }
        if(showScheduleNotifications && animationName === styles.AScaleAppear && stateSchedule && stateSchedule.schedulerId !== schedule.id){
            this.closeNotificationList();
        }
        if(this.props.schedule.title !== prevProps.schedule.title){
            CVoiceControl.removeCommands({component: this, props: prevProps, state: prevState}, CScheduleControl);
            CVoiceControl.initCommands({component: this}, CScheduleControl);
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component: this}, CScheduleControl);
    }

    /**
     * to close notification list
     */
    closeNotificationList(){
        let that = this;
        this.setState({animationName: styles.AScaleDisappear});
        setTimeout(() => {that.setState({showScheduleNotifications: false});}, 250);
    }

    /**
     * to show/hide notification list
     */
    toggleScheduleNotification(){
        const {showScheduleNotifications} = this.state;
        if(showScheduleNotifications){
            this.closeNotificationList();
        } else {
            this.fetchNotifications();
        }
    }

    /**
     * to fetch all notifications of schedule
     */
    fetchNotifications(){
        const {schedule, fetchScheduleNotifications} = this.props;
        fetchScheduleNotifications(schedule.getObject());
        this.setState({
            startFetchingScheduleNotifications: true,
        });
    }

    renderDialogScheduleNotification(){
        const {animationName, showScheduleNotifications} = this.state;
        const {schedule, notifications} = this.props;
        if(showScheduleNotifications) {
            return <NotificationList
                index={schedule.id}
                schedule={schedule}
                notifications={notifications}
                closeNotificationList={::this.closeNotificationList}
                listStyles={{animation: `${animationName} 0.25s forwards`}}
            />;
        }
        return null;
    }

    render(){
        const {startFetchingScheduleNotifications} = this.state;
        const {t, authUser, schedule} = this.props;
        let classNames = ['schedule_list_action', 'notifications_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        let icon = 'mail';
        if(startFetchingScheduleNotifications){
            icon = 'loading';
        }
        return (
            <span style={{position: 'relative'}}>
                <TooltipFontIcon
                    isButton={true}
                    iconClassName={styles[classNames.schedule_list_action]}
                    id={`schedule_update_${schedule.id}`}
                    value={icon}
                    tooltip={t('LIST.TOOLTIP_NOTIFICATION_ICON')}
                    onClick={::this.toggleScheduleNotification}
                    turquoiseTheme
                />
                {this.renderDialogScheduleNotification()}
            </span>
        );
    }
}

ScheduleNotification.propTypes = {
    schedule: PropTypes.instanceOf(CSchedule).isRequired,
};

export default ScheduleNotification;