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
import {Schedule} from "@class/schedule/Schedule";
import Button from "../../atoms/button/Button";
import FormSection from "../../organisms/form_section/FormSection";
import FormComponent from "../../organisms/form/Form";
import {ISchedule} from "@interface/schedule/ISchedule";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {IForm} from "@interface/application/IForm";
import {useAppDispatch} from "../../../hooks/redux";
import {Connection} from "@class/connection/Connection";
import {OptionProps} from "@atom/input/select/interfaces";
import {useNavigate, useParams} from "react-router";
import {Form} from "@class/application/Form";
import {getAllConnections} from "@action/connection/ConnectionCreators";


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
    let connectionId = 0;
    if(shouldFetchConnection){
        connectionId = parseInt(urlParams.id);
    }
    const schedule = Schedule.createState<ISchedule>({id: connectionId, _readOnly: isView}, isAdd ? null : currentSchedule);
    useEffect(() => {
        if(shouldFetchConnection){
            schedule.getById()
        }
        dispatch(getAllConnections());
    },[]);
    useEffect(() => {
        if (didMount.current) {
            if(error === null && (addingSchedule === API_REQUEST_STATE.FINISH || updatingSchedule === API_REQUEST_STATE.FINISH)){
                navigate('/schedules', { replace: false });
            }
        } else {
            didMount.current = true;
        }
    },[addingSchedule, updatingSchedule]);
    const TitleInput = schedule.getText({
        propertyName: "title", props: {autoFocus: true, icon: 'title', label: 'Title', required: true}
    })
    const ConnectionForm = schedule.getSelect({propertyName: 'connectionSelect', props: {
            icon: 'sync_alt',
            label: 'Connection',
            options: connectionOptions,
            required: true,
            isLoading: gettingConnections === API_REQUEST_STATE.START,
            callback: (reference, newValue) => {reference.connectionDescription = newValue.data;}
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
    />];
    if(isAdd || isUpdate){
        let handleClick = isAdd ? () => schedule.add() : () => schedule.update();
        actions.unshift(<Button
            key={'add_button'}
            label={formData.actionButton.label}
            icon={formData.actionButton.icon}
            handleClick={handleClick}
            isLoading={addingSchedule === API_REQUEST_STATE.START}
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