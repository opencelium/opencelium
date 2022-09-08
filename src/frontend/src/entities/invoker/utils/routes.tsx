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
import {InvokerPermissions} from "../constants";
import {InvokerList} from "../components/pages/InvokerList";
import InvokerForm from "../components/pages/InvokerForm";

export default (
    <Route path="/invokers" key={'invokers'}>
        <Route index element={<ErrorBoundary><InvokerList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><InvokerForm isAdd permission={InvokerPermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><InvokerList/></ErrorBoundary>}/>
        <Route path=":name/view" element={<ErrorBoundary><InvokerForm isView permission={InvokerPermissions.READ}/></ErrorBoundary>}/>
        {/*<Route path=":name/update" element={<ErrorBoundary><InvokerForm isUpdate permission={InvokerPermissions.UPDATE}/></ErrorBoundary>}/>*/}
    </Route>
)