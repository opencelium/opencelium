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
import {ALL_MONTHS, getThemeClass} from "@utils/app";
import Select from "@basic_components/inputs/Select";


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

        this.state = {
            show: false,
            startAtShow: false,
            dayShow: false,
            dayForMonth: {label: 1, value: 1},
            cronExp: '0 0/1 * * * ?',
            timeStamp: {label: 'Minute', value: 'minute'},
            everyValue: {label: 1, value: 1},
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
        };
    }

    setTimeStamp(timeStamp){
        let {cronExp} = this.state;
        let everyValue = {label: 1, value: 1};
        let startAtShow = timeStamp.value !== 'minute' && timeStamp.value !== 'hour';
        let dayShow = timeStamp.value === 'month';
        switch (timeStamp.value) {
            case 'minute':
                cronExp = '0 * * * * ?';
                break;
            case 'hour':
                cronExp = '0 0 0/1 * * ?';
                break;
            case 'day':
                cronExp = '0 0 12 1 1/1 ?';
                everyValue = {label: 1, value: 1};
                break;
            case 'month':
                cronExp = '0 0 12 1 1 ?';
                everyValue = {label: ALL_MONTHS[0], value: 1};
                break;
        }
        this.setState({
            timeStamp,
            cronExp,
            everyValue,
            startAtHour: {label: 12, value: 12},
            startAtMinute: {label: '00', value: 0},
            dayForMonth: {label: 1, value: 1},
            startAtShow,
            dayShow,
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
        parts[3] = dayForMonth;
        parts[4] = '1/1';
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
        this.props.changeCronExp(this.state.cronExp);
        this.toggleShowGenerator();
    }

    getEveryOptions(selected = null){
        const {timeStamp} = this.state;
        let options = [];
        let switcher = selected === null ? timeStamp.value : selected;
        switch (switcher) {
            case 'minute':
                options = [{label: 1, value: 1}, {label: 2, value: 2}, {label: 3, value: 3}, {label: 4, value: 4}, {label: 5, value: 5}, {label: 10, value: 10}, {label: 15, value: 15}, {label: 20, value: 20}, {label: 30, value: 30}];
                break;
            case 'hour':
                options = [{label: 1, value: 1}, {label: 2, value: 2}, {label: 3, value: 3}, {label: 6, value: 6}, {label: 12, value: 12}];
                break;
            case 'day':
                for(let i = 1; i <= 31; i++){
                    options.push({label: i, value: i});
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

    render(){
        const {show, timeStamp, everyValue, startAtHour, startAtMinute, startAtShow, dayShow, dayForMonth} = this.state;
        const {t, authUser} = this.props;
        const timeStamps = [{label: 'Minute', value: 'minute'}, {label: 'Hour', value: 'hour'}, {label: 'Day', value: 'day'}, {label: 'Month', value: 'month'}];
        const suffix = {minute: 'of an hour', hour: 'of a day', day: 'of a month', month: ''};
        const everyOptions = this.getEveryOptions();
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
                            <span className={styles[dayShow ? classNames.cron_every_short : classNames.cron_every]}>At</span>
                            {dayShow &&
                                <React.Fragment>
                                    <Select
                                        className={styles[classNames.cron_select_day_for_month]}
                                        value={dayForMonth}
                                        onChange={::this.setDayForMonth}
                                        options={this.getEveryOptions('day')}
                                    />
                                    <span className={styles[classNames.cron_suffix_day_for_month]}>day of</span>
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
                                options={timeStamps}
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