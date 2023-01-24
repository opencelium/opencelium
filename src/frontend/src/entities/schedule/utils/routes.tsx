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
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {SchedulePermissions} from "../constants";
import {ScheduleList} from "../components/pages/ScheduleList";
import ScheduleForm from "../components/pages/ScheduleForm";

export default (
    <Route path="/schedules" key={'schedules'}>
        <Route index element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><ScheduleForm isAdd permission={SchedulePermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><ScheduleForm isView permission={SchedulePermissions.READ}/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><ScheduleForm isUpdate permission={SchedulePermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)