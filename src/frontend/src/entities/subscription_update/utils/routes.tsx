import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {SubscriptionUpdateForm} from "../components/SubscriptionUpdateForm";

export default (
    <Route path="/update_subscription" key={'update_subscription'} element={<ErrorBoundary><SubscriptionUpdateForm/></ErrorBoundary>}/>
)