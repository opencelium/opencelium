import { useLocation } from 'react-router-dom';
import React from "react";

// Keying the fragment remounts the subtree on navigation — same reset
// semantics as cloneElement(child, { key }), but it doesn't require the
// route content to be exactly one element.
const ResettableRoute = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();

    return <React.Fragment key={location.key}>{children}</React.Fragment>;
};

export default ResettableRoute
