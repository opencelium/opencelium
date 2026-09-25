import {lazy} from 'react'
import type { JSX } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard'
import {AppLayout} from "@app/layouts/AppLayout/AppLayout.tsx";
import {PublicLayout} from "@app/layouts/PublicLayout.tsx";
import {Sandbox} from "@features/sandbox/ui/Sandbox.tsx";
import {WorkflowRouteGuard} from "@features/workflow/WorkflowRouteGuard.tsx";
import {RequireComponentRead} from "@app/router/guards/RequireComponentRead.tsx";
import {buildEntityRoutes} from "@app/router/buildEntityRoutes.tsx";
import ResettableRoute from "@app/router/wrappers/ResettableRoute.tsx";
import CreateConnectorPage from "@pages/ConnectorPage/CreateConnector.tsx";
import CreateSchedulePage from "@pages/SchedulePage/CreateSchedule.tsx";
import CreateRolePage from "@pages/RolePage/CreateRole.tsx";
import CheckLdapPage from "@pages/LdapPage/CheckLdapPage.tsx";
import UIPage from "@pages/UIPage/UIPage.tsx";

const LoginPage = lazy(() => import('@pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'))
const SetPasswordPage = lazy(() => import('@pages/SetPasswordPage'))
const ProfilePage = lazy(() => import('@pages/ProfilePage/ProfilePage.tsx'))
const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

type RouteConfig = {
    element: JSX.Element
    path?: string
    children?: RouteConfig[]
}

export function getRoutes(): RouteConfig[] {
    const {appRoutes} = buildEntityRoutes();
    return [
        {
            element: <PublicLayout/>,
            children: [
                {path: '/login', element: <LoginPage/>},
                {path: '/forgot-password', element: <ForgotPasswordPage/>},
                {path: '/set-password', element: <SetPasswordPage/>},
            ],
        },
        {
            element: <AuthGuard/>,
            children: [{
                element: <AppLayout/>,
                children: [
                    {path: '/sandbox', element: <Sandbox/>},
                    ...appRoutes,
                    // Old URL — kept so bookmarks/links from before the update-assistant path was hyphenated still work.
                    {path: '/update_assistant', element: <Navigate to="/update-assistant" replace/>},
                    {path: '/ldap/check', element: <CheckLdapPage/>},
                    {
                        path: '/ui/config',
                        element: <ResettableRoute><UIPage/></ResettableRoute>
                    },
                ],
            }],
        },
        {
            element: <AuthGuard/>,
            children: [{
                element: <AppLayout isNotCard/>,
                children: [
                    {path: '/', element: <RequireComponentRead component="DASHBOARD"><DashboardPage/></RequireComponentRead>},
                    {path: '/profile', element: <RequireComponentRead component="MYPROFILE"><ProfilePage/></RequireComponentRead>},
                    {path: '*', element: <NotFoundPage/>},
                ],
            }],
        },
        {
            element: <AuthGuard/>,
            children: [{
                element: <AppLayout isNotCard hasNoHeader hasNoFooter/>,
                children: [
                    {
                        path: '/workflow/create',
                        element: <ResettableRoute><WorkflowRouteGuard mode="create"/></ResettableRoute>
                    },
                    {
                        path: '/workflow/update/:connectionId',
                        element: <ResettableRoute><WorkflowRouteGuard mode="update"/></ResettableRoute>
                    },
                ],
            }],
        },
    ]
}
