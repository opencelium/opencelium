import React from 'react';

const NoAccess = ({message}: {message?: string}) => (
    <span>{message || `Access denied to form`}</span>
);

export default NoAccess;
