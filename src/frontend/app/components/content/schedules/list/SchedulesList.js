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

import React, { Component }  from 'react';
import PropTypes from "prop-types";
import {connect} from 'react-redux';
import {withTranslation} from 'react-i18next';
import {fetchSchedules, fetchSchedulesCanceled} from '@actions/schedules/fetch';
import {deleteSchedule, deleteSchedules} from '@actions/schedules/delete';
import {enableSchedules, disableSchedules, startSchedules} from "@actions/schedules/update";
import {setCurrentPageItems} from "@actions/app";

import {ListComponent} from "@decorators/ListComponent";
import {permission} from "@decorators/permission";
import {SchedulePermissions} from "@utils/constants/permissions";
import {tour} from "@decorators/tour";
import {LIST_TOURS} from "@utils/constants/tours";
import List, {VIEW_TYPE} from "@components/general/list_of_components/List";
import LastSuccessCell from "@components/content/schedules/schedule_list/LastSuccessCell";
import LastFailureCell from "@components/content/schedules/schedule_list/LastFailureCell";
import LastDurationCell from "@components/content/schedules/schedule_list/LastDurationCell";
import StatusCell from "@components/content/schedules/schedule_list/StatusCell";
import Button from "@basic_components/buttons/Button";
import styles from "@themes/default/content/schedules/schedules";
import {API_REQUEST_STATE} from "@utils/constants/app";
import CSchedule from "@classes/components/content/schedule/CSchedule";
import Confirmation from "@components/general/app/Confirmation";
import TitleCell from "@components/content/schedules/schedule_list/TitleCell";
import {Link as ReactRouterLink} from "react-router";
import WebHookTools from "@components/content/schedules/schedule_list/WebHookTools";
import ScheduleNotification from "@components/content/schedules/schedule_list/notification/ScheduleNotification";
import ScheduleStart from "@components/content/schedules/schedule_list/ScheduleStart";
import CurrentSchedules from "@components/content/schedules/current_schedules/CurrentSchedules";


const prefixUrl = '/schedules';

function mapStateToProps(state){
    const app = state.get('app');
    const auth = state.get('auth');
    const schedules = state.get('schedules');
    return {
        currentPageItems: app.get('currentPageItems').toJS(),
        authUser: auth.get('authUser'),
        fetchingSchedules: schedules.get('fetchingSchedules'),
        fetchingSchedulesByIds: schedules.get('fetchingSchedulesByIds'),
        deletingSchedule: schedules.get('deletingSchedule'),
        deletingSchedules: schedules.get('deletingSchedules'),
        startingSchedules: schedules.get('startingSchedules'),
        enablingSchedules: schedules.get('enablingSchedules'),
        disablingSchedules: schedules.get('disablingSchedules'),
        schedules: schedules.get('schedules').toJS(),
        isCanceled: schedules.get('isCanceled'),
        isRejected: schedules.get('isRejected'),
    };
}

function filterScheduleSteps(tourSteps){
    const {schedules, params} = this.props;
    let steps = tourSteps;
    switch(schedules.length){
        case 0:
            steps = [];
            break;
        case 1:
            steps = tourSteps.card_1;
            break;
        default:
            if(params && params.pageNumber > 1) {
                steps = tourSteps.card_1;
            } else{
                steps = tourSteps.card_2;
            }
            break;
    }
    return steps;
}

/**
 * List of Schedules
 */
@connect(mapStateToProps, {setCurrentPageItems, fetchSchedules, fetchSchedulesCanceled, deleteSchedule, enableSchedules, disableSchedules, startSchedules, deleteSchedules})
@permission(SchedulePermissions.READ, true)
@withTranslation(['schedules', 'app'])
@ListComponent('schedules')
@tour(LIST_TOURS, filterScheduleSteps)
class SchedulesList extends Component{

    constructor(props){
        super(props);

        this.state = {
            updateSchedules: () => {},
            checks: [],
            showConfirm: false,
        }
    }

