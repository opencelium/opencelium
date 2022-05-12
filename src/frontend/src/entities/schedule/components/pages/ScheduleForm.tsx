/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React, {FC, useEffect, useRef} from "react";
import {useNavigate, useParams} from "react-router";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {IForm} from "@application/interfaces/IForm";
import {useAppDispatch} from "@application/utils/redux";
import {Form} from "@application/classes/Form";
import Button from "@app_component/base/button/Button";
import FormSection from "@app_component/form/form_section/FormSection";
import FormComponent from "@app_component/form/form/Form";
import {OptionProps} from "@app_component/base/input/select/interfaces";
import {Connection} from "@entity/connection/classes/Connection";
import {getAllConnections} from "@entity/connection/redux_toolkit/action_creators/ConnectionCreators";
import { setCurrentSchedule } from "../../redux_toolkit/slices/ScheduleSlice";
import {Schedule} from "../../classes/Schedule";
import {ISchedule} from "../../interfaces/ISchedule";


const ScheduleForm: FC<IForm> = ({isAdd, isView, isUpdate}) => {
    const {
        addingSchedule, gettingScheduleById, currentSchedule, updatingSchedule, error,
    } = Schedule.getReduxState();
    const dispatch = useAppDispatch();
    const {gettingConnections, connections} = Connection.getReduxState()
    const connectionOptions: OptionProps[] = connections.map(connection => {return {label: connection.title, value: connection.connectionId.toString(), data: connection.description}});
    const didMount = useRef(false);
    let navigate = useNavigate();
    let urlParams = useParams();
    const shouldFetchConnection = isUpdate || isView;
    const form = new Form({isView, isAdd, isUpdate});
    const formData = form.getFormData('schedule');
    let scheduleId = 0;
    if(shouldFetchConnection){
        scheduleId = parseInt(urlParams.id);
    }
    const schedule = Schedule.createState<ISchedule>({id: scheduleId, _readOnly: isView, status: 1}, isAdd ? null : currentSchedule);
    useEffect(() => {
        if(shouldFetchConnection){
            schedule.getById()
        }
        dispatch(getAllConnections());
        return () => {
            dispatch(setCurrentSchedule(null));
        }
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (isAdd && addingSchedule === API_REQUEST_STATE.FINISH || isUpdate && updatingSchedule === API_REQUEST_STATE.FINISH)){
                navigate('/schedules', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingSchedule, updatingSchedule]);
    const TitleInput = schedule.getText({
        propertyName: "title", props: {autoFocus: !isView, icon: 'title', label: 'Title', required: true}
    })
    const ConnectionForm = schedule.getSelect({propertyName: 'connectionSelect', props: {
        icon: 'sync_alt',
        label: 'Connection',
        options: connectionOptions,
        required: true,
        isLoading: gettingConnections === API_REQUEST_STATE.START,
    }})
    const ConnectionDescriptionInput = schedule.getTextarea({
        propertyName: "connectionDescription", props:{
            readOnly: true,
        }
    })
    const DebugModeInput = schedule.getSwitch({
        propertyName: "debugMode", props: {icon: 'summarize', label: 'Logs', name: schedule.debugMode ? 'Logs are activated' : 'Logs are deactivated'}
    })
    const CronExpInput = schedule.getCronExp();
    let actions = [<Button
        key={'list_button'}
        label={formData.listButton.label}
        icon={formData.listButton.icon}
        href={'/schedules'}
        autoFocus={isView}
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => schedule.add() : () => schedule.update();
        actions.unshift(<Button
            key={'action_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingSchedule === API_REQUEST_STATE.START || updatingSchedule === API_REQUEST_STATE.START}
        />);
    }
    const data = {
        title: formData.formTitle,
        actions,
        formSections: [
            <FormSection label={{value: 'General Data'}}>
                {TitleInput}
                {DebugModeInput}
                {ConnectionForm}
                {ConnectionDescriptionInput}
                {CronExpInput}
            </FormSection>
        ]
    }
    return(
        <FormComponent {...data} isLoading={shouldFetchConnection && gettingScheduleById === API_REQUEST_STATE.START}/>
    )
}

export default ScheduleForm