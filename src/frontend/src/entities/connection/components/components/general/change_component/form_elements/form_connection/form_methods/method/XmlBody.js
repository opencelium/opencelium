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
import {withTranslation} from "react-i18next";
import XmlEditor from "@app_component/base/input/xml_view/xml_editor/XmlEditor";
import CXmlEditor from "@app_component/base/input/xml_view/xml_editor/classes/CXmlEditor";
import {RequestBody} from "@entity/connection/components/decorators/RequestBody";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";


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
    className: PropTypes.string,
};

XmlBody.defaultProps = {
    readOnly: false,
    isDraft: false,
    source: null,
    className: '',
};

export default XmlBody;