import { useLocation } from 'react-router-dom';
import React from "react";

const ResettableRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    return <>{React.cloneElement(children as React.ReactElement, { key: location.key })}</>;
};

export default ResettableRoute
