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
import Dialog from "@basic_components/Dialog";
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from "@themes/default/content/schedules/schedules";
import {getThemeClass} from "@utils/app";
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
            timeStamp: {label: 'Day(s)', value: 'days'},
            minute: {label: 1, value: 1},
            hour: {label: 1, value: 1},
            day: {label: 1, value: 1},
            month: {label: 1, value: 1},
        };
    }

    setTimeStamp(timeStamp){
        this.setState({timeStamp});
    }

    setMinute(minute){
        this.setState({minute});
    }

    setHour(hour){
        this.setState({hour});
    }

    setDay(day){
        this.setState({day});
    }

    setMonth(month){
        this.setState({month});
    }

    toggle(){
        this.setState({show: !this.state.show});
    }

    render(){
        const {show, minute, timeStamp} = this.state;
        const {t, authUser} = this.props;
        const timeStamps = [{label: 'Minute(s)', value: 'minutes'}, {label: 'Hour(s)', value: 'hours'}, {label: 'Day(s)', value: 'days'}, {label: 'Month(s)', value: 'months'}];
        const minutes = [{label: 1, value: 1}, {label: 2, value: 2}, {label: 3, value: 3}, {label: 4, value: 4}, {label: 5, value: 5}, {label: 10, value: 10}, {label: 15, value: 15}, {label: 20, value: 20}, {label: 30, value: 30}];
        let classNames = [
            'cron_icon_tooltip',
            'cron_select_every',
            'cron_select_minute',
            'cron_select_timestamp',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <React.Fragment>
                <Dialog
                    actions={[{label: 'Ok', onClick: ::this.toggle}, {label: 'Cancel', onClick: ::this.toggle}]}
                    active={show}
                    toggle={::this.toggle}
                    title={'Generate Cron Expression'}
                >
                    <span className={styles[classNames.cron_select_every]}>Every</span>
                    <Select
                        className={styles[classNames.cron_select_minute]}
                        value={minute}
                        onChange={::this.setMinute}
                        options={minutes}
                    />
                    <Select
                        className={styles[classNames.cron_select_timestamp]}
                        value={timeStamp}
                        onChange={::this.setTimeStamp}
                        options={timeStamps}
                    />
                </Dialog>
                <TooltipFontIcon onClick={::this.toggle} tooltip={t('ADD.CRON_ICON_TOOLTIP')} value={'schedule'} isButton={true} wrapClassName={styles[classNames.cron_icon_tooltip]} blueTheme={true}/>
            </React.Fragment>
        );
    }
}

CronExpGenerator.propTypes = {
    authUser: PropTypes.object.isRequired,
    schedule: PropTypes.object,
};

CronExpGenerator.defaultProps = {
    schedule: null,
};

export default CronExpGenerator;