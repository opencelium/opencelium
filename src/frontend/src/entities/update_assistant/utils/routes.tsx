import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import UpdateAssistant from "../components/UpdateAssistant";

export default (
    <Route path="/update_assistant" key={'update_assistant'} element={<ErrorBoundary><UpdateAssistant/></ErrorBoundary>}/>
)