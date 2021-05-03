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
import {permission} from "@decorators/permission";
import {deleteSchedule} from '@actions/schedules/delete';
import {SchedulePermissions} from "@utils/constants/permissions";
import {withTranslation} from "react-i18next";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import Confirmation from "../../../general/app/Confirmation";
import {getThemeClass} from "@utils/app";
import styles from '@themes/default/content/schedules/schedules.scss';
import CVoiceControl from "@classes/voice_control/CVoiceControl";
import CScheduleControl from "@classes/voice_control/CScheduleControl";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        deletingSchedule: schedules.get('deletingSchedule'),
        stateSchedule: schedules.get('schedule'),
    };
}

/**
 * Component to delete one schedule
 */
@connect(mapStateToProps, {deleteSchedule})
@permission(SchedulePermissions.DELETE, false)
@withTranslation(['app', 'schedules'])
class ScheduleDelete extends Component{

    constructor(props){
        super(props);

        this.state = {
            showConfirm: false,
        };
    }

    componentDidMount(){
        CVoiceControl.initCommands({component: this}, CScheduleControl);
    }

    componentDidUpdate(prevProps, prevState){
        if(this.props.schedule.title !== prevProps.schedule.title){
            CVoiceControl.removeCommands({component: this, props: prevProps, state: prevState}, CScheduleControl);
            CVoiceControl.initCommands({component: this}, CScheduleControl);
        }
    }

    componentWillUnmount(){
        CVoiceControl.removeCommands({component: this}, CScheduleControl);
    }

    /**
     * to toggle confirmation window
     */
    toggleConfirmDelete(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to delete one schedule
     */
    deleteSchedule(){
        const {schedule, deleteSchedule, deleteCheck} = this.props;
        deleteCheck();
        deleteSchedule(schedule.getObject());
        this.toggleConfirmDelete();
    }

    renderConfirmation(){
        const {t} = this.props;
        const {showConfirm} = this.state;
        return (
            <Confirmation
                okClick={::this.deleteSchedule}
                cancelClick={::this.toggleConfirmDelete}
                active={showConfirm}
                title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {t, authUser, schedule, stateSchedule, deletingSchedule, index} = this.props;
        let classNames = ['schedule_list_action', 'schedule_delete_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        let icon = 'delete';
        if(stateSchedule && stateSchedule.id === schedule.id && deletingSchedule){
            icon = 'loading';
        }
        return (
            <span>
                <TooltipFontIcon
                    isButton={true}
                    iconClassName={styles[classNames.schedule_list_action]}
                    id={`schedule_delete_${index}`}
                    value={icon}
                    tooltip={t('schedules:LIST.TOOLTIP_DELETE_ICON')}
                    onClick={::this.toggleConfirmDelete}
                    blueTheme={true}
                />
                {this.renderConfirmation()}
            </span>
        );
    }
}

ScheduleDelete.propTypes = {
    schedule: PropTypes.object.isRequired,
    deleteCheck: PropTypes.func.isRequired,
    index: PropTypes.number.isRequired,
};

export default ScheduleDelete;