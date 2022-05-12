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