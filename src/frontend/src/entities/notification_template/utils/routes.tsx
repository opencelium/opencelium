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
import {NotificationTemplatePermissions} from "../constants";
import {NotificationTemplateList} from "../components/pages/NotificationTemplateList";
import NotificationTemplateForm from "../components/pages/NotificationTemplateForm";

export default (
    <Route path="/notification_templates" key={'notification_templates'}>
        <Route index element={<ErrorBoundary><NotificationTemplateList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><NotificationTemplateForm isAdd permission={NotificationTemplatePermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><NotificationTemplateList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><NotificationTemplateForm isView permission={NotificationTemplatePermissions.READ}/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><NotificationTemplateForm isUpdate permission={NotificationTemplatePermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)