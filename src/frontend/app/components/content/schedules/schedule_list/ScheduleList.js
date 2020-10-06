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
import {connect} from'react-redux';
import { Row, Col } from "react-grid-system";
import Table from '@basic_components/table/Table';
import Pagination from 'react-bootstrap/Pagination';

import styles from '@themes/default/content/schedules/schedules.scss';
import {getThemeClass, setFocusById, sortByIdFunction} from "@utils/app";
import {deleteSchedules} from '@actions/schedules/delete';
import {startSchedules, enableSchedules, disableSchedules} from '@actions/schedules/update';
import {checkApp, checkAppCanceled} from "@actions/apps/fetch";
import {copyToClipboardWebHookFulfilled} from '@actions/webhooks/fetch';
import StatusCell from "./StatusCell";
import {withTranslation} from "react-i18next";
import {SchedulePermissions} from "@utils/constants/permissions";
import {permission} from "@decorators/permission";
import ScheduleUpdate from "./ScheduleUpdate";
import ScheduleDelete from "./ScheduleDelete";
import ScheduleStart from "./ScheduleStart";
import CSchedule from "@classes/components/content/schedule/CSchedule";
import Button from "@basic_components/buttons/Button";
import WebHookTools from "./WebHookTools";
import TitleCell from "./TitleCell";
import CronCell from "./CronCell";
import LastSuccessCell from "./LastSuccessCell";
import LastFailureCell from "./LastFailureCell";
import LastDurationCell from "./LastDurationCell";
import Checkbox from "@basic_components/inputs/Checkbox";
import Input from "@basic_components/inputs/Input";
import {APP_STATUS_UP} from "@utils/constants/url";
import {API_REQUEST_STATE} from "@utils/constants/app";
import ScheduleNotification from "./notification/ScheduleNotification";

export const EMPHASIZE_DURATION_ANIMATION = 900;

const SCHEDULES_PER_PAGE = 3;


function mapStateToProps(state){
    const auth = state.get('auth');
    const apps = state.get('apps');
    return{
        authUser: auth.get('authUser'),
        checkingAppResult: apps.get('checkingAppResult'),
        checkingApp: apps.get('checkingApp'),
    };
}

/**
 * List of the Schedules
 */
@connect(mapStateToProps, {deleteSchedules, startSchedules, enableSchedules, disableSchedules, copyToClipboardWebHookFulfilled, checkApp, checkAppCanceled})
@permission(SchedulePermissions.READ, true)
@withTranslation(['schedules', 'app'])
class ScheduleList extends Component{

    constructor(props){
        super(props);

        this.notEmphasize = false;
        let allCurrentSchedules = this.filterAllCurrentSchedules({filterTitle: ''});
        this.state = {
            currentSchedules: this.filterCurrentSchedules({pageNumber: 1, filterTitle: '', allCurrentSchedules}),
            allCurrentSchedules,
            currentPage: 1,
            filterTitle: '',
        };
    }

    componentDidMount(){
        setFocusById('add_title');
        this.checkElasticSearch();
    }

    componentDidUpdate(prevProps){
        let prevSchedules = prevProps.schedules;
        let curSchedules = this.props.schedules;
        let notEqualedSchedules = false;
        if(prevSchedules.length !== curSchedules.length){
            notEqualedSchedules = true;
            this.notEmphasize = true;
        } else{
            for(let i = 0; i < prevSchedules.length; i++){
                if(prevSchedules[i].title !== curSchedules[i].title){
                    notEqualedSchedules = true;
                    this.notEmphasize = false;
                }
                if(!prevSchedules[i].lastExecution && curSchedules[i].lastExecution){
                    notEqualedSchedules = true;
                    this.notEmphasize = false;
                }
                if(prevSchedules[i].lastExecution && curSchedules[i].lastExecution){
                    if(prevSchedules[i].lastExecution.success && curSchedules[i].lastExecution.success){
                        if(prevSchedules[i].lastExecution.success.endTime !== curSchedules[i].lastExecution.success.endTime){
                            notEqualedSchedules = true;
                            this.notEmphasize = false;
                        }
                    }
                    if(prevSchedules[i].lastExecution.fail && curSchedules[i].lastExecution.fail){
                        if(prevSchedules[i].lastExecution.fail.endTime !== curSchedules[i].lastExecution.fail.endTime){
                            notEqualedSchedules = true;
                            this.notEmphasize = false;
                        }
                    }
                }
            }
        }
        if(notEqualedSchedules) {
            let {currentPage, filterTitle} = this.state;
            let amount = this.props.schedules.length;
            let pageAmount = amount % SCHEDULES_PER_PAGE === 0 ? parseInt(amount / SCHEDULES_PER_PAGE) : parseInt(amount / SCHEDULES_PER_PAGE) + 1;
            currentPage = currentPage > pageAmount ? currentPage - 1 : currentPage;
            if(currentPage < 1){
                currentPage = 1;
            }
            let allCurrentSchedules = this.filterAllCurrentSchedules({filterTitle});
            this.setState({
                allCurrentSchedules,
                currentPage,
                currentSchedules: this.filterCurrentSchedules({pageNumber: currentPage, allCurrentSchedules}),
            });
        }
    }

