import React from 'react';
import {ColorTheme} from "@style/Theme";
import {Widget} from "@entity/dashboard/classes/Widget";
import {toggleWidgetEdit} from "@entity/dashboard/redux_toolkit/slices/WidgetSlice";
import Button from "@app_component/base/button/Button";
import {useAppDispatch} from "@application/utils/store";

const DashboardIcon = () => {
    const dispatch = useAppDispatch();
    const {isWidgetEditOn} = Widget.getReduxState();
    return (
        <Button
            id={'dashboard-edit-icon'}
            hasBackground={false}
            iconSize={'16px'}
            color={ColorTheme.Gray}
            icon={isWidgetEditOn ? 'check_circle_outline' : 'edit'}
            handleClick={() => dispatch(toggleWidgetEdit(!isWidgetEditOn))}
        />
    )
}

export default DashboardIcon;
