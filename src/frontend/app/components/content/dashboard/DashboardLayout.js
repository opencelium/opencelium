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
import {connect} from 'react-redux';
import {Container} from 'react-grid-system';

import Loading from '../../general/app/Loading';
import ComponentError from "../../general/app/ComponentError";
import {ERROR_TYPE} from "../../../utils/constants/app";
import DashboardView from "./view/DashboardView";
import {OC_TOURS} from "../../../utils/constants/tours";
import {tour} from "../../../decorators/tour";


function mapStateToProps(state){
    const auth = state.get('auth');
    return{
        authUser: auth.get('authUser'),
        logining: auth.get('logining'),
        logouting: auth.get('logouting'),
    };
}
function filterOCSteps(tourSteps){
    const {authUser} = this.props;
    let steps = [];
    if(authUser && authUser.hasOwnProperty('userGroup')) {
        let userGroup = authUser.userGroup;
        if(userGroup && userGroup.hasOwnProperty('components')) {
            let components = userGroup.components;
            if(components && components.length > 0) {
                steps.push(tourSteps[0]);
                for(let i = 1; i < tourSteps.length - 1; i++){
                    let selector = tourSteps[i].selector.split('-');
                    let selectorHeader = selector[2].toUpperCase();
                    let index = components.findIndex(c => {
                        return c.name === selectorHeader && c.permissions.indexOf('READ') !== -1;
                    });
                    if(index !== -1){
                        steps.push(tourSteps[i]);
                    }
                }
                steps.push(tourSteps[9]);
            }
        }
    }

    return steps;
}

/**
 * Layout for Connectors
 */
@connect(mapStateToProps, {})
@tour(OC_TOURS, filterOCSteps)
class DashboardLayout extends Component{

    constructor(props){
        super(props);
    }


    render(){
        const {logining, logouting, authUser} = this.props;
        const content = logining || logouting ? <Loading authUser={authUser}/> : <DashboardView/>;
        return (
            <Container>
                <Suspense fallback={(<Loading authUser={authUser}/>)}>
                    <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: this.constructor.name}}>
                        {content}
                    </ComponentError>
                </Suspense>
            </Container>
        );
    }
}

export default DashboardLayout;