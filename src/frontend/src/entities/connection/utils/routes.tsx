import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {ConnectionList} from "@root/components/pages/ConnectionList";
import ConnectionOverviewDetails from "@change_component/form_elements/form_connection/form_svg/details/ExtendedDetails";
import ConnectionOverviewTechnicalLayout from "@change_component/form_elements/form_connection/form_svg/layouts/ExtendedTechnicalLayout";
import ConnectionOverviewBusinessLayout from "@change_component/form_elements/form_connection/form_svg/layouts/ExtendedBusinessLayout";
import ConnectionAdd from "../components/components/content/connections/add/ConnectionAdd";
import ConnectionView from "../components/components/content/connections/view/ConnectionView";
import ConnectionUpdate from "../components/components/content/connections/update/ConnectionUpdate";

export default (
    <React.Fragment key={'connections'}>
        <Route path="/connections">
            <Route index element={<ErrorBoundary><ConnectionList/></ErrorBoundary>}/>
            <Route path="add" element={<ErrorBoundary><ConnectionAdd/></ErrorBoundary>}/>
            <Route path="page/:pageNumber" element={<ErrorBoundary><ConnectionList/></ErrorBoundary>}/>
            <Route path=":id/view" element={<ErrorBoundary><ConnectionView/></ErrorBoundary>}/>
            <Route path=":id/update" element={<ErrorBoundary><ConnectionUpdate/></ErrorBoundary>}/>
        </Route>
        <Route path='/connection_overview_details' element={<ErrorBoundary><ConnectionOverviewDetails/></ErrorBoundary>}/>
        <Route path='/connection_overview_technical_layout' element={<ErrorBoundary><ConnectionOverviewTechnicalLayout/></ErrorBoundary>}/>
        <Route path='/connection_overview_business_layout' element={<ErrorBoundary><ConnectionOverviewBusinessLayout/></ErrorBoundary>}/>
    </React.Fragment>
)