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