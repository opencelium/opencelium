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
import {TAG_VALUE_TYPES} from "./classes/CTag";
import RadioButtons from "@basic_components/inputs/RadioButtons";


/**
 * TagType component for ChangeTag
 */
class TagType extends Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {translate, valueType, changeValueType} = this.props;
        return (
            <RadioButtons
                name='valueType'
                label={translate('XML_EDITOR.TAG.TYPE.TAG_TYPE_LABEL')}
                value={valueType}
                handleChange={changeValueType}
                style={{paddingBottom: '10px'}}
                radios={[
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.EMPTY'),
                        value: TAG_VALUE_TYPES.EMPTY,
                        labelStyle: {marginRight: '20px'}
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.TEXT'),
                        value: TAG_VALUE_TYPES.TEXT,
                        labelStyle: {marginRight: '20px'}
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.ITEM'),
                        value: TAG_VALUE_TYPES.ITEM,
                        labelStyle: {marginRight: '20px'}
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.FROM_CLIPBOARD'),
                        value: TAG_VALUE_TYPES.CLIPBOARD,
                    },
                ]}
            />
        );
    }
}

export default TagType;