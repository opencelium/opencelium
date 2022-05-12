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
        <Route path=":name/update" element={<ErrorBoundary><InvokerForm isUpdate permission={InvokerPermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)