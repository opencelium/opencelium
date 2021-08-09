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
import WebHook from "./WebHook";
import styles from '@themes/default/content/schedules/schedules.scss';
import CSchedule from "@classes/components/content/schedule/CSchedule";


/**
 * Cell Component to display date for ScheduleList
 */
class TitleCell extends Component{

    constructor(props){
        super(props);

        this.state = {
            appearClassName: '',
        };
    }

    componentDidUpdate(prevProps){
        const {appearClassName} = this.state;
        let newTitle = this.props.schedule.title;
        let newId = this.props.schedule.id;
        let oldTitle = prevProps.schedule.title;
        let oldId = prevProps.schedule.id;
        if(newId === oldId && newTitle !== oldTitle && appearClassName !== styles.emphasize_cell) {
            this.setState({appearClassName: styles.emphasize_cell});
            setTimeout(() => {this.setState({appearClassName: ''});}, 2000);
        }
    }

    render(){
        const {appearClassName} = this.state;
        const {schedule, index} = this.props;
        return (
            <td style={{position: 'relative'}}>
                <WebHook index={index} schedule={CSchedule.createSchedule(schedule)}/>
                <div className={`${styles.title_cell} ${styles.schedule_list_title} ${appearClassName}`} style={{animationDelay: '0.5s'}} title={schedule.title}>
                    <span>{schedule.title}</span>
                </div>
            </td>
        );
    }
}

TitleCell.propTypes = {
    schedule: PropTypes.object.isRequired,
    index: PropTypes.number,
};

TitleCell.defaultProps = {
    schedule: null,
    index: 0,
};

export default TitleCell;