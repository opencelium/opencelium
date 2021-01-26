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

    render(){
        const {systemRequirements} = this.props;
        return(
            <Container>
                {
                    Object.entries(systemRequirements).map(line => {
                        return(
                            <Row key={line}>
                                <Col md={3}>{line[0]}</Col><Col md={9}>{line[1]}</Col>
                            </Row>
                        )
                    })
                }
            </Container>
        );
    }
}

export default SystemOverview;
