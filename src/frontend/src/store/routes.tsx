import React from 'react';

import {
    Routes,
    Route, Navigate, useLocation
} from "react-router-dom";
import {UserList} from "@page/user/UserList";
import UserForm from "@page/user/UserForm";
import {UserGroupList} from "@page/usergroup/UserGroupList";
import UserGroupForm from "@page/usergroup/UserGroupForm";
import LoginForm from "@page/login/LoginForm";
import {Layout} from "@template/Layout";
import {PageNotFound} from "@template/PageNotFound";
import ConnectorForm from "@page/connector/ConnectorForm";
import ScheduleForm from "@page/schedule/ScheduleForm";
import InvokerForm from "@page/invoker/InvokerForm";
import NotificationTemplateForm from "@page/notification_template/NotificationTemplateForm";
import MyProfile from "@page/my_profile/MyProfile";
import {Auth} from "@class/../classes/application/Auth";
import {ConnectorList} from "@page/connector/ConnectorList";
import ErrorBoundary from "../components/helper/ErrorBoundary";
import {ScheduleList} from "@page/schedule/ScheduleList";
import {ConnectionList} from "@page/connection/ConnectionList";
import {AdminCardList} from "@page/admin_cards/AdminCardList";
import {ExternalApplicationList} from "@page/external_application/ExternalApplicationList";
import {TemplateList} from "@page/connection/template/TemplateList";
import {NotificationTemplateList} from "@page/notification_template/NotificationTemplateList";
import {
    ConnectorPermissions, InvokerPermissions,
    MyProfilePermissions,
    NotificationTemplatePermissions,
    SchedulePermissions,
    UserGroupPermissions,
    UserPermissions
} from "@constants/permissions";
import {InvokerList} from "@page/invoker/InvokerList";
import ConnectionAdd from '@root/components/content/connections/add/ConnectionAdd';
import ConnectionUpdate from '@root/components/content/connections/update/ConnectionUpdate';
import ConnectionView from '@root/components/content/connections/view/ConnectionView';
import {ConnectionForm} from "@root/components/content/connections/ConnectionForm";

import ConnectionOverviewDetails from "@root/components/general/change_component/form_elements/form_connection/form_svg/details/ExtendedDetails";
import ConnectionOverviewTechnicalLayout from "@root/components/general/change_component/form_elements/form_connection/form_svg/layouts/ExtendedTechnicalLayout";
import ConnectionOverviewBusinessLayout from "@root/components/general/change_component/form_elements/form_connection/form_svg/layouts/ExtendedBusinessLayout";
import {Converter} from "@page/template_converter/Converter";
import {SubscriptionUpdateForm} from "@page/subscription_update/SubscriptionUpdateForm";
import {DashboardForm} from "@page/dasboard/DashboardForm";
import UpdateAssistant from "@root/../update_assistant/UpdateAssistant";
import ConnectorOverview from "@page/connector/ConnectorOverview";
import TemplateUpdate from "@page/connection/template/TemplateUpdate";


function RequireAuth({ children }: { children: JSX.Element }) {
    let location = useLocation();
    const {
        isAuth,
    } =  Auth.getReduxState();
    if (!isAuth) {
        return <Navigate to="/login" state={{ from: location }} replace/>;
    }
    return children;
}


