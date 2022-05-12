import React from "react";
import {Route} from "react-router-dom";
import ErrorBoundary from "@app_component/base/error_boundary/ErrorBoundary";
import {SchedulePermissions} from "../constants";
import {ScheduleList} from "../components/pages/ScheduleList";
import ScheduleForm from "../components/pages/ScheduleForm";

export default (
    <Route path="/schedules" key={'schedules'}>
        <Route index element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
        <Route path="add" element={<ErrorBoundary><ScheduleForm isAdd permission={SchedulePermissions.CREATE}/></ErrorBoundary>}/>
        <Route path="page/:pageNumber" element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
        <Route path=":id/view" element={<ErrorBoundary><ScheduleForm isView permission={SchedulePermissions.READ}/></ErrorBoundary>}/>
        <Route path=":id/update" element={<ErrorBoundary><ScheduleForm isUpdate permission={SchedulePermissions.UPDATE}/></ErrorBoundary>}/>
    </Route>
)