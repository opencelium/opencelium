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

import React from "react";
import {connect} from 'react-redux';
import { Row, Col, Container } from "react-grid-system";
import {fetchSystemRequirements} from "@actions/update_assistant/fetch";
import {ListComponent} from "@decorators/ListComponent";


function mapStateToProps(state){
    const auth = state.get('auth');
    const updateAssistant = state.get('update_assistant');
    return{
        authUser: auth.get('authUser'),
        fetchingSystemRequirements: updateAssistant.get('fetchingSystemRequirements'),
        systemRequirements: updateAssistant.get('systemRequirements'),
    }
}

@connect(mapStateToProps, {fetchSystemRequirements})
@ListComponent('systemRequirements')
class SystemOverview extends React.Component{
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const {entity, updateEntity, systemRequirements} = this.props;
        entity.systemRequirements = systemRequirements;
        updateEntity(entity);
    }

    render(){
        const {systemRequirements} = this.props;
        return(
            <Container>
                {
                    Object.entries(systemRequirements.details).map(line => {
                        return(
                            <Row key={line[0]}>
                                <Col md={3}>{line[0]}</Col><Col md={9}>{line[1].status}</Col>
                            </Row>
                        )
                    })
                }
            </Container>
        );
    }
}

export default SystemOverview;
