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
import {TableCell} from 'react-toolbox/lib/table';
import {NO_DATA} from "../../../../utils/constants/app";

import styles from '../../../../themes/default/content/schedules/schedules.scss';
import {EMPHASIZE_DURATION_ANIMATION} from "./ScheduleList";

/**
 * Cell Component to display last success duration for ScheduleList
 */
class LastDurationCell extends Component{

    constructor(props){
        super(props);

        this.state = {
            schedule: null,
            appearClassName: '',
        };
    }
    componentDidUpdate(prevProps){
        const {appearClassName} = this.state;
        let newTime = this.props.schedule.getSuccessDuration();
        let newId = this.props.schedule.id;
        let oldTime = prevProps.schedule.getSuccessDuration();
        let oldId = prevProps.schedule.id;
        if(newTime !== NO_DATA) {
            if(newId === oldId && newTime !== oldTime && appearClassName !== styles.emphasize_cell) {
                this.setState({appearClassName: styles.emphasize_cell});
                setTimeout(() => {this.setState({appearClassName: ''});}, 2000);
            }
        } else{
            if(appearClassName !== '') {
                this.setState({appearClassName: ''});
            }
        }
    }

    render(){
        const {appearClassName} = this.state;
        const {t, schedule} = this.props;
        let duration = schedule.getSuccessDuration();
        if(duration){
            duration = parseInt(duration / 1000);
        }
        return (
            <TableCell>
                <span className={`${styles.last_success_cell} ${appearClassName}`}>
                    {duration} {duration !== NO_DATA ? t('LIST.LAST_DURATION_SEC') : ''}
                </span>
            </TableCell>
        );
    }
}

LastDurationCell.propTypes = {
    schedule: PropTypes.object.isRequired,
};

export default LastDurationCell;