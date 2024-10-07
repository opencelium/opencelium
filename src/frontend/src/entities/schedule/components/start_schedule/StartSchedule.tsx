import React, {useEffect} from 'react';
import Subscription from "@entity/license_management/classes/Subscription";
import {PermissionTooltipButton} from "@app_component/base/button/PermissionButton";
import {startSchedule} from "@entity/schedule/redux_toolkit/action_creators/ScheduleCreators";
import {TextSize} from "@app_component/base/text/interfaces";
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {getCurrentSubscription} from "@entity/license_management/redux_toolkit/action_creators/SubscriptionCreators";

const StartSchedule = ({entity, scheduleModel, componentPermission}: any) => {
    const dispatch = useAppDispatch();
    const {currentSubscription, gettingCurrentSubscription} = Subscription.getReduxState();
    const isDisabled = !currentSubscription || currentSubscription.currentOperationUsage >= currentSubscription.totalOperationUsage;
    useEffect(() => {
        dispatch(getCurrentSubscription())
    }, []);
    return (
        <PermissionTooltipButton
            target={`start_entity_${entity.id.toString()}`}
            position={'top'}
            tooltip={'Start'}
            hasBackground={false}
            handleClick={() => dispatch(startSchedule(scheduleModel))}
            icon={'play_arrow'}
            size={TextSize.Size_20}
            permission={componentPermission.UPDATE}
            isLoading={gettingCurrentSubscription !== API_REQUEST_STATE.FINISH}
            isDisabled={isDisabled}
        />
    )
}

export default StartSchedule;