    componentWillUnmount(){
        if(this.props.checkingApp === API_REQUEST_STATE.START){
            this.props.checkAppCanceled();
        }
    }

    onChangeFilterTitle(filterTitle){
        let allCurrentSchedules = this.filterAllCurrentSchedules({filterTitle});
        this.setState({
            currentPage: 1,
            filterTitle,
            allCurrentSchedules,
            currentSchedules: this.filterCurrentSchedules({pageNumber: 1, allCurrentSchedules}),
        });
    }

    /**
     * to check status of Elastic Search
     */
    checkElasticSearch(){
        this.props.checkApp({value: 'elasticsearch'});
    }

    /**
     * to delete selected schedules
     */
    deleteSelectedSchedules(){
        const {checks, deleteSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        deleteSchedules({schedulerIds});
    }

    /**
     * to start selected schedules
     */
    startSelectedSchedules(){
        const {checks, startSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        startSchedules({schedulerIds});
    }

    /**
     * to enable selected schedules
     */
    enableSelectedSchedules(){
        const {checks, enableSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        enableSchedules({schedulerIds});
    }

    /**
     * to disable selected schedules
     */
    disableSelectedSchedules(){
        const {checks, disableSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        disableSchedules({schedulerIds});
    }

    /**
     * to check if at least one of checks state true
     */
    isOneChecked(){
        let {checks} = this.props;
        for(let i = 0; i < checks.length; i++){
            if(checks[i].value){
                return true;
            }
        }
        return false;
    }

    /**
     * to sort all schedules by id
     */
    sortAllCurrentSchedules(){
        let {schedules} = this.props;
        return schedules.sort(sortByIdFunction);
    }

    /**
     * to filter all schedules by search title
     */
    filterAllCurrentSchedules({filterTitle}){
        return this.sortAllCurrentSchedules().filter(s => {
            let noFilterTitle = true;
            if(filterTitle !== ''){
                noFilterTitle = s.title.toLowerCase().indexOf(filterTitle.toLowerCase()) !== -1 || s.connection.title.toLowerCase().indexOf(filterTitle.toLowerCase()) !== -1;
            }
            return noFilterTitle;
        });
    }

    filterCurrentSchedules({pageNumber, allCurrentSchedules}){
        let startingIndex = SCHEDULES_PER_PAGE * (pageNumber - 1);
        return allCurrentSchedules.filter((s, key) => {
            return key >= startingIndex && key < startingIndex + SCHEDULES_PER_PAGE;
        });
    }

    /**
     * to open a page
     */
    openPage(e, pageNumber){
        this.setState({
            currentPage: pageNumber,
            currentSchedules: this.filterCurrentSchedules({pageNumber, allCurrentSchedules: this.state.allCurrentSchedules}),
        });
    }

    renderPagination(){
        const {allCurrentSchedules, currentPage} = this.state;
        let amount = allCurrentSchedules.length;
        let pageAmount = amount % SCHEDULES_PER_PAGE === 0 ? parseInt(amount / SCHEDULES_PER_PAGE) : parseInt(amount / SCHEDULES_PER_PAGE) + 1;
        let pageItems = [];
        if(pageAmount <= 1){
            return null;
        }
        if(pageAmount > 5){
            pageItems.push(<Pagination.First onClick={(e) => ::this.openPage(e, 1)} disabled={currentPage === 1}/>);
            pageItems.push(<Pagination.Prev onClick={(e) => ::this.openPage(e, currentPage > 1 ? currentPage - 1 : 1)} disabled={currentPage === 1}/>);
            let hasPrevEllipse = false;
            let hasNextEllipse = false;
            for(let i = 0; i < pageAmount; i++) {
                if(i >= currentPage - 3 && i < currentPage + 2) {
                    pageItems.push(<Pagination.Item key={`page_${i}`} active={i + 1 === currentPage}
                                                    onClick={(e) => ::this.openPage(e, i + 1)}>{i + 1}</Pagination.Item>);
                } else{
                    if(!hasPrevEllipse) {
                        if(i < currentPage - 3){
                            pageItems.push(<Pagination.Ellipsis disabled/>);
                            hasPrevEllipse = true;
                        }
                    }
                    if(!hasNextEllipse){
                        if(i >= currentPage + 2){
                            pageItems.push(<Pagination.Ellipsis disabled/>);
                            hasNextEllipse = true;
                        }
                    }
                }
            }
            pageItems.push(<Pagination.Next onClick={(e) => ::this.openPage(e, currentPage < pageAmount ? currentPage + 1 : pageAmount)} disabled={currentPage === pageAmount}/>);
            pageItems.push(<Pagination.Last  onClick={(e) => ::this.openPage(e, pageAmount)} disabled={currentPage === pageAmount}/>);
        } else{
            for(let i = 0; i < pageAmount; i++) {
                pageItems.push(<Pagination.Item key={`page_${i}`} active={i + 1 === currentPage} onClick={(e) => ::this.openPage(e, i + 1)}>{i + 1}</Pagination.Item>);
            }
        }
        return(
            <Pagination className='justify-content-center' style={{paddingTop: '20px'}}>{pageItems}</Pagination>
        );
    }

    renderFilter(){
        const {filterTitle} = this.state;
        const {t, schedules} = this.props;
        if(schedules.length === 0){
            return null;
        }
        return(
            <Input
                id={'filter_title'}
                name={'filter_title'}
                label={t('ADD.FILTER_PLACEHOLDER')}
                type={'text'}
                onChange={::this.onChangeFilterTitle}
                value={filterTitle}
            />
        );
    }

    renderTable(){
        const {currentSchedules} = this.state;
        const {t, authUser, checkingAppResult} = this.props;
        const {allChecked, checks, checkAllSchedules, checkOneSchedule, deleteCheck} = this.props;
        let classNames = [
            'schedule_list',
            'checkbox_label',
            'checkbox_field',
            'table_head',
            'table_row',
            'schedule_list_empty',
            'trigger_schedule_start_off',
            'schedule_list_actions',
            'bulk_actions',
            'action_item',
            'schedule_list_title',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        if(currentSchedules.length === 0){
            return <div className={styles[classNames.schedule_list_empty]}>{t('LIST.EMPTY_LIST')}</div>;
        }
        return(
            <Table authUser={authUser}>
                <thead>
                    <tr>
                        <th><Checkbox id='input_check_all' checked={allChecked} onChange={checkAllSchedules} labelClassName={styles[classNames.checkbox_label]} className={styles[classNames.checkbox_field]}/></th>
                        <th><span>{t('LIST.TITLE')}</span></th>
                        <th><span>{t('LIST.CONNECTION')}</span></th>
                        <th className={'tour-step-3'}><span>{t('LIST.CRON')}</span></th>
                        <th className={'tour-step-4'}><span>{t('LIST.LAST_SUCCESS')}</span></th>
                        <th className={'tour-step-5'}><span>{t('LIST.LAST_FAILURE')}</span></th>
                        <th className={'tour-step-6'}><span>{t('LIST.LAST_DURATION')}</span></th>
                        <th className={'tour-step-7'}><span>{t('LIST.STATUS')}</span></th>
                        <th><span>{t('LIST.ACTION')}</span></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        currentSchedules.map((s, key) => {
                            let schedule = CSchedule.createSchedule(s);
                            let index = checks.findIndex(c => c.id === schedule.id && c.value);
                            let checked = index !== -1;
                            let backgroundColorStyle = null;
                            if(!schedule.status){
                                backgroundColorStyle = {};
                                backgroundColorStyle.backgroundColor = '#d7c9c92e';
                                backgroundColorStyle.color = '#a28e8e';
                            }
                            return (
                                <tr key={key} style={backgroundColorStyle}>
                                    <td>
                                        <Checkbox
                                            id={`input_check_${key}`}
                                            checked={checked}
                                            onChange={(e) => checkOneSchedule(e, {key, id: schedule.id})}
                                            labelClassName={styles[classNames.checkbox_label]}
                                            className={styles[classNames.checkbox_field]}
                                        />
                                    </td>
                                    <TitleCell index={key} schedule={schedule} notEmphasize={this.notEmphasize}/>
                                    <td className={styles[classNames.schedule_list_title]}><span title={schedule.connection.title}>{schedule.connection.title}</span></td>
                                    <CronCell authUser={authUser} schedule={schedule} isFirst={key === 0}/>
                                    <LastSuccessCell index={key} schedule={schedule} hasElasticSearch={checkingAppResult ? `${checkingAppResult.status}` === APP_STATUS_UP : false}/>
                                    <LastFailureCell index={key} schedule={schedule} hasElasticSearch={checkingAppResult ? `${checkingAppResult.status}` === APP_STATUS_UP : false}/>
                                    <LastDurationCell schedule={schedule} t={t}/>
                                    <StatusCell index={key} schedule={schedule}/>
                                    <td style={{padding: '5px'}}>
                                        <div className={styles[classNames.schedule_list_actions]}>
                                            <div>
                                                <WebHookTools index={key} schedule={schedule} t={t}/>
                                                <ScheduleNotification schedule={schedule} index={key}/>
                                                <ScheduleDelete index={key} schedule={schedule} deleteCheck={(e) => deleteCheck(e, {key, id: schedule.id})}/>
                                            </div>
                                            <div>
                                                <ScheduleStart index={key} schedule={schedule}/>
                                                <ScheduleUpdate index={key} schedule={schedule}/>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    }
                </tbody>
            </Table>
        );
    }

    render(){
        const {currentSchedules} = this.state;
        const {authUser} = this.props;
        let classNames = [
            'schedule_list',
            'checkbox',
            'table_head',
            'table_row',
            'schedule_list_empty',
            'trigger_schedule_start_off',
            'schedule_list_actions',
            'bulk_actions',
            'action_item',
        ];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <Row className={`${styles[classNames.schedule_list]} tour-step-2`}>
                <Col md={12}>
                    {this.renderFilter()}
                    {this.renderTable()}
                    {
                        currentSchedules.length !== 0 &&
                            <div className={styles[classNames.bulk_actions]}>
                                <Button authUser={authUser} title={'Start'} className={styles[classNames.action_item]}
                                        onClick={::this.startSelectedSchedules} disabled={!this.isOneChecked()}/>
                                <Button authUser={authUser} title={'Enable'} className={styles[classNames.action_item]}
                                        onClick={::this.enableSelectedSchedules} disabled={!this.isOneChecked()}/>
                                <Button authUser={authUser} title={'Disable'} className={styles[classNames.action_item]}
                                        onClick={::this.disableSelectedSchedules} disabled={!this.isOneChecked()}/>
                                <Button authUser={authUser} title={'Delete'} onClick={::this.deleteSelectedSchedules}
                                        disabled={!this.isOneChecked()}/>
                            </div>
                    }
                    {this.renderPagination()}
                </Col>
            </Row>
        );
    }
}

ScheduleList.propTypes = {
    schedules: PropTypes.array.isRequired,
    allChecked: PropTypes.bool.isRequired,
    checks: PropTypes.array.isRequired,
    checkAllSchedules: PropTypes.func.isRequired,
    checkOneSchedule: PropTypes.func.isRequired,
    deleteCheck: PropTypes.func.isRequired,
};

export default ScheduleList;