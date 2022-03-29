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
