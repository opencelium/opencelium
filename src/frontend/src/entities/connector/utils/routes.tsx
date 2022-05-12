import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {ConnectorPermissions} from "../constants";
import {ConnectorList} from "../components/pages/ConnectorList";
import ConnectorForm from "../components/pages/ConnectorForm";
import {ConnectorOverview} from "../components/pages/ConnectorOverview";

export default (
    <Route path="/connectors" key={'connectors'}>
        <Route index element={<ErrorBoundary><ConnectorList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><ConnectorForm isAdd permission={ConnectorPermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><ConnectorList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><ConnectorOverview/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><ConnectorForm isUpdate permission={ConnectorPermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)