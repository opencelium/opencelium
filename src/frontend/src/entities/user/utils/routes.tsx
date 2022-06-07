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
import UserList from "../components/pages/UserList";
import UserForm from "../components/pages/UserForm";
import {UserPermissions} from "../constants";

export default (
    <Route path="/users" key={'user'}>
        <Route index element={<ErrorBoundary><UserList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><UserForm isAdd permission={UserPermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><UserList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><UserForm isView permission={UserPermissions.READ}/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><UserForm isUpdate permission={UserPermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)