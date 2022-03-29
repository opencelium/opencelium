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
import cronParser from 'cron-parser';
import Dialog from "@atom/dialog/Dialog";
import {
    CronDayForMonthStyled,
    CronEverySelectStyled, CronGeneratorStyled,
    CronStartAtSelectStyled,
    CronStartHourSelectStyled, CronStartMinuteSelectStyled,
    CronSuffixHourStyled, CronSuffixMinuteStyled,
    CronSuffixStyled,
    CronTimeStampStyled,
    EachStyled,
    EveryForWeekSelectStyled, ExampleStyled,
    OfAStyled,
    SuffixDayForMonthStyled
} from "@atom/input/cron_exp/styles";
import {Console} from "@class/application/Console";
import {ColorTheme} from "../../../general/Theme";
import Button from "@atom/button/Button";
import {ALL_MONTHS, convertTimeForCronExpression} from "@atom/input/cron_exp/utils";
import {TextSize} from "@atom/text/interfaces";
import Text from "@atom/text/Text";


/**
 * Cron Expression Generator for Schedule Add
 */
class CronGenerator extends Component{

    constructor(props){
        super(props);

        const timeStampOptions = this.getTimeStampOptions('at');
        const everyOptions = this.getEveryOptions('minute', true);

        this.state = {
            show: false,
            atOrEach: {label: 'At', value: 'at'},
            atOrEachOfHour: {label: 'At', value: 'at'},
            startAtShow: false,
            dayShow: false,
            dayForMonth: [everyOptions[0]],
            cronExp: '0 1 * * * ?',
            timeStamp: timeStampOptions[0],
            timeStampOptions,
            everyValue: everyOptions[0],
            everyOptions,
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
            examples: this.defineExamples('0 1 * * * ?'),
        };
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        const {atOrEach, atOrEachOfHour, dayForMonth, timeStamp, everyValue, startAtHour, startAtMinute} = this.state;
        if(atOrEach.value !== prevState.atOrEach.value || dayForMonth.length !== prevState.dayForMonth.length
            || timeStamp.value !== prevState.timeStamp.value || everyValue.value !== prevState.everyValue.value
            || startAtHour.value !== prevState.startAtHour.value || startAtMinute.value !== prevState.startAtMinute.value
            || everyValue.length !== prevState.everyValue.length || dayForMonth.value !== prevState.dayForMonth.value
            || atOrEachOfHour.value !== prevState.atOrEachOfHour.value
        ){
            this.setState({
                examples: this.defineExamples(),
            });
        }
    }

    defineExamples(cronExp = null) {
        try {
            cronExp = cronExp === null ? this.getCronExp() : cronExp;
            const interval = cronParser.parseExpression(cronExp);
            let examples = [];
            for(let i = 0; i < 5; i++){
                examples.push(convertTimeForCronExpression(interval.next().toString()));
            }
            return examples;
        } catch (err) {
            Console.print(err.message);
        }
    }

    getCronExp(){
        const {atOrEach, atOrEachOfHour, dayForMonth, timeStamp, everyValue, startAtHour, startAtMinute} = this.state;
        let cronExp = '';
        const isForWeek = timeStamp.value === 'week';
        let value = everyValue;
        if(isForWeek){
            value = value.map(v => v.value).join(',');
        } else{
            value = value.value;
        }
        let minuteValue = startAtMinute.value;
        let hourValue = startAtHour.value;
        const isAt = atOrEach.value === 'at';
        const isAtOfHour = atOrEachOfHour.value === 'at';
        if(!isAtOfHour){
            if(parseInt(hourValue) === 0){
                hourValue = '*';
                minuteValue = parseInt(minuteValue) === 0 ? `*` : `*/${minuteValue}`;
            } else{
                hourValue = `*/${hourValue}`;
            }
        }
        const dayForMonthValue = isAt ? dayForMonth.map(v => `${v.value}`).join(',') : dayForMonth.value;
        switch (timeStamp.value) {
            case 'minute':
                cronExp = isAt ? `0 ${value} * * * ?` : `0 0/${value} * * * ?`;
                break;
            case 'hour':
                cronExp = isAt ? `0 0 ${value} * * ?` : `0 0 0/${value} * * ?`;
                break;
            case 'day':
                cronExp = isAt ? `0 ${minuteValue} ${hourValue} ${value} 1/1 ?` : `0 ${minuteValue} ${hourValue} 1/${value} 1/1 ?`;
                break;
            case 'week':
                cronExp = `0 ${minuteValue} ${hourValue} * 1/1 ${value}`;
                break;
            case 'month':
                cronExp = isAt ? `0 ${minuteValue} ${hourValue} ${dayForMonthValue} ${value} ?` : `0 ${minuteValue} ${hourValue} 1/${dayForMonthValue} ${value} ?`;
                break;
        }
        return cronExp;
    }

