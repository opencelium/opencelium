import { Layout } from 'antd';
import {Outlet, useLocation} from 'react-router-dom';
import {Card} from "@shared/ui/primitives/Card";
import {useLayoutStore} from "@app/layouts/AppLayout/layout.store.ts";
import {AnimatePresence, motion} from "framer-motion";
import React, {useEffect} from "react";
import {ErrorBoundary} from "@shared/errors/boundary/ErrorBoundary.tsx";
import {PageCrash} from "@shared/ui/feedback/crash/PageCrash.tsx";
import {AppFooter} from "@shared/ui/layout/AppFooter.tsx";

const { Content } = Layout;

type LayoutContentProps = {
    isNotCard?: boolean;
    hasNoFooter?: boolean;
}
export const LayoutContent = ({isNotCard, hasNoFooter}: LayoutContentProps) => {
    const location = useLocation();

    const { toggleCommandContent, showCommandContent } = useLayoutStore();

    const { isContentLoading} = useLayoutStore();
    useEffect(() => {
        if (showCommandContent) {
            toggleCommandContent(false);
        }
    }, [location.pathname])
    const pageContent = (
        <ErrorBoundary scope="page" resetKeys={[location.pathname]} fallback={(props) => <PageCrash {...props} />}>
            <Outlet/>
        </ErrorBoundary>
    );
    const OutletComponent = !isNotCard && !isContentLoading ?
        <Card style={{margin: 20}}>
            {pageContent}
        </Card> :
        pageContent;
    return (
        <Content
            style={{
                overflowX: 'hidden',
                overflowY: 'auto',
                width: '100%',
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
            }}>
                <div id={'command-palette-content'}/>

            {!showCommandContent &&
                <AnimatePresence mode="wait">
                    <motion.div
                        key={location.pathname}
                        initial={{
                            opacity: 0,
                            y: 8,
                            scale: 0.96,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: 8,
                            scale: 0.95,
                        }}
                        transition={{
                            duration: 0.25,
                            ease: [0.22, 1, 0.36, 1], // "liquid" easing
                            rotate: {
                                duration: 0.6,
                                ease: "easeInOut"
                            }
                        }}
                        style={{
                            originX: 0.5,
                            originY: 0.5,
                            width: '100%',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {OutletComponent}
                    </motion.div>
                </AnimatePresence>
            }
            {!showCommandContent && !hasNoFooter && <AppFooter />}
        </Content>
    );
};
