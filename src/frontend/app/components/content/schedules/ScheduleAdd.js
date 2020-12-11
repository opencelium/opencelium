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
import { Row, Col } from "react-grid-system";
import {addSchedule} from '@actions/schedules/add';
import {fetchConnections} from '@actions/connections/fetch';

import styles from '@themes/default/content/schedules/schedules.scss';
import Input from '@basic_components/inputs/Input';
import Select from '@basic_components/inputs/Select';
import {checkCronExpression, getThemeClass} from "@utils/app";
import {SchedulePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import Button from "@basic_components/buttons/Button";
import Loading from "@loading";
import {API_REQUEST_STATE} from "@utils/constants/app";
import CronExpGenerator from "@components/content/schedules/CronExpGenerator";


function mapStateToProps(state){
    const auth = state.get('auth');
    const schedule = state.get('schedules');
    return {
        authUser: auth.get('authUser'),
        addingSchedule: schedule.get('addingSchedule'),
        isRejected: schedule.get('isRejected'),
        error: schedule.get('error'),
    };
}

/**
 * Component to Add Schedule
 */
@connect(mapStateToProps, {addSchedule, fetchConnections})
@withTranslation('schedules')
@permission(SchedulePermissions.CREATE, false)
class ScheduleAdd extends Component{

    constructor(props){
        super(props);

        this.state = {
            title: '',
            connection: null,
            cronExp: '',
            startAdding: false,
            currentWidth: window.innerWidth,
        };
    }

    componentDidMount (){
        this.props.fetchConnections({background: true});
        window.addEventListener('resize', this.resize, false);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.resize, false);
    }

    static getDerivedStateFromProps(props, state){
        if(state.startAdding){
            switch(props.addingSchedule){
                case API_REQUEST_STATE.FINISH:
                    return {
                        title: '',
                        connection: null,
                        cronExp: '',
                        startAdding: false,
                    };
                case API_REQUEST_STATE.ERROR:
                    if(props.error && props.error.hasOwnProperty('id')){
                        let elem = document.getElementById(props.error.id);
                        if(elem) {
                            elem.focus();
                        }
                    }
                    return {
                        startAdding: false,
                    };
            }
        }
        return null;
    }

    resize = (e) => {
        this.setState({currentWidth: e.target.innerWidth});
    };

    onChangeLabel(title){
        this.setState({title});
    }

    onChangeConnections(connection){
        this.setState({connection});
    }

    onChangeCronExp(cronExp){
        cronExp = cronExp.toUpperCase();
        if(checkCronExpression(cronExp)) {
            this.setState({cronExp});
        }
    }

    parseBeforeAct(schedule){
        let result = {};
        result.title = schedule.title;
        result.connectionId = schedule.connection;
        result.cronExp = schedule.cronExp;
        result.status = true;
        result.timezone = new Date().getTimezoneOffset();
        return result;
    }

    addSchedule(){
        const {addSchedule, setAllChecked} = this.props;
        let {connection, cronExp, title}= this.state;
        let schedule = {connection: connection ? connection.value : null, cronExp, title};
        this.setState({startAdding: true,});
        setAllChecked(false);
        addSchedule(this.parseBeforeAct(schedule));
    }

    getConnections(){
        let {connections} = this.props;
        return connections.map(connection => {return {label: connection.title, value: connection.connectionId};});
    }

    render(){
        const {currentWidth, startAdding} = this.state;
        const {t, authUser} = this.props;
        let buttonName = '';
        if(currentWidth < 768 || currentWidth >= 1200){
            buttonName = t('ADD.ADD_BUTTON_TITLE');
        }
        if(currentWidth < 576 || currentWidth < 1200){
            buttonName = t('ADD.ADD_BUTTON_TITLE_SHORT');
        }
        let classNames = [
            'add_button',
            'multiselect_label',
            'multiselect',
            'multiselect_label',
            'multiselect',
            'navigation_button',
            'navigation_button_title',
            'schedule_title',
            'schedule_connection',
            'schedule_bar',
            'select_connection',
            'select_iteration',
            'schedule_add_loading',
            'schedule_cron_exp'
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        const {connection, cronExp, title} = this.state;
        let connections = this.getConnections();
        return (
            <Row className={'tour-step-1'}>
                <Col xl={4} lg={4} md={4} sm={12} xs={12} style={{zIndex: '0', paddingRight: currentWidth < 768 ? '15px' : 0}}>
                    <Input
                        id={'add_title'}
                        name={'title'}
                        placeholder={t('ADD.TITLE_PLACEHOLDER')}
                        type={'text'}
                        onChange={::this.onChangeLabel}
                        value={title}
                        theme={{inputElement: styles[classNames.schedule_title], bar: styles[classNames.schedule_bar]}}
                    />
                </Col>
                <Col xl={4} lg={3} md={3} sm={12} xs={12} style={{overflow: 'visible !important', paddingRight: currentWidth < 768 ? '15px' : 0, flex: '0 0 18.6667%', maxWidth: '18.6667%'}}>
                    <Select
                        id={'input_connection'}
                        className={styles[classNames.schedule_connection]}
                        name={'connection'}
                        value={connection}
                        onChange={::this.onChangeConnections}
                        options={connections}
                        closeOnSelect={false}
                        placeholder={t('ADD.CONNECTION_PLACEHOLDER')}
                        maxMenuHeight={200}
                        minMenuHeight={50}
                    />
                </Col>
                <Col xl={2} lg={3} md={3} sm={9} xs={9} style={{zIndex: '0', paddingRight: 0}}>
                    <Input
                        id={'add_cron'}
                        name={'cronExp'}
                        placeholder={t('ADD.CRONEXP_PLACEHOLDER')}
                        type={'text'}
                        onChange={::this.onChangeCronExp}
                        value={cronExp}
                        theme={{inputElement: styles[classNames.schedule_cron_exp], bar: styles[classNames.schedule_bar]}}
                    />
                    <CronExpGenerator changeCronExp={::this.onChangeCronExp}/>
                </Col>
                <Col xl={2} lg={2} md={2} sm={3} xs={3} style={{lineHeight: '75px', textAlign: 'center'}}>
                    {
                        !startAdding
                            ?
                                <Button
                                    className={styles[classNames.add_button]}
                                    authUser={authUser}
                                    title={buttonName}
                                    icon={'add'}
                                    onClick={::this.addSchedule}
                                />
                            :
                                <Loading
                                    authUser={authUser}
                                    className={styles[classNames.schedule_add_loading]}
                                />
                    }
                </Col>
            </Row>
        );
    }
}

ScheduleAdd.propTypes = {
    setAllChecked: PropTypes.func.isRequired,
};

export default ScheduleAdd;