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
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {withTranslation} from "react-i18next";
import { Row, Col } from "react-grid-system";
import Dialog from "@basic_components/Dialog";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/schedules/schedules";
import {ALL_MONTHS, consoleLog, convertTimeForCronExpression, getThemeClass} from "@utils/app";
import Select from "@basic_components/inputs/Select";
import cronParser from 'cron-parser';


function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
    };
}
/**
 * Cron Expression Generator for Schedule Add
 */
@connect(mapStateToProps, {})
@withTranslation('schedules')
class CronExpGenerator extends Component{

    constructor(props){
        super(props);

        const timeStampOptions = ::this.getTimeStampOptions('at');
        const everyOptions = ::this.getEveryOptions('minute', true);

        this.state = {
            show: true,
            atOrEach: {label: 'At', value: 'at'},
            startAtShow: false,
            dayShow: false,
            dayForMonth: everyOptions[0],
            cronExp: '0 1 * * * ?',
            timeStamp: timeStampOptions[0],
            timeStampOptions,
            everyValue: everyOptions[0],
            everyOptions,
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
            examples: [],
        };
    }
    componentDidUpdate(prevProps, prevState, snapshot) {
        const {atOrEach, dayForMonth, timeStamp, everyValue, startAtHour, startAtMinute} = this.state;
        if(atOrEach.value !== prevState.atOrEach.value || dayForMonth.value !== prevState.dayForMonth.value
            || timeStamp.value !== prevState.timeStamp.value || everyValue.value !== prevState.everyValue.value
            || startAtHour.value !== prevState.startAtHour.value || startAtMinute.value !== prevState.startAtMinute.value
        ){
            this.setState({
                examples: ::this.defineExamples(),
            });
        }
    }

    defineExamples() {
        try {
            const cronExp = ::this.getCronExp();
            const interval = cronParser.parseExpression(cronExp);
            let examples = [];
            for(let i = 0; i < 5; i++){
                examples.push(convertTimeForCronExpression(interval.next().toString()));
            }
            return examples;
        } catch (err) {
            consoleLog(err.message);
        }
    }

