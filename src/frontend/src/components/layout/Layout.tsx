/*
 *  Copyright (C) <2023>  <becon GmbH>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, version 3 of the License.
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {FC, Suspense} from 'react';
import {Outlet, useLocation} from "react-router";
import {LayoutLoading} from "@app_component/base/loading/LayoutLoading";
import ContentLoading from "@app_component/base/loading/ContentLoading";
import Menu from "./menu/Menu";
import NotificationPanel from "./notification_panel/NotificationPanel";
import TopBar from "./top_bar/TopBar";

const OnlyOutletPages = ["/connection_overview_details", "/connection_overview_technical_layout", "/connection_overview_business_layout"]

const Layout: FC =
    ({
        children,
    }) => {
    const {pathname} = useLocation();
    const isOnlyOutletPage = OnlyOutletPages.indexOf(pathname) !== -1;
    return (
        <Suspense fallback={(<LayoutLoading/>)}>
            {
                !isOnlyOutletPage &&
                    <React.Fragment>
                        <TopBar/>
                        <Menu/>
                        <NotificationPanel/>
                    </React.Fragment>
            }
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
