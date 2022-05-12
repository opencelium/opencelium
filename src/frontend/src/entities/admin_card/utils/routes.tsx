import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {AdminCardList} from "../components/pages/AdminCardList";

export default (
    <Route path="/admin_cards" key={'admin_cards'}>
        <Route index element={<ErrorBoundary><AdminCardList/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><AdminCardList/></ErrorBoundary>}/>
    </Route>
)