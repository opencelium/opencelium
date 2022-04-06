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

import React, {FC, useEffect, useState} from 'react';
import {ScheduleListProps} from "./interfaces";
import Schedules from "@collection/Schedules";
import {Schedule} from "@class/schedule/Schedule";
import {CollectionView} from "@organism/collection_view/CollectionView";
import {useAppDispatch} from "../../../hooks/redux";
import {getAllSchedules} from "@action/schedule/ScheduleCreators";
import {API_REQUEST_STATE} from "@interface/application/IApplication";
import {SchedulePermissions} from "@constants/permissions";
import {permission} from "../../../decorators/permission";
import CurrentSchedules from "@organism/current_schedules/CurrentSchedules";
import {ExternalApplication} from "@class/external_application/ExternalApplication";
import {APP_STATUS_UP} from "@request/application/url";

const ScheduleList: FC<ScheduleListProps> = permission(SchedulePermissions.READ)(({hasTopBar, isReadonly, hasTitle}) => {
    const dispatch = useAppDispatch();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    const {elasticSearchCheckResults} = ExternalApplication.getReduxState();
    const hasElasticSearch = elasticSearchCheckResults && elasticSearchCheckResults.status === APP_STATUS_UP;
    const {gettingAllSchedules, schedules, deletingSchedulesById} = Schedule.getReduxState();
    useEffect(() => {
        dispatch(getAllSchedules());
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [schedules])
    const CSchedules = new Schedules(schedules, dispatch, deletingSchedulesById, isReadonly, hasElasticSearch);
    return (
        <React.Fragment>
            <CollectionView hasTopBar={hasTopBar} hasTitle={hasTitle} shouldBeUpdated={shouldBeUpdated} collection={CSchedules} isLoading={gettingAllSchedules === API_REQUEST_STATE.START} componentPermission={SchedulePermissions}/>
            {gettingAllSchedules === API_REQUEST_STATE.FINISH && <CurrentSchedules/>}
        </React.Fragment>
    )
})

ScheduleList.defaultProps = {
    hasTopBar: true,
    isReadonly: false,
    hasTitle: true,
}

export {
    ScheduleList,
};