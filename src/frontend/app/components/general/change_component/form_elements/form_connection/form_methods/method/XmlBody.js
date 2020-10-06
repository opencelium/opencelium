import React from 'react';
import PropTypes from 'prop-types';
import XmlEditor from "@basic_components/xml_editor/XmlEditor";
import {RequestBody} from "@decorators/RequestBody";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";


@RequestBody(CXmlEditor)
class XmlBody extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {t, method, readOnly, updateBody, ReferenceComponent, onReferenceClick} = this.props;
        return(
            <XmlEditor
                translate={t}
                xml={method.request.getBodyFields()}
                afterUpdateCallback={updateBody}
                readOnly={readOnly}
                ReferenceComponent={ReferenceComponent}
                onReferenceClick={onReferenceClick}
            />
        );
    }
}

XmlBody.propTypes = {
    id: PropTypes.string.isRequired,
    readOnly: PropTypes.bool,
    connection: PropTypes.instanceOf(CConnection),
    connector: PropTypes.instanceOf(CConnectorItem),
    updateBody: PropTypes.func,
};

XmlBody.defaultProps = {
    readOnly: false,
    isDraft: false,
};

export default XmlBody;