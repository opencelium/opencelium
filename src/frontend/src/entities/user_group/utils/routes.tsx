/*
 *  Copyright (C) <2022>  <becon GmbH>
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
import {UserGroupPermissions} from "../constants";
import {UserGroupList} from "../components/pages/UserGroupList";
import UserGroupForm from "../components/pages/UserGroupForm";

export default (
    <Route path="/usergroups" key={'user_group'}>
        <Route index element={<ErrorBoundary><UserGroupList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><UserGroupForm isAdd permission={UserGroupPermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><UserGroupList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><UserGroupForm isView permission={UserGroupPermissions.READ}/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><UserGroupForm isUpdate permission={UserGroupPermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)