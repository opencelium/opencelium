/*
 * Copyright (C) <2020>  <becon GmbH>
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

import React, {Component, Suspense} from 'react';
import {Container} from 'react-grid-system';

import Loading from '../../general/app/Loading';
import ComponentError from "../../general/app/ComponentError";
import {ERROR_TYPE} from "../../../utils/constants/app";
import {checkConnection} from "../../../decorators/checkConnection";


/**
 * Layout for Connections
 */
@checkConnection()
class ConnectionLayout extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {children, authUser} = this.props;
        return (
            <Container>
                <Suspense fallback={(<Loading authUser={authUser}/>)}>
                    <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: this.constructor.name}}>
                        {children}
                    </ComponentError>
                </Suspense>
            </Container>
        );
    }
}

export default ConnectionLayout;