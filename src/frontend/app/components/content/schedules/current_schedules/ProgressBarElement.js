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
import styles from '@themes/default/content/schedules/schedules.scss';
import {getThemeClass} from "@utils/app";
import {shuffle} from "@utils/app";
import ProgressBar from "@basic_components/ProgressBar";


/**
 * Component for ProgressBarElement
 */
class ProgressBarElement extends Component{

    constructor(props){
        super(props);

        this.state = {
            progress: 0,
        };
        this.steps = this.calculateStep();
        this.progression = this.calculateProgression();
        this.iterator = 0;
    }

    componentDidMount() {
        this.simulateProgress();
    }

    calculateStep(){
        let {avgDuration} = this.props.schedule;
        if(avgDuration === 0){
            avgDuration = 7000;
        }
        avgDuration = avgDuration / 1000;
        let result = [];
        const steps = [[400, 600], [500, 500], [1000, 0]];
        for(let i = 0; i < avgDuration; i++){
            let index = parseInt(Math.random() * (0 - 3) + 3);
            result.push(steps[index][0]);
            if(steps[index][1] !== 0) {
                result.push(steps[index][1]);
            }
        }
        return shuffle(result);
    }

    calculateProgression(){
        const stepsAmount = this.steps.length;
        let result = [];
        let progressIterator = parseInt(95 / stepsAmount);
        let sum = 0;
        for(let i = 0; i < stepsAmount; i++){
            let value = sum >= 95 ? 1 : progressIterator * parseInt(Math.random() * (1 - 3) + 3);
            if(sum + value > 100){
                value = 100 - sum;
            }
            result.push(value);
            sum += value;
        }
        return result;
    }

    /**
     * (only for testing) simulate process of progressing
     */
    simulateProgress () {
        setTimeout(() => {
            if (this.state.progress < 100) {
                if(this.progression[this.iterator] + this.state.progress > this.state.progress) {
                    this.setState({
                        progress: this.progression[this.iterator] + this.state.progress
                    });
                }
            }
            this.iterator++;
            this.simulateProgress();
        }, this.steps[this.iterator]);
    }

    render(){
        const {authUser, schedule, iterator} = this.props;
        const {progress} = this.state;
        let classNames = [
            'progress_bar_element',
            'progress_bar_iterator',
            'progress_bar_section',
            'progress_bar_from',
            'progress_bar_title',
            'progress_bar',
            'progress_bar_to',
            'progress_bar_value',
            'progress_bar_buffer',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <div className={styles[classNames.progress_bar_element]}>
                <div className={styles[classNames.progress_bar_iterator]}>{iterator}.</div>
                <div className={styles[classNames.progress_bar_section]}>
                    <div className={styles[classNames.progress_bar_from]}>
                        <span>{schedule.fromConnector}</span>
                    </div>
                    <div className={styles[classNames.progress_bar_title]}>{schedule.title}</div>
                    <ProgressBar
                        type="linear"
                        mode="determinate"
                        value={progress}
                        buffer={100}
                        theme={{
                            linear: styles[classNames.progress_bar],
                            value: styles[classNames.progress_bar_value],
                            buffer: styles[classNames.progress_bar_buffer],
                        }}
                    />
                    <div className={styles[classNames.progress_bar_to]}>
                        <span>{schedule.toConnector}</span>
                    </div>
                </div>
            </div>

        );
    }
}

ProgressBarElement.propTypes = {
    authUser: PropTypes.object.isRequired,
    schedule: PropTypes.object.isRequired,
};

export default ProgressBarElement;