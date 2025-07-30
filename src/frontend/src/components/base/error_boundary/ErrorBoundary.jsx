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
import Card from "@app_component/base/card/Card";

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
            return (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 2rem)'}}>
                    <Card>
                        <h3 style={{textAlign: 'center', padding: '20px 40px 10px'}}>Oops! An error occurred while processing your request.</h3>
                        <div style={{borderBottom: '1px solid black', width: '100%'}}/>
                        <div style={{textAlign: 'center', fontSize: '24px', padding: '20px 40px 20px'}}>
                            <p style={{textAlign: 'center'}}>Please, contact our support team if the problem persists.</p>
                            <p>We apologize for the inconvenience.</p>
                        </div>
                    </Card>
                </div>
            );
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
