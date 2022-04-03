

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
import XmlEditor from "@basic_components/xml_editor/XmlEditor";
import {withTranslation} from "react-i18next";
import {RequestBody} from "@decorators/RequestBody";
import CConnection from "@classes/components/content/connection/CConnection";
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import CXmlEditor from "@classes/components/general/basic_components/xml_editor/CXmlEditor";


@withTranslation('basic_components')
@RequestBody(CXmlEditor)
class XmlBody extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {t, method, readOnly, updateBody, ReferenceComponent, onReferenceClick, source} = this.props;
        const xml = source === null ? method.request.getBodyFields() : source;
        return(
            <XmlEditor
                translate={t}
                xml={xml}
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
    source: null,
};

export default XmlBody;