    toggleConfirm(){
        this.setState({showConfirm: !this.state.showConfirm});
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const shouldEnableSchedules = prevProps.enablingSchedules === API_REQUEST_STATE.START && this.props.enablingSchedules === API_REQUEST_STATE.FINISH;
        const shouldDisableSchedules = prevProps.disablingSchedules === API_REQUEST_STATE.START && this.props.disablingSchedules === API_REQUEST_STATE.FINISH;
        const shouldUpdateSchedules = prevProps.fetchingSchedulesByIds === API_REQUEST_STATE.START && this.props.fetchingSchedulesByIds === API_REQUEST_STATE.FINISH;
        if((shouldEnableSchedules || shouldDisableSchedules) && this.state.checks){
            let updatedCurrentPageItems = [...this.props.currentPageItems];
            for(let i = 0; i < updatedCurrentPageItems.length; i++){
                if(this.state.checks.findIndex(check => check.id === updatedCurrentPageItems[i].id && check.value) !== -1){
                    updatedCurrentPageItems[i].status = shouldEnableSchedules;
                }
            }
            this.props.setCurrentPageItems(updatedCurrentPageItems);
        }
        if(shouldUpdateSchedules){
            this.state.updateSchedules();
        }
    }

    /**
     * to start selected schedules
     */
    startSelectedSchedules(checks, setCurrentPageItems){
        const {startSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        startSchedules({schedulerIds});
        this.setState({
            updateSchedules: setCurrentPageItems,
        }, () => startSchedules({schedulerIds}));
    }

    /**
     * to enable selected schedules
     */
    enableSelectedSchedules(checks){
        const {enableSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        this.setState({checks},() => enableSchedules({schedulerIds}));
    }

    /**
     * to disable selected schedules
     */
    disableSelectedSchedules(checks){
        const {disableSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        this.setState({checks},() => disableSchedules({schedulerIds}));
    }

    wantDeleteSelectedSchedules(checks){
        this.setState({
            showConfirm: true,
            checks,
        })
    }

    /**
     * to delete selected schedules
     */
    deleteSelectedSchedules(){
        const {checks} = this.state;
        const {deleteSchedules} = this.props;
        let schedulerIds = checks.filter(c => c.value);
        schedulerIds = schedulerIds.map(c => c.id);
        deleteSchedules({schedulerIds});
        this.setState({
            showConfirm: false,
        });
    }

    deleteSchedule(schedule){
        if(schedule.hasOwnProperty('schedulerId')) {
            this.props.deleteSchedule({
                ...schedule,
                id: schedule.schedulerId,
            });
        } else{
            this.props.deleteSchedule(schedule);
        }
    }

    convertSchedules(){
        const {schedules} = this.props;
        let convertedSchedules = [];
        for(let i = 0; i < schedules.length; i++){
            convertedSchedules.push(CSchedule.createSchedule(schedules[i]));
        }
        return convertedSchedules;
    }

    render(){
        const {showConfirm} = this.state;
        const {t, viewType, noHeader, readOnly, params, setTotalPages, authUser, openTour, startingSchedules, enablingSchedules, disablingSchedules, deletingSchedules} = this.props;
        const schedules = this.convertSchedules();
        let translations = {};
        translations.header = noHeader ? null : {title: t('LIST.HEADER'), onHelpClick: openTour};
        translations.add_button = t('LIST.ADD_BUTTON');
        translations.empty_list = t('LIST.EMPTY_LIST');
        let mapEntity = {};
        mapEntity.map = (schedule) => {
            return schedule.getObject();
        };
        const renderListViewItemActions = (schedule) => {
            return (
                <React.Fragment>
                    <WebHookTools schedule={schedule} t={t}/>
                    <ScheduleNotification schedule={schedule}/>
                    <ScheduleStart schedule={schedule}/>
                </React.Fragment>
            );
        }
        let listViewData = {
            actionsShouldBeMinimized: true,
            renderItemActions: renderListViewItemActions,
            entityIdName: 'id',
            entityIdsName: 'scheduleIds',
            map: (schedule, thisListScope) => {
                let result = [
                    {name: 'id', value: schedule.id},
                    {name: 'title', label: t('LIST.TITLE'), value: <TitleCell key={`title_${schedule.schedulerId}`} schedule={schedule}/>},
                    {name: 'connection', label: t('LIST.CONNECTION'),
                        value: (
                            <td key={`connection_title_${schedule.schedulerId}`} className={styles.schedule_list_title}>
                                <ReactRouterLink
                                    onlyActiveOnIndex={true}
                                    to={`/connections/${schedule.connection.connectionId}/update`}
                                >
                                    <span title={schedule.connection.title}>
                                        {schedule.connection.title}
                                    </span>
                                </ReactRouterLink>
                            </td>)
                    },
                    {name: 'cronExp', label: t('LIST.CRON_EXP'), value: schedule.cronExp},
                    {name: 'lastSuccess', label: t('LIST.LAST_SUCCESS'), value: <LastSuccessCell key={`last_success_${schedule.schedulerId}`} schedule={schedule}/>},
                    {name: 'lastFailure', label: t('LIST.LAST_FAILURE'), value: <LastFailureCell key={`last_failure_${schedule.schedulerId}`} schedule={schedule}/>},
                    {name: 'lastDuration', label: t('LIST.LAST_DURATION'), value: <LastDurationCell key={`last_duration_${schedule.schedulerId}`} schedule={schedule} t={t}/>},
                ];
                if(!readOnly){
                    result.push({name: 'status', label: t('LIST.STATUS'), value: <StatusCell key={`status_${schedule.schedulerId}`} schedule={schedule}/>});
                }
                return result;
            },
        }
        mapEntity.getViewLink = (schedule) => {
            const id = schedule.hasOwnProperty('scheduleId') ? schedule.scheduleId : schedule.id;
            return `${prefixUrl}/${id}/view`;
        };
        mapEntity.getUpdateLink = (schedule) => {
            const id = schedule.hasOwnProperty('scheduleId') ? schedule.scheduleId : schedule.id;
            return `${prefixUrl}/${id}/update`;
        };
        mapEntity.getAddLink = `${prefixUrl}/add`;
        mapEntity.onDelete = ::this.deleteSchedule;
        mapEntity.AdditionalButton = (thisListScope) => {
            if(thisListScope.state.viewType === VIEW_TYPE.GRID){
                return null;
            }
            const disabled = !::thisListScope.isOneChecked();
            return (
                <div className={styles.actions}>
                    <Button icon={startingSchedules === API_REQUEST_STATE.START ? 'loading' : 'play_arrow'} title={'Start'} disabled={disabled || startingSchedules === API_REQUEST_STATE.START } onClick={() => ::this.startSelectedSchedules(thisListScope.state.checks, thisListScope.setCurrentPageItems)}/>
                    <Button icon={enablingSchedules === API_REQUEST_STATE.START ? 'loading' : 'radio_button_unchecked'} title={'Enable'} disabled={disabled || enablingSchedules === API_REQUEST_STATE.START} onClick={() => ::this.enableSelectedSchedules(thisListScope.state.checks)}/>
                    <Button icon={disablingSchedules === API_REQUEST_STATE.START ? 'loading' : 'highlight_off'} title={'Disable'} disabled={disabled || disablingSchedules === API_REQUEST_STATE.START} onClick={() => ::this.disableSelectedSchedules(thisListScope.state.checks)}/>
                    <Button icon={deletingSchedules === API_REQUEST_STATE.START ? 'loading' : 'delete'} title={'Delete'} disabled={disabled || deletingSchedules === API_REQUEST_STATE.START} onClick={() => ::this.wantDeleteSelectedSchedules(thisListScope.state.checks)}/>
                </div>
            );
        };
        return (
            <React.Fragment>
                <List
                    viewType={viewType}
                    readOnly={readOnly}
                    listViewData={listViewData}
                    entities={schedules}
                    translations={translations}
                    mapEntity={mapEntity}
                    page={{pageNumber: params ? params.pageNumber : 1, link: `${prefixUrl}/page/`, entitiesLength: schedules.length}}
                    setTotalPages={setTotalPages}
                    permissions={SchedulePermissions}
                    authUser={authUser}
                    hasDeleteSelectedButtons={false}
                />
                <CurrentSchedules/>
                <Confirmation
                    okClick={::this.deleteSelectedSchedules}
                    cancelClick={::this.toggleConfirm}
                    active={showConfirm}
                    title={t('app:LIST.CARD.CONFIRMATION_TITLE')}
                    message={t('app:LIST.CARD.CONFIRMATION_MESSAGE')}
                />
            </React.Fragment>
        );
    }
}

SchedulesList.propTypes = {
    viewType: PropTypes.oneOf(['GRID', 'LIST']),
}

SchedulesList.defaultProps = {
    readOnly: false,
    viewType: 'LIST',
    noHeader: false,
}


export default SchedulesList;