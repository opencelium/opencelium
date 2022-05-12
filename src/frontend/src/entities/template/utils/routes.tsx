import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {TemplateList} from "@root/components/pages/template/TemplateList";
import TemplateUpdate from "@root/components/pages/template/TemplateUpdate";

export default (
    <Route path="/templates" key={'templates'}>
        <Route index element={<ErrorBoundary><TemplateList/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><TemplateList/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><TemplateUpdate/></ErrorBoundary>}/>
    </Route>
)