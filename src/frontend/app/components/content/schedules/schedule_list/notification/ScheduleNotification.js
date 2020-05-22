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
import NotificationList from "./NotificationList";
import {addScheduleNotification} from "../../../../../actions/schedules/add";

import styles from '../../../../../themes/default/content/schedules/schedules.scss';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to set Notifications for Schedule
 */
@connect(mapStateToProps, {addScheduleNotification})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class ScheduleNotification extends Component{

    constructor(props){
        super(props);

        this.state = {
            showScheduleNotification: false,
            animationName: styles.AScaleAppear,
        };
    }

    /**
     * to close notification list
     */
    closeNotificationList(){
        let that = this;
        this.setState({animationName: styles.AScaleDisappear});
        setTimeout(() => {that.setState({showScheduleNotification: false});}, 250);
    }

    /**
     * to show/hide notification list
     */
    toggleScheduleNotification(){
        const {showScheduleNotification} = this.state;
        if(showScheduleNotification){
            this.closeNotificationList();
        } else {
            this.setState({animationName: styles.AScaleAppear, showScheduleNotification: true});
        }
    }

    renderDialogScheduleNotification(){
        const {animationName, showScheduleNotification} = this.state;
        const {schedule} = this.props;
        if(showScheduleNotification) {
            return <NotificationList
                schedule={schedule}
                closeNotificationList={::this.closeNotificationList}
                listStyles={{animation: `${animationName} 0.25s forwards`}}
            />;
        }
        return null;
    }

    render(){
        const {t, authUser, index} = this.props;
        let classNames = ['schedule_list_action'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={styles[classNames.schedule_list_action]}>
                <TooltipFontIcon
                    id={`schedule_update_${index}`}
                    value={'mail'}
                    tooltip={t('LIST.TOOLTIP_NOTIFICATION_ICON')}
                    onClick={::this.toggleScheduleNotification}
                />
                {this.renderDialogScheduleNotification()}
            </span>
        );
    }
}

ScheduleNotification.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default ScheduleNotification;