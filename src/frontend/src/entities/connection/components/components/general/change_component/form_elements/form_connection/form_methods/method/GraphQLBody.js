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
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import CMethod from "@entity/connection/components/classes/components/general/change_component/form_elements/CMethod";
import {GraphiQLEditor} from "@root/components/graphiql_editor/GraphiQLEditor";

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
        const {readOnly, method, connectors, connector} = this.props;
        const currentConnector = connectors.find(c => c.connectorId === connector.id);
        const value = method.request.getBodyFields();
        return(
            <GraphiQLEditor
                update={(data) => this.update(data)}
                query={value.query}
                readOnly={readOnly}
                connector={currentConnector || connector}
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