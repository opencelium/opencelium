import {lazy} from 'react'
import type { JSX } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthGuard } from './guards/AuthGuard'
import {AppLayout} from "@app/layouts/AppLayout/AppLayout.tsx";
import {PublicLayout} from "@app/layouts/PublicLayout.tsx";
import {Sandbox} from "@features/sandbox/ui/Sandbox.tsx";
import Workflow from "@features/workflow";
import {buildEntityRoutes} from "@app/router/buildEntityRoutes.tsx";
import ResettableRoute from "@app/router/wrappers/ResettableRoute.tsx";
import CreateConnectorPage from "@pages/ConnectorPage/CreateConnector.tsx";
import CreateSchedulePage from "@pages/SchedulePage/CreateSchedule.tsx";
import CreateRolePage from "@pages/RolePage/CreateRole.tsx";
import CheckLdapPage from "@pages/LdapPage/CheckLdapPage.tsx";
import UIPage from "@pages/UIPage/UIPage.tsx";

const LoginPage = lazy(() => import('@pages/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@pages/ForgotPasswordPage'))
const ProfilePage = lazy(() => import('@pages/ProfilePage/ProfilePage.tsx'))
const DashboardPage = lazy(() => import('@pages/DashboardPage'))

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
            ],
        },
        {
            element: <AuthGuard/>,
            children: [{
                element: <AppLayout/>,
                children: [
                    {path: '/sandbox', element: <Sandbox/>},
                    ...appRoutes,
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
                    {path: '/', element: <DashboardPage/>},
                    {path: '/profile', element: <ProfilePage/>},
                ],
            }],
        },
        {
            element: <AuthGuard/>,
            children: [{
                element: <AppLayout isNotCard hasNoHeader/>,
                children: [
                    {
                        path: '/connection/create',
                        element: <ResettableRoute><Workflow/></ResettableRoute>
                    },
                    {
                        path: '/connection/update/:connectionId',
                        element: <ResettableRoute><Workflow/></ResettableRoute>
                    },
                    {
                        path: '/connection/view/:connectionId',
                        element: <ResettableRoute><Workflow readOnly /></ResettableRoute>
                    },
                ],
            }],
        },
    ]
}
