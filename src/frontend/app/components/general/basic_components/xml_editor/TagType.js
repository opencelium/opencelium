import React, {Component} from 'react';
import {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/xml_editor/CTag";
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
                        inputStyle: {display: 'block'},
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.TEXT'),
                        value: TAG_VALUE_TYPES.TEXT,
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.ITEM'),
                        value: TAG_VALUE_TYPES.ITEM,
                        style: {display: 'block'}
                    },
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.FROM_CLIPBOARD'),
                        value: TAG_VALUE_TYPES.CLIPBOARD,
                        inputStyle: {display: 'block'},
                        labelStyle: {display: 'flex'}
                    },
                ]}
            />
        );
    }
}

export default TagType;