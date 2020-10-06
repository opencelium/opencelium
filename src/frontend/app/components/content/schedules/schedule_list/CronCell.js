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
import {convertCronExpForSchedulerlist,} from "@utils/app";
import styles from '@themes/default/content/schedules/schedules.scss';
import PopupText from "@basic_components/PopupText";


/**
 * Cell Component to display date for ScheduleList
 */
class CronCell extends Component{

    constructor(props){
        super(props);
    }

    renderData(){
        const {schedule, isFirst} = this.props;
        if(schedule) {
            const {cronExp} = schedule;
            return (
                <div>
                    <span className={`${isFirst ? 'tour-step-8' : ''}`}>{cronExp}</span>
                    {/*<PopupText
                        className={`${styles.date_cell_cron} ${isFirst ? 'tour-step-8' : ''}`}
                        text={'cron'}
                        popupText={convertCronExpForSchedulerlist(cronExp)}/>*/}
                </div>
            );
        }
        return null;
    }

    render(){
        return (
            <td>
                {::this.renderData()}
            </td>
        );
    }
}

CronCell.propTypes = {
    authUser: PropTypes.object.isRequired,
    schedule: PropTypes.object,
};

CronCell.defaultProps = {
    schedule: null,
};

export default CronCell;