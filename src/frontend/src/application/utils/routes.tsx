/*
 * Copyright (C) <2022>  <becon GmbH>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3 of the License.
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React from 'react';

import {
    Routes,
    Route, Navigate, useLocation
} from "react-router-dom";
import {Layout} from "@app_component/layout/Layout";
import {Auth} from "../classes/Auth";
import ErrorBoundary from "../../components/base/error_boundary/ErrorBoundary";
import LoginForm from "@app_component/default_pages/login/LoginForm";
import {PageNotFound} from "@app_component/default_pages/page_not_found/PageNotFound";
import {Routes as EntityRoutes} from "@entity/index"

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
                {EntityRoutes}
            </Route>
            <Route path="/login" element={<ErrorBoundary><LoginForm/></ErrorBoundary>}/>
            <Route path="/*" element={<ErrorBoundary><PageNotFound/></ErrorBoundary>}/>
        </Routes>
    )
}