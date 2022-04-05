/*
 * Copyright (C) <2022>  <becon GmbH>
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

import React from 'react';
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import {GraphiQLEditor} from "@organism/graphiql_editor/GraphiQLEditor";
import CMethod from "@classes/components/general/change_component/form_elements/CMethod";

function mapStateToProps(state){
    const connector = state.connectorReducer;
    return{
        connectors: connector.connectors,
    }
}

@connect(mapStateToProps, {})
class GraphQLBody extends React.Component{
    constructor(props) {
        super(props);
    }

    update(data){
        const {connector, method, updateEntity} = this.props;
        connector.setCurrentItem(method);
        method.setRequestBodyFields(data);
        updateEntity();
    }

    render(){
        const {readOnly, method, source, connectors, connector} = this.props;
        const currentConnector = connectors.find(c => c.connectorId === connector.id);
        let credentials = {url: '', user: '', password: ''};
        if(currentConnector){
            credentials = {
                url: currentConnector.requestData.url,
                user: currentConnector.requestData.username,
                password: currentConnector.requestData.password,
            }
        }
        const defaultValue = source === null ? method.request.getBodyFields() : source;
        return(
            <GraphiQLEditor
                update={(data) => this.update(data)}
                defaultQuery={defaultValue.query}
                readOnly={readOnly}
                credentials={credentials}
            />
        );
    }
}

GraphQLBody.propTypes = {
    id: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    connector: PropTypes.instanceOf(CConnectorItem),
    method: PropTypes.instanceOf(CMethod),
};

GraphQLBody.defaultProps = {
    readOnly: false,
    isDraft: false,
    source: null,
};

export default GraphQLBody;