    getCronExp(){
        const {atOrEach, dayForMonth, timeStamp, everyValue, startAtHour, startAtMinute} = this.state;
        let cronExp = '';
        const value = everyValue.value;
        const minuteValue = startAtMinute.value;
        const hourValue = startAtHour.value;
        const dayForMonthValue = dayForMonth.value;
        const isAt = atOrEach.value === 'at';
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
            case 'month':
                cronExp = isAt ? `0 ${minuteValue} ${hourValue} ${dayForMonthValue} ${value} ?` : `0 ${minuteValue} ${hourValue} 1/${dayForMonthValue} ${value} ?`;
                break;
        }
        return cronExp;
    }

    getTimeStampOptions(value = null){
        const atOrEachValue = !value ? this.state.atOrEach.value : value;
        return [{label: `Minute${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'minute'}, {label: `Hour${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'hour'}, {label: `Day${atOrEachValue === 'each' ? '(s)' : ''}`, value: 'day'}, {label: `Month`, value: 'month'}];
    }

    setTimeStamp(timeStamp){
        let {cronExp} = this.state;
        let startAtShow = timeStamp.value !== 'minute' && timeStamp.value !== 'hour';
        let dayShow = timeStamp.value === 'month';
        const everyOptions = ::this.getEveryOptions(timeStamp.value);
        const dayForMonthOptions = ::this.getEveryOptions('day');
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
            case 'month':
                cronExp = '0 0 12 1 1 ?';
                break;
        }
        this.setState({
            timeStamp,
            cronExp,
            everyValue: everyOptions[0],
            everyOptions,
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
            dayForMonth: dayForMonthOptions[0],
            startAtShow,
            dayShow,
        });
    }

    setAtOrEach(atOrEach){
        const timeStampOptions = ::this.getTimeStampOptions(atOrEach.value);
        const everyOptions = ::this.getEveryOptions(null, atOrEach.value === 'at');
        const dayForMonthOptions = ::this.getEveryOptions('day', atOrEach.value === 'at');
        this.setState({
            atOrEach,
            timeStamp: timeStampOptions.find(option => option.value === this.state.timeStamp.value),
            timeStampOptions,
            dayForMonth: dayForMonthOptions.find(option => option.value === this.state.dayForMonth.value),
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
        let {cronExp} = this.state;
        let parts = cronExp.split(' ');
        parts[3] = dayForMonth.value;
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
        this.props.changeCronExp(this.getCronExp());
        this.toggleShowGenerator();
    }

    getEveryOptions(selected = null, isAt = null){
        let options = [];
        let switcher = selected === null ? this.state.timeStamp.value : selected;
        isAt = isAt === null ? this.state.atOrEach.value === 'at' : isAt;
        const getLabel = (label) => {switch(label){case 1: case 21: case 31: return `${label}${isAt ? '-st' : ''}`; case 2: case 22: return `${label}${isAt ? '-nd' : ''}`; case 3: case 23: return `${label}${isAt ? '-d' : ''}`; default: return `${label}${isAt ? '-th' : ''}`}}
        switch (switcher) {
            case 'minute':
                options = [{label: getLabel(1), value: 1}, {label: getLabel(2), value: 2}, {label: getLabel(3), value: 3}, {label: getLabel(4), value: 4}, {label: getLabel(5), value: 5}, {label: getLabel(10), value: 10}, {label: getLabel(15), value: 15}, {label: getLabel(20), value: 20}, {label: getLabel(30), value: 30}];
                break;
            case 'hour':
                options = [{label: getLabel(1), value: 1}, {label: getLabel(2), value: 2}, {label: getLabel(3), value: 3}, {label: getLabel(6), value: 6}, {label: getLabel(12), value: 12}];
                break;
            case 'day':
                for(let i = 1; i <= 31; i++){
                    options.push({label: getLabel(i), value: i});
                }
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
        const {authUser} = this.props;
        let classNames = [
            'cron_exp_example',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <ol className={styles[classNames.cron_exp_example]}>
                {
                    examples.map(example => {
                        return(
                            <li>{example}</li>
                        );
                    })
                }
            </ol>
        );
    }

    render(){
        const {
            show, timeStamp, everyValue, startAtHour, startAtMinute, startAtShow,
            dayShow, dayForMonth, atOrEach, timeStampOptions, everyOptions} = this.state;
        const {t, authUser} = this.props;
        const suffix = {minute: 'of an hour', hour: 'of a day', day: 'of a month', month: ''};
        let allHours = [];
        let allMinutes = [];
        for(let i = 0; i < 60; i++){
            if(i <= 23) {
                allHours.push({label: i <= 9 ? `0${i}` : i, value: i});
            }
            allMinutes.push({label: i <= 9 ? `0${i}` : i, value: i});
        }
        let classNames = [
            'cron_icon_tooltip',
            'cron_every',
            'cron_every_short',
            'cron_select_day_for_month',
            'cron_suffix_day_for_month',
            'cron_select_every',
            'cron_select_every_short',
            'cron_select_timestamp',
            'cron_select_timestamp_short',
            'cron_suffix',
            'cron_suffix_short',
            'cron_start_at',
            'cron_select_start_hour',
            'cron_suffix_hour',
            'cron_select_start_minute',
            'cron_suffix_minute',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <React.Fragment>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.changeCronExp}, {label: 'Cancel', onClick: ::this.toggleShowGenerator}]}
                    active={show}
                    toggle={::this.toggleShowGenerator}
                    title={'Generate Cron Expression'}
                >
                    <Row>
                        <Col md={12}>
                            <Select
                                className={styles[dayShow ? classNames.cron_every_short : classNames.cron_every]}
                                value={atOrEach}
                                onChange={::this.setAtOrEach}
                                options={[{label: 'At', value: 'at'}, {label: 'Each', value: 'each'}]}
                            />
                            {dayShow &&
                                <React.Fragment>
                                    <Select
                                        className={styles[classNames.cron_select_day_for_month]}
                                        value={dayForMonth}
                                        onChange={::this.setDayForMonth}
                                        options={this.getEveryOptions('day')}
                                    />
                                    <span className={styles[classNames.cron_suffix_day_for_month]}>day{atOrEach.value === 'each' ? '(s)' : ''} of</span>
                                </React.Fragment>
                            }
                            <Select
                                className={styles[dayShow ? classNames.cron_select_every_short : classNames.cron_select_every]}
                                value={everyValue}
                                onChange={::this.setEveryValue}
                                options={everyOptions}
                            />
                            <Select
                                className={styles[dayShow ? classNames.cron_select_timestamp_short : classNames.cron_select_timestamp]}
                                value={timeStamp}
                                onChange={::this.setTimeStamp}
                                options={timeStampOptions}
                            />
                            <span className={styles[dayShow ? classNames.cron_suffix_short : classNames.cron_suffix]}>{suffix[timeStamp.value]}</span>
                        </Col>
                        {
                            startAtShow &&
                            <Col md={12} style={{margin: '30px 0 0'}}>
                                <span className={styles[classNames.cron_start_at]}>At</span>
                                <Select
                                    className={styles[classNames.cron_select_start_hour]}
                                    value={startAtHour}
                                    onChange={::this.setStartAtHour}
                                    options={allHours}
                                />
                                <span className={styles[classNames.cron_suffix_hour]}>h.</span>
                                <Select
                                    className={styles[classNames.cron_select_start_minute]}
                                    value={startAtMinute}
                                    onChange={::this.setStartAtMinute}
                                    options={allMinutes}
                                />
                                <span className={styles[classNames.cron_suffix_minute]}>m.</span>
                            </Col>
                        }
                        <Col md={12}>
                            {this.renderExample()}
                        </Col>
                    </Row>
                </Dialog>
                <TooltipFontIcon onClick={::this.toggleShowGenerator} tooltip={t('ADD.CRON_ICON_TOOLTIP')} value={'schedule'} isButton={true} wrapClassName={styles[classNames.cron_icon_tooltip]} blueTheme={true}/>
            </React.Fragment>
        );
    }
}

CronExpGenerator.propTypes = {
    changeCronExp: PropTypes.func.isRequired,
};

export default CronExpGenerator;