export const getRoutes = () => {
    return(
        <Routes>
            <Route path="/" element={<ErrorBoundary><RequireAuth><Layout/></RequireAuth></ErrorBoundary>}>
                <Route index element={<ErrorBoundary><DashboardForm/></ErrorBoundary>}/>
                <Route path="/users">
                    <Route index element={<ErrorBoundary><UserList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><UserForm isAdd permission={UserPermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><UserList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><UserForm isView permission={UserPermissions.READ}/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><UserForm isUpdate permission={UserPermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/usergroups">
                    <Route index element={<ErrorBoundary><UserGroupList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><UserGroupForm isAdd permission={UserGroupPermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><UserGroupList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><UserGroupForm isView permission={UserGroupPermissions.READ}/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><UserGroupForm isUpdate permission={UserGroupPermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/connectors">
                    <Route index element={<ErrorBoundary><ConnectorList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><ConnectorForm isAdd permission={ConnectorPermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><ConnectorList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><ConnectorOverview/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><ConnectorForm isUpdate permission={ConnectorPermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/connections">
                    <Route index element={<ErrorBoundary><ConnectionList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><ConnectionAdd/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><ConnectionList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><ConnectionView/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><ConnectionUpdate/></ErrorBoundary>}/>
                </Route>
                <Route path="/schedules">
                    <Route index element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><ScheduleForm isAdd permission={SchedulePermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><ScheduleList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><ScheduleForm isView permission={SchedulePermissions.READ}/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><ScheduleForm isUpdate permission={SchedulePermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/invokers">
                    <Route index element={<ErrorBoundary><InvokerList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><InvokerForm isAdd permission={InvokerPermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><InvokerList/></ErrorBoundary>}/>
                    <Route path=":name/view" element={<ErrorBoundary><InvokerForm isView permission={InvokerPermissions.READ}/></ErrorBoundary>}/>
                    <Route path=":name/update" element={<ErrorBoundary><InvokerForm isUpdate permission={InvokerPermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/templates">
                    <Route index element={<ErrorBoundary><TemplateList/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><TemplateList/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><TemplateUpdate/></ErrorBoundary>}/>
                </Route>
                <Route path="/notification_templates" >
                    <Route index element={<ErrorBoundary><NotificationTemplateList/></ErrorBoundary>}/>
                    <Route path="add" element={<ErrorBoundary><NotificationTemplateForm isAdd permission={NotificationTemplatePermissions.CREATE}/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><NotificationTemplateList/></ErrorBoundary>}/>
                    <Route path=":id/view" element={<ErrorBoundary><NotificationTemplateForm isView permission={NotificationTemplatePermissions.READ}/></ErrorBoundary>}/>
                    <Route path=":id/update" element={<ErrorBoundary><NotificationTemplateForm isUpdate permission={NotificationTemplatePermissions.UPDATE}/></ErrorBoundary>}/>
                </Route>
                <Route path="/apps">
                    <Route index element={<ErrorBoundary><ExternalApplicationList/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><ExternalApplicationList/></ErrorBoundary>}/>
                </Route>
                <Route path="/admin_cards">
                    <Route index element={<ErrorBoundary><AdminCardList/></ErrorBoundary>}/>
                    <Route path="page/:pageNumber" element={<ErrorBoundary><AdminCardList/></ErrorBoundary>}/>
                </Route>
                <Route path='/connection_overview_details' element={<ErrorBoundary><ConnectionOverviewDetails/></ErrorBoundary>}/>
                <Route path='/connection_overview_technical_layout' element={<ErrorBoundary><ConnectionOverviewTechnicalLayout/></ErrorBoundary>}/>
                <Route path='/connection_overview_business_layout' element={<ErrorBoundary><ConnectionOverviewBusinessLayout/></ErrorBoundary>}/>
                <Route path="/profile" element={<ErrorBoundary><MyProfile permission={MyProfilePermissions.READ}/></ErrorBoundary>}/>
                <Route path="/update_assistant" element={<ErrorBoundary><UpdateAssistant/></ErrorBoundary>}/>
                <Route path="/update_subscription" element={<ErrorBoundary><SubscriptionUpdateForm/></ErrorBoundary>}/>
                <Route path="/template_converter" element={<ErrorBoundary><Converter/></ErrorBoundary>}/>
            </Route>
            <Route path="/login" element={<ErrorBoundary><LoginForm/></ErrorBoundary>}/>
            <Route path="/*" element={<ErrorBoundary><PageNotFound/></ErrorBoundary>}/>
        </Routes>
    )
}