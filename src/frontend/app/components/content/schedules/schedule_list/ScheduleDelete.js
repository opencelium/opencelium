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
import {permission} from "../../../../decorators/permission";
import {deleteSchedule} from '../../../../actions/schedules/delete';
import {SchedulePermissions} from "../../../../utils/constants/permissions";
import {withTranslation} from "react-i18next";
import TooltipFontIcon from "../../../general/basic_components/tooltips/TooltipFontIcon";
import Confirmation from "../../../general/app/Confirmation";
import {getThemeClass} from "../../../../utils/app";
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import Loading from "../../../general/app/Loading";


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

    /**
     * to toggle confirmation window
     */
    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    /**
     * to delete one schedule
     */
    deleteSchedule(){
        const {schedule, deleteSchedule, deleteCheck} = this.props;
        deleteCheck();
        deleteSchedule(schedule.getObject());
        this.toggleConfirm();
    }

    renderConfirmation(){
        const {t} = this.props;
        const {showConfirm} = this.state;
        return (
            <Confirmation
                okClick={::this.deleteSchedule}
                cancelClick={::this.toggleConfirm}
                active={showConfirm}
                title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
            />
        );
    }

    render(){
        const {t, authUser, schedule, stateSchedule, deletingSchedule} = this.props;
        let classNames = ['schedule_list_action', 'schedule_delete_loading'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={styles[classNames.schedule_list_action]}>
                {

                    stateSchedule && stateSchedule.id === schedule.id && deletingSchedule
                        ?
                            <Loading authUser={authUser} className={styles[classNames.schedule_delete_loading]}/>
                        :
                            <TooltipFontIcon value={'delete'} tooltip={t('schedules:LIST.TOOLTIP_DELETE_ICON')} onClick={::this.toggleConfirm}/>
                }
                {this.renderConfirmation()}
            </span>
        );
    }
}

ScheduleDelete.propTypes = {
    schedule: PropTypes.object.isRequired,
    deleteCheck: PropTypes.func.isRequired,
};

export default ScheduleDelete;