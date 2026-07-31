import React from 'react';
import ResettableRoute from "@app/router/wrappers/ResettableRoute.tsx";

const PageWrapper = ({children}) => {
    return (
        <ResettableRoute>
            {children}
        </ResettableRoute>
    )
}

export default PageWrapper;
