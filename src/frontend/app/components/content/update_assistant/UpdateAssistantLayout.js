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

import Loading from '@loading';
import ComponentError from "../../general/app/ComponentError";
import {ERROR_TYPE} from "@utils/constants/app";
import ViewHeader from "@components/general/view_component/Header";

/**
 * Layout for UpdateAssistant
 */
class UpdateAssistantLayout extends Component{

    constructor(props){
        super(props);
    }

    render(){
        let header = {title: 'Update Assistant', breadcrumbs: [{link: '/admin_cards', text: 'Admin Cards'}],};
        return (
            <Container>
                <Suspense fallback={(<Loading/>)}>
                    <ComponentError entity={{type: ERROR_TYPE.FRONTEND, name: this.constructor.name}}>
                        <ViewHeader header={header}/>
                    </ComponentError>
                </Suspense>
            </Container>
        );
    }
}

export default UpdateAssistantLayout;