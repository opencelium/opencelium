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