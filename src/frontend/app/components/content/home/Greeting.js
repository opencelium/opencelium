/*
 * Copyright (C) <2021>  <becon GmbH>
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

import React, { Component }  from 'react';
import {connect} from "react-redux";

import { Container, Row, Col } from "react-grid-system";
import {tour} from "@decorators/tour";
import {OC_TOURS} from "@utils/constants/tours";

function mapStateToProps(state){
    const auth = state.get('auth');
    return {
        authUser: auth.get('authUser'),
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
 * Greeting Component
 */
@connect(mapStateToProps, {})
@tour(OC_TOURS, filterOCSteps)
class Greeting extends Component{

    constructor(props){
        super(props);
    }

    render(){
        return (
            <Row>
                <Col md={12}>
                    <Container>
                        Here is a home page
                    </Container>
                </Col>
            </Row>
        );
    }
}

export default Greeting;