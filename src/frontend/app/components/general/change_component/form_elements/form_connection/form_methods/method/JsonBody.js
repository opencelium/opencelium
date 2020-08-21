import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import {RequestBody} from "@decorators/RequestBody";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import {CJsonEditor} from "@classes/components/general/basic_components/json_editor/CJsonEditor";

@RequestBody(CJsonEditor)
class JsonBody extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {readOnly, method, updateBody, ReferenceComponent, onReferenceClick} = this.props;
        return(
            <ReactJson
                name={false}
                collapsed={false}
                src={method.request.getBodyFields()}
                onEdit={readOnly ? false : updateBody}
                onDelete={readOnly ? false : updateBody}
                onAdd={readOnly ? false : updateBody}
                style={{wordBreak: 'break-word', padding: '8px 0', width: '80%', display: 'inline-block', position: 'relative'}}
                ReferenceComponent={ReferenceComponent}
                onReferenceClick={onReferenceClick}
            />
        );
    }
}

JsonBody.propTypes = {
    id: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection),
    connector: PropTypes.instanceOf(CConnectorItem),
    updateBody: PropTypes.func,
};

JsonBody.defaultProps = {
    readOnly: false,
    bodyStyles: {},
    isDraft: false,
};

export default JsonBody;