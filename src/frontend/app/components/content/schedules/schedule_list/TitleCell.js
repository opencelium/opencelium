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
import WebHook from "./WebHook";
import styles from '../../../../themes/default/content/schedules/schedules.scss';
import {EMPHASIZE_DURATION_ANIMATION} from "./ScheduleList";


/**
 * Cell Component to display date for ScheduleList
 */
class TitleCell extends Component{

    constructor(props){
        super(props);

        this.appearClassName = '';
    }

    componentDidUpdate(prevProps){
        if(this.appearClassName !== '') {
            this.appearClassName = '';
            let that = this;
            setTimeout(() => {if(that) that.forceUpdate();}, EMPHASIZE_DURATION_ANIMATION);
        } else{
            let newTitle = this.props.schedule.title;
            let oldTitle = prevProps.schedule.title;
            if(newTitle !== oldTitle) {
                this.appearClassName = styles.emphasize_cell;
            }
        }
    }

    render(){
        const {schedule} = this.props;
        return (
            <TableCell style={{position: 'relative'}}>
                <WebHook schedule={schedule}/>
                <div className={`${styles.title_cell} ${styles.schedule_list_title} ${this.appearClassName}`} title={schedule.title}>
                    <span>{schedule.title}</span>
                </div>
            </TableCell>
        );
    }
}

TitleCell.propTypes = {
    schedule: PropTypes.object.isRequired,
};

TitleCell.defaultProps = {
    schedule: null,
};

export default TitleCell;