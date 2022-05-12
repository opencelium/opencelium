import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {ExternalApplicationList} from "../components/pages/ExternalApplicationList";

export default (
    <Route path="/apps" key={'apps'}>
        <Route index element={<ErrorBoundary><ExternalApplicationList/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><ExternalApplicationList/></ErrorBoundary>}/>
    </Route>
)