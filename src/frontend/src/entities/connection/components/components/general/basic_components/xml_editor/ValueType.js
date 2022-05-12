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

import React, {Component} from 'react';
import RadioButtons from "@entity/connection/components/components/general/basic_components/inputs/RadioButtons";


/**
 * ValueType component for Value
 */
class ValueType extends Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {translate, valueType, changeValueType} = this.props;
        return (
            <RadioButtons
                name='valueType'
                label={translate('XML_EDITOR.TAG.TYPE.VALUE_TYPE')}
                value={valueType}
                handleChange={changeValueType}
                style={{paddingBottom: '10px', height: 'auto'}}
                radios={[
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.TEXT'),
                        value: 'text',
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.REFERENCE'),
                        value: 'reference',
                    },
                ]}
            />
        );
    }
}

export default ValueType;