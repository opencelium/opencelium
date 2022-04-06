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

import React, {FC, Suspense} from 'react';
import Menu from "@organism/menu/Menu";
import {Outlet} from "react-router";
import NotificationPanel from "@organism/notification_panel/NotificationPanel";
import TopBar from "@organism/top_bar/TopBar";
import LayoutLoading from "@molecule/loading/LayoutLoading";
import ContentLoading from "@molecule/loading/ContentLoading";

const Layout: FC =
    ({
        children,
    }) => {
    return (
        <Suspense fallback={(<LayoutLoading/>)}>
            <TopBar/>
            <Menu/>
            <NotificationPanel/>
            <Suspense fallback={(<ContentLoading/>)}>
                <Outlet/>
            </Suspense>
        </Suspense>
    )
}

Layout.defaultProps = {
}


export {
    Layout,
};
