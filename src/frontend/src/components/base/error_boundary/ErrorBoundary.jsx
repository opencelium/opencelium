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

import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        //Console.print(errorInfo.componentStack)
    }

    render() {
        if (this.state.hasError) {
            return <h1 style={{textAlign: 'center', marginTop: '20%'}}>This feature is currently in development phase</h1>;
        }
        return this.props.children;
    }
}

export const ErrorWrapper = ({children}) => {
    return(
        <ErrorBoundary>
            {children}
        </ErrorBoundary>
    )
}