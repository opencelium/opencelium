import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {DashboardForm} from "../components/pages/DashboardForm";

export default (
    <Route index element={<ErrorBoundary><DashboardForm/></ErrorBoundary>} key={'dashboard'}/>
)