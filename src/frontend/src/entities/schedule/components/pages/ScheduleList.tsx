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

import React, {FC, useEffect, useMemo, useState} from 'react';
import {useAppDispatch} from "@application/utils/store";
import {API_REQUEST_STATE} from "@application/interfaces/IApplication";
import {permission} from "@entity/application/utils/permission";
import {APP_STATUS_UP} from "@entity/application/requests/classes/url";
import CollectionView, {ViewType} from "@app_component/collection/collection_view/CollectionView";
import {ExternalApplication} from "@entity/external_application/classes/ExternalApplication";
import {ScheduleListProps} from "./interfaces";
import Schedules from "../../collections/Schedules";
import {Schedule} from "../../classes/Schedule";
import {getAllSchedules} from "../../redux_toolkit/action_creators/ScheduleCreators";
import {SchedulePermissions} from '../../constants';
import {CurrentSchedules} from "../../components/current_schedules/CurrentSchedules";
import {checkMongoDB} from "@entity/external_application/redux_toolkit/action_creators/ExternalApplicationCreators";
import { Category } from '@entity/category/classes/Category';
import {getAllMetaConnections} from "@root/redux_toolkit/action_creators/ConnectionCreators";
import { Connection } from '@entity/connection/classes/Connection';
import connections from "@root/collections/Connections";
import {capitalize} from "@application/utils/utils";

const ScheduleList: FC<ScheduleListProps> = permission(SchedulePermissions.READ)(({hasTopBar, isReadonly, hasTitle}) => {
    const dispatch = useAppDispatch();
    const [shouldBeUpdated, setShouldBeUpdated] = useState(false);
    const {metaConnections} = Connection.getReduxState();
    const {elasticSearchCheckResults} = ExternalApplication.getReduxState();
    const hasElasticSearch = elasticSearchCheckResults && elasticSearchCheckResults.status === APP_STATUS_UP;
    const {gettingAllSchedules, schedules, deletingSchedulesById, updatingSchedule} = Schedule.getReduxState();
    const { activeCategory, categories } = Category.getReduxState();

    const filteredSchedules = useMemo(() => {
        if (activeCategory) {
            const filteredConnections = Category.getRecursivelyConnectionsByCategory(metaConnections, categories, activeCategory.id);
            return schedules.filter(s => filteredConnections.findIndex(c => c.id === s.connection.connectionId) !== -1);
        } else {
            return schedules;
        }
    }, [metaConnections, categories, schedules, activeCategory]);
    useEffect(() => {
        dispatch(getAllMetaConnections());
        dispatch(getAllSchedules());
        dispatch(checkMongoDB());
    }, [])
    useEffect(() => {
        setShouldBeUpdated(!shouldBeUpdated);
    }, [schedules]);
    const CSchedules = new Schedules(filteredSchedules, dispatch, deletingSchedulesById, isReadonly, hasElasticSearch, updatingSchedule);
    return (
        <React.Fragment>
            <CollectionView defaultViewType={ViewType.LIST} hasViewSection={false} hasTopBar={hasTopBar} hasTitle={hasTitle} shouldBeUpdated={shouldBeUpdated} collection={CSchedules} isLoading={gettingAllSchedules === API_REQUEST_STATE.START} componentPermission={SchedulePermissions}/>
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
