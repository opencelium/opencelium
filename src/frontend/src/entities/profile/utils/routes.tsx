import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {MyProfilePermissions} from "../constants";
import MyProfile from "../components/pages/MyProfile";

export default (
    <Route path="/profile" key={'profile'} element={<ErrorBoundary><MyProfile permission={MyProfilePermissions.READ}/></ErrorBoundary>}/>
)