    getTimeStampOptions(value = null){
        const atOrEachValue = !value ? this.state.atOrEach.value : value;
        return [
            {label: `Minute${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'minute'},
            {label: `Hour${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'hour'},
            {label: `Day${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'day'},
            {label: `Week`, value: 'week'},
            {label: `Month`, value: 'month'}
        ];
    }

    setTimeStamp(timeStamp){
        let {cronExp, atOrEach} = this.state;
        const isAt = atOrEach.value === 'at';
        let startAtShow = timeStamp.value !== 'minute' && timeStamp.value !== 'hour';
        let dayShow = timeStamp.value === 'month';
        const everyOptions = this.getEveryOptions(timeStamp.value);
        const dayForMonthOptions = this.getEveryOptions('day');
        switch (timeStamp.value) {
            case 'minute':
                cronExp = '0 1 * * * ?';
                break;
            case 'hour':
                cronExp = '0 0 1 * * ?';
                break;
            case 'day':
                cronExp = '0 0 12 1 1/1 ?';
                break;
            case 'week':
                atOrEach = {label: 'Each', value: 'each'};
                cronExp = '0 0 1 * * MON';
                break;
            case 'month':
                cronExp = '0 0 12 1 1 ?';
                break;
        }
        const everyValue = timeStamp.value === 'week' ? [] : everyOptions[0];
        this.setState({
            atOrEach,
            timeStamp,
            cronExp,
            everyValue,
            everyOptions,
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
            dayForMonth: isAt ? [dayForMonthOptions[0]] : dayForMonthOptions[0],
            startAtShow,
            dayShow,
        });
    }

    setAtOrEachOfHour(atOrEachOfHour){
        this.setState({
            atOrEachOfHour,
        });
    }

    setAtOrEach(atOrEach){
        const isAt = atOrEach.value === 'at';
        const timeStampOptions = this.getTimeStampOptions(atOrEach.value);
        const everyOptions = this.getEveryOptions(null, isAt);
        const dayForMonthOptions = this.getEveryOptions('day', isAt);
        let dayForMonth = dayForMonthOptions[0];
        this.setState({
            atOrEach,
            timeStamp: timeStampOptions.find(option => option.value === this.state.timeStamp.value),
            timeStampOptions,
            dayForMonth: isAt ? [dayForMonth] : dayForMonth,
            everyValue: everyOptions.find(option => option.value === this.state.everyValue.value),
            everyOptions,
        });
    }

    setEveryValue(everyValue){
        let {cronExp, timeStamp} = this.state;
        let parts = cronExp.split(' ');
        switch (timeStamp.value) {
            case 'minute':
                parts[1] = `${everyValue.value}`;
                break;
            case 'hour':
                parts[2] = `${everyValue.value}`;
                break;
            case 'day':
                parts[3] = everyValue.value;
                parts[4] = '1/1';
                break;
            case 'month':
                parts[4] = everyValue.value;
                break;
        }
        cronExp = parts.join(' ');
        this.setState({
            everyValue,
            cronExp,
        });
    }

    setStartAtHour(startAtHour){
        let {cronExp} = this.state;
        let parts = cronExp.split(' ');
        parts[2] = startAtHour.value;
        cronExp = parts.join(' ');
        this.setState({
            startAtHour,
            cronExp,
        });
    }

    setStartAtMinute(startAtMinute){
        let {cronExp} = this.state;
        let parts = cronExp.split(' ');
        parts[1] = startAtMinute.value;
        cronExp = parts.join(' ');
        this.setState({
            startAtMinute,
            cronExp,
        });
    }

    setDayForMonth(dayForMonth){
        let {cronExp, atOrEach} = this.state;
        const isAt = atOrEach.value === 'at';
        let parts = cronExp.split(' ');
        parts[3] = isAt ? dayForMonth.map(v => v.value).join(',') : dayForMonth.value;
        parts[4] = '1';
        cronExp = parts.join(' ');
        this.setState({
            dayForMonth,
            cronExp,
        });
    }

    toggleShowGenerator(){
        this.setState({show: !this.state.show});
    }

    changeCronExp(){
        const {timeStamp} = this.state;
        let cronExp = this.getCronExp();
        if(timeStamp.value === 'week'){
            let cronExpSplit = cronExp.split(' ');
            cronExpSplit[3] = '?';
            cronExpSplit[4] = '*';
            cronExp = cronExpSplit.join(' ');
        }
        this.props.changeCronExp(cronExp);
        this.toggleShowGenerator();
    }

    getEveryOptions(selected = null, isAt = null){
        let options = [];
        let switcher = selected === null ? this.state.timeStamp.value : selected;
        isAt = isAt === null ? this.state.atOrEach.value === 'at' : isAt;
        const getLabel = (label) => {switch(label){case 1: case 21: case 31: return `${label}${isAt ? '-st' : ''}`; case 2: case 22: return `${label}${isAt ? '-nd' : ''}`; case 3: case 23: return `${label}${isAt ? '-d' : ''}`; default: return `${label}${isAt ? '-th' : ''}`}}
        switch (switcher) {
            case 'minute':
                options = [
                    {label: getLabel(1), value: 1},
                    {label: getLabel(2), value: 2},
                    {label: getLabel(3), value: 3},
                    {label: getLabel(4), value: 4},
                    {label: getLabel(5), value: 5},
                    {label: getLabel(10), value: 10},
                    {label: getLabel(15), value: 15},
                    {label: getLabel(20), value: 20},
                    {label: getLabel(30), value: 30},
                ];
                break;
            case 'hour':
                options = [
                    {label: getLabel(1), value: 1},
                    {label: getLabel(2), value: 2},
                    {label: getLabel(3), value: 3},
                    {label: getLabel(6), value: 6},
                    {label: getLabel(12), value: 12},
                ];
                break;
            case 'day':
                for(let i = 1; i <= 31; i++){
                    options.push({label: getLabel(i), value: i});
                }
                break;
            case 'week':
                options = [
                    {label: 'Sunday', value: 'SUN'},
                    {label: 'Monday', value: 'MON'},
                    {label: 'Tuesday', value: 'TUE'},
                    {label: 'Wednesday', value: 'WED'},
                    {label: 'Thursday', value: 'THU'},
                    {label: 'Friday', value: 'FRI'},
                    {label: 'Saturday', value: 'SAT'},
                ]
                break;
            case 'month':
                for(let i = 1; i <= 12; i++){
                    options.push({label: ALL_MONTHS[i - 1], value: i});
                }
                break;
            default:
                break;
        }
        return options;
    }

    renderExample(){
        const {examples} = this.state;
        return (
            <Text value={
                <ExampleStyled>
                    {
                        examples.map(example => {
                            return (
                                <li>{example}</li>
                            );
                        })
                    }
                </ExampleStyled>
            }/>
        );
    }

    render(){
        const {
            show, timeStamp, everyValue, startAtHour, startAtMinute, startAtShow,
            dayShow, dayForMonth, atOrEach, timeStampOptions, everyOptions, atOrEachOfHour} = this.state;
        const suffix = {minute: 'of an hour', hour: 'of a day', day: 'of a month', month: ''};
        let allHours = [];
        let allMinutes = [];
        for(let i = 0; i < 60; i++){
            if(i <= 23) {
                allHours.push({label: i <= 9 ? `0${i}` : i, value: i});
            }
            allMinutes.push({label: i <= 9 ? `0${i}` : i, value: i});
        }
        const isAt = atOrEach.value === 'at';
        const isForWeek = timeStamp.value === 'week';
        return (
            <CronGeneratorStyled>
                <Dialog
                    actions={[{label: 'Ok', onClick: () => this.changeCronExp()}, {label: 'Cancel', onClick: () => this.toggleShowGenerator()}]}
                    active={show}
                    toggle={() => this.toggleShowGenerator()}
                    title={'Generate Cron Expression'}
                    styles={{modal: {minWidth: '750px'}}}
                >
                    <div style={{flexWrap: 'wrap', display: 'flex'}}>
                        <div style={{flex: '0 0 100%'}}>
                            {isForWeek ?
                                <EachStyled value={'Each'} size={TextSize.Size_18}/>
                                :
                                <CronEverySelectStyled
                                    dayShow={dayShow}
                                    value={atOrEach}
                                    onChange={(value) => this.setAtOrEach(value)}
                                    options={[{label: 'At', value: 'at'}, {label: 'Each', value: 'each'}]}
                                />
                            }
                            {dayShow &&
                            <React.Fragment>
                                <CronDayForMonthStyled
                                    value={dayForMonth}
                                    onChange={(value) => this.setDayForMonth(value)}
                                    options={this.getEveryOptions('day')}
                                    isMulti={isAt}
                                />
                                <SuffixDayForMonthStyled value={`day${atOrEach.value === 'each' ? '(s)' : ''} of`}/>
                            </React.Fragment>
                            }
                            <EveryForWeekSelectStyled
                                isForWeek={isForWeek}
                                dayShow={dayShow}
                                value={everyValue}
                                onChange={(value) => this.setEveryValue(value)}
                                options={everyOptions}
                                isMulti={isForWeek}
                            />
                            {isForWeek && <OfAStyled value={'of a'}/>}
                            <CronTimeStampStyled
                                isForWeek={isForWeek}
                                dayShow={dayShow}
                                value={timeStamp}
                                onChange={(value) => this.setTimeStamp(value)}
                                options={timeStampOptions}
                            />
                            <CronSuffixStyled dayShow={dayShow}>{suffix[timeStamp.value]}</CronSuffixStyled>
                        </div>
                        {
                            startAtShow &&
                            <div style={{margin: '10px 0 0', flex: '0 0 100%'}}>
                                <CronStartAtSelectStyled
                                    value={atOrEachOfHour}
                                    onChange={(value) => this.setAtOrEachOfHour(value)}
                                    options={[{label: 'At', value: 'at'}, {label: 'Each', value: 'each'}]}
                                />
                                <CronStartHourSelectStyled
                                    value={startAtHour}
                                    onChange={(value) => this.setStartAtHour(value)}
                                    options={allHours}
                                />
                                <CronSuffixHourStyled value={'h.'}/>
                                <CronStartMinuteSelectStyled
                                    value={startAtMinute}
                                    onChange={(value) => this.setStartAtMinute(value)}
                                    options={allMinutes}
                                />
                                <CronSuffixMinuteStyled value={'m.'}/>
                            </div>
                        }
                        <div style={{flex: '0 0 100%'}}>
                            {this.renderExample()}
                        </div>
                    </div>
                </Dialog>
                <Button color={ColorTheme.Turquoise} handleClick={() => this.toggleShowGenerator()} icon={'edit'} hasBackground={false}/>
            </CronGeneratorStyled>
        );
    }
}

CronGenerator.propTypes = {
    changeCronExp: PropTypes.func.isRequired,
};

export default CronGenerator;