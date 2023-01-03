import React, {FC, Fragment, useEffect, useState} from "react";
import Button from "@app_component/base/button/Button";
import {SelectedNotificationButtonProps} from "@entity/schedule/components/selected_notification_button/interfaces";
import ScheduleNotificationForm from "@entity/schedule/components/pages/schedule_notification/ScheduleNotificationForm";
import {Notification} from "@entity/schedule/classes/Notification";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";

const SelectedNotificationButton: FC<SelectedNotificationButtonProps> =
    ({
        scheduleIds,
    }) => {
    const [showForm, toggleForm] = useState<boolean>(false);
    const {
        addingNotificationToSelectedSchedules,
    } = Notification.getReduxState();
    const toggle = () =>{
        toggleForm(!showForm);
    }
    useEffect(() => {
        if(addingNotificationToSelectedSchedules === API_REQUEST_STATE.START){
            toggle();
        }
    }, [addingNotificationToSelectedSchedules])
    return(
        <Fragment>
            <Button isDisabled={scheduleIds.length === 0 || addingNotificationToSelectedSchedules === API_REQUEST_STATE.START} isLoading={addingNotificationToSelectedSchedules === API_REQUEST_STATE.START} key={'start_button'} handleClick={toggle} icon={'mail'} label={'Notification'}/>
            {showForm && <ScheduleNotificationForm selectedScheduleIds={scheduleIds} isPlural={true} isToggled={showForm} toggle={toggle}/>}
        </Fragment>
    )
}

export default SelectedNotificationButton;
