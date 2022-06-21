/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactJson from 'react-json-view';
import {withTranslation} from "react-i18next";
import {RequestBody} from "@entity/connection/components/decorators/RequestBody";
import CConnection from "@entity/connection/components/classes/components/content/connection/CConnection";
import CConnectorItem from "@entity/connection/components/classes/components/content/connection/CConnectorItem";
import {CJsonEditor} from "@entity/connection/components/classes/components/general/basic_components/json_editor/CJsonEditor";

@withTranslation('basic_components')
@RequestBody(CJsonEditor)
class JsonBody extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {readOnly, method, updateBody, ReferenceComponent, onReferenceClick, source} = this.props;
        const src = source === null ? method.request.getBodyFields() : source;
        return(
            <ReactJson
                name={false}
                collapsed={false}
                src={src}
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
    source: null,
    noPlaceholder: false,
};

export default JsonBody;