import React, {Component} from 'react';
import RadioButtons from "@basic_components/inputs/RadioButtons";


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
                style={{paddingBottom: '10px'}}
                radios={[
                    {
                        label: translate('XML_EDITOR.TAG.TYPE.TEXT'),
                        value: 'text',
                        inputStyle: {display: 'block'},
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