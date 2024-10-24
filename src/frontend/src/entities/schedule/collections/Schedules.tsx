/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from "react";
import {Link} from "react-router-dom";
import ListCollection from "@application/classes/ListCollection";
import {ListProp} from "@application/interfaces/IListCollection";
import {AppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE, ComponentPermissionProps} from "@application/interfaces/IApplication";
import {copyStringToClipboard} from "@application/utils/utils";
import Button from "@app_component/base/button/Button";
import {SortType} from "@app_component/collection/collection_view/interfaces";
import {PermissionButton, PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {TextSize} from "@app_component/base/text/interfaces";
import {ColorTheme} from "@style/Theme";
import {ISchedule, ScheduleProps} from "../interfaces/ISchedule";
import {Schedule} from "../classes/Schedule";
import {
    deleteSchedulesById,
    startSchedule,
    switchScheduleStatus, switchScheduleLogsStatus
} from "../redux_toolkit/action_creators/ScheduleCreators";
import {deleteWebhook, getWebhook} from "../redux_toolkit/action_creators/WebhookCreators";
import {copyWebhookToClipboard} from "../redux_toolkit/slices/ScheduleSlice";
import {SchedulePermissions} from "../constants";
import {LastSuccessExecution} from "../components/last_success_execution/LastSuccessExecution";
import ScheduleNotificationsIcon
    from "../components/schedule_notifications_icon/ScheduleNotificationsIcon";
import {ExecutionStatus} from "../components/execution_status/ExecutionStatus";
import LastDurationExecution from "../components/last_duration_execution/LastDurationExecution";
import LastFailExecution from "../components/last_fail_execution/LastFailExecution";
import SelectedNotificationButton
    from "@entity/schedule/components/selected_notification_button/SelectedNotificationButton";
import DefaultListRaw from "@app_component/collection/default_list_raw/DefaultListRaw";
import InputSwitch from "@app_component/base/input/switch/InputSwitch";

class Schedules extends ListCollection<ScheduleProps>{
    name: string = 'schedules';
    hasElasticSearch: boolean = false;
    entities: ISchedule[];
    title = 'Schedules';
    keyPropName: ScheduleProps ='id';
    getListRawUrl = (entity: ISchedule) => `/schedules/${entity.id}/update`;
    ListRawComponent = DefaultListRaw;
    sortingProps: ScheduleProps[] = ['title'];
    listProps: ListProp<ScheduleProps>[] = [
    {
        propertyKey: 'status',
        getValue: (schedule: ISchedule) => {
            return (
                <ExecutionStatus
                    readOnly={!schedule.cronExp}
                    key={schedule.id}
                    schedule={schedule}
                    hasActions={this.hasActions}
                    onClick={() => {schedule.status = schedule.status === 0 ? 1 : 0; this.dispatch(switchScheduleStatus(schedule.getModel()))}}
                />
            )},
        replace: true,
        width: '10%',
    }, {
        propertyKey: 'connection.title',
        width: '15%',
        getValue: (schedule: ISchedule) => {
            return(
                <Link to={`/connections/${schedule.connection.connectionId}/update`} title={schedule.connection.title} style={{color: 'black'}}>{schedule.connection.title}</Link>
            );
        },
    }, {
        propertyKey: 'cronExp',
        width: '10%',
        getValue: (schedule: ISchedule) => {
            if(!schedule.cronExp){
                return '-';
            } else{
                return schedule.cronExp;
            }
        }
    }, {
        propertyKey: 'lastSuccessExecution',
        getValue: (schedule: ISchedule) => {
            return(
                <LastSuccessExecution schedule={schedule}/>
            );
        },
        width: '10%',
    }, {
        propertyKey: 'lastFailExecution',
        getValue: (schedule: ISchedule) => {
            return(
                <LastFailExecution schedule={schedule}/>
            );
        },
        width: '10%',
    }, {
        propertyKey: 'lastDuration',
        getValue: (schedule: ISchedule) => {return <LastDurationExecution schedule={schedule}/>},
        width: '10%',
    }, {
        propertyKey: 'debugMode',
        getValue: (schedule: ISchedule) => {
            return  <InputSwitch
                        readOnly={false}
                        color={ColorTheme.Turquoise}
                        isChecked={schedule.debugMode}
                        position={'middle'}
                        onClick={() => this.dispatch(switchScheduleLogsStatus({
                            ...schedule.getModel(), debugMode: !schedule.debugMode
                        }))}
                    />
        },
        width: '10%',
    }, {
        propertyKey: 'webhook',
        getValue: (schedule: ISchedule) => {
            if(schedule.webhook){
                return (
                    <Button
                        iconSize={TextSize.Size_12}
                        icon={'file_copy'}
                        hasBackground={false}
                        color={ColorTheme.Turquoise}
                        handleClick={() => {
                            copyStringToClipboard(schedule.webhook.url);
                            this.dispatch(copyWebhookToClipboard())
                        }}
                    />
                );
            }
        },
        width: '10%',
    }];
    gridProps = {title: 'title'};
    translations = {
        connectionTitle: 'Connection',
        cronExp: 'Cron',
        lastSuccessExecution: 'Last Success',
        lastFailExecution: 'Last Fail',
        lastDuration: 'Last Duration',
        status: 'Status',
        debugMode: 'Logs',
        webhook: 'Webhook'
    };
    getTopActions = (viewType: ViewType, checkedIds: number[] = []) => {
        const hasSearch = this.hasSearch && this.entities.length > 0;
        return(
            <React.Fragment>
                <PermissionButton autoFocus={!hasSearch} key={'add_button'} icon={'add'} href={'add'} label={'Add Schedule'} permission={SchedulePermissions.CREATE}/>
                {viewType === ViewType.LIST && this.entities.length !== 0 && <SelectedNotificationButton key={'start_button'} scheduleIds={checkedIds}/>}
                {viewType === ViewType.LIST && this.entities.length !== 0 && <PermissionButton isDisabled={checkedIds.length === 0} hasConfirmation confirmationText={'Do you really want to delete?'}  key={'delete_button'} icon={'delete'} label={'Delete'} handleClick={() => this.dispatch(deleteSchedulesById(checkedIds))} permission={SchedulePermissions.DELETE}/>}
            </React.Fragment>
        );
    };
    getListActions?: (entity: ISchedule, componentPermission: ComponentPermissionProps) => React.ReactNode = (entity: ISchedule, componentPermission: ComponentPermissionProps) => {
        const hasDeleteButton = !this.isCurrentItem(entity);
        const scheduleModel = entity.getModel();
        const webhookAction = entity.webhook ? () => this.dispatch(deleteWebhook(scheduleModel)) : () => this.dispatch(getWebhook(scheduleModel));
        return (
            <React.Fragment>
                {/*<PermissionButton href={`${entity.id}/view`} hasBackground={false} icon={'visibility'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.READ}/>*/}
                <PermissionTooltipButton target={`update_entity_${entity.id.toString()}`} position={'top'} tooltip={'Update'} href={`${entity.id}/update`} hasBackground={false} icon={'edit'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                <PermissionTooltipButton target={`start_entity_${entity.id.toString()}`} position={'top'} tooltip={'Start'} hasBackground={false} handleClick={() => this.dispatch(startSchedule(scheduleModel))} icon={'play_arrow'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                <PermissionTooltipButton target={`webhook_entity_${entity.id.toString()}`} position={'top'} tooltip={'Webhook'} hasBackground={false} handleClick={webhookAction} icon={entity.webhook ? 'link_off' : 'link'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.UPDATE}/>
                <ScheduleNotificationsIcon schedule={entity}/>
                {hasDeleteButton && <PermissionTooltipButton target={`delete_entity_${entity.id.toString()}`} position={'top'} tooltip={'Delete'} hasConfirmation confirmationText={'Do you really want to delete?'} handleClick={() => entity.deleteById()} hasBackground={false} icon={'delete'} color={ColorTheme.Turquoise} size={TextSize.Size_20} permission={componentPermission.DELETE}/>}
            </React.Fragment>
        );
    };
    dispatch: AppDispatch = null;
    deletingEntitiesState: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;
    updatingSchedule: API_REQUEST_STATE = API_REQUEST_STATE.INITIAL;

    constructor(schedules: any[], dispatch: AppDispatch, deletingEntitiesState?: API_REQUEST_STATE, isReadonly?: boolean, hasElasticSearch?: boolean, updatingSchedule?: API_REQUEST_STATE) {
        super();
        let scheduleInstances = [];
        for(let i = 0; i < schedules.length; i++){
            scheduleInstances.push(new Schedule({...schedules[i], dispatch}));
        }
        this.dispatch = dispatch;
        this.deletingEntitiesState = deletingEntitiesState;
        this.hasActions = !isReadonly;
        this.hasCheckboxes = !isReadonly;
        this.entities = [...scheduleInstances];
        this.hasElasticSearch = hasElasticSearch;
        this.updatingSchedule = updatingSchedule;
    }

    search(schedule: ISchedule, searchValue: string){
        searchValue = searchValue.toLowerCase();
        let checkTitle = schedule.title ? schedule.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        // @ts-ignore
        let checkConnectionTitle = schedule.connection.title ? schedule.connection.title.toLowerCase().indexOf(searchValue) !== -1 : false;
        return checkTitle || checkConnectionTitle;
    }

    sort(sortingProp: string, sortingType: SortType): void{
        switch (sortingProp){
            case 'title':
                this.entities = this.entities.sort((a: ISchedule, b: ISchedule) => {
                    if(sortingType === SortType.asc){
                        return this.asc(a.title, b.title);
                    } else{
                        return this.desc(a.title, b.title);
                    }
                })
                break;
        }
    }
}

export default Schedules;
