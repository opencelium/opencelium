import React, {FC} from 'react';
import MenuLink from "@molecule/menu/MenuLink";
import {SchedulePermissions} from "@constants/permissions";

const SchedulesMenuItem: FC =
    ({

     }) => {
        return (
            <MenuLink
                permission={SchedulePermissions.READ}
                size={30}
                to={'/schedules'}
                name={'update'}
                label={'Schedules'}
            />
        )
    }

SchedulesMenuItem.defaultProps = {
}


export {
    SchedulesMenuItem,
};
