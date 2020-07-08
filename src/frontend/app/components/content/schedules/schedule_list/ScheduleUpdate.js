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
import {permission} from "@decorators/permission";
import {SchedulePermissions} from "@utils/constants/permissions";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import {getThemeClass, setFocusById} from "@utils/app";
import styles from '@themes/default/content/schedules/schedules.scss';
import Input from "@basic_components/inputs/Input";
import {updateSchedule} from '@actions/schedules/update';
import Dialog from "@basic_components/Dialog";


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}

/**
 * Component to update one schedule
 */
@connect(mapStateToProps, {updateSchedule})
@permission(SchedulePermissions.UPDATE, false)
@withTranslation('schedules')
class ScheduleUpdate extends Component{

    constructor(props){
        super(props);

        this.state = {
            showUpdateSchedule: false,
            scheduleTitle: props.schedule.title,
        };
    }

    /**
     * to update schedule
     */
    updateSchedule(){
        const {updateSchedule} = this.props;
        let {schedule} = this.props;
        const {scheduleTitle} = this.state;
        if(schedule.title !== scheduleTitle) {
            schedule.title = scheduleTitle;
            updateSchedule(schedule.getObject());
        }
        this.toggleUpdateSchedule();
    }

    /**
     * to set schedule title
     */
    setScheduleTitle(scheduleTitle){
        this.setState({
            scheduleTitle,
        });
    }

    /**
     * to show/hide update schedule
     */
    toggleUpdateSchedule(){
        this.setState({showUpdateSchedule: !this.state.showUpdateSchedule});
    }

    renderDialogUpdateSchedule(){
        return (
            <Dialog
                actions={[{label: 'Ok', onClick: ::this.updateSchedule, id: 'schedule_update_ok'}, {label: 'Cancel', onClick: ::this.toggleUpdateSchedule, id: 'schedule_update_cancel'}]}
                active={this.state.showUpdateSchedule}
                onEscKeyDown={::this.toggleUpdateSchedule}
                onOverlayClick={::this.toggleUpdateSchedule}
                title={'Update Schedule'}
            >
                <Input
                    name={'title'}
                    onChange={::this.setScheduleTitle}
                    value={this.state.scheduleTitle}
                    label={'title'}
                    hasFocus={true}
                />
            </Dialog>
        );
    }

    render(){
        const {t, authUser, index} = this.props;
        let classNames = ['schedule_list_action'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <span className={styles[classNames.schedule_list_action]}>
                <TooltipFontIcon
                    id={`schedule_update_${index}`}
                    value={'edit'}
                    tooltip={t('LIST.TOOLTIP_UPDATE_ICON')}
                    onClick={::this.toggleUpdateSchedule}
                />
                {this.renderDialogUpdateSchedule()}
            </span>
        );
    }
}

ScheduleUpdate.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
};

export default ScheduleUpdate;