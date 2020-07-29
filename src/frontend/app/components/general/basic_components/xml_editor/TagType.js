import React from 'react';
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@themes/default/general/form_methods";
import basicStyles from "@themes/default/general/basic_components";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";
import {TAG_VALUE_TYPES} from "@classes/components/general/basic_components/xml_editor/CTag";

class TagType extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {valueType, changeValueType} = this.props;
        return (
            <div className={`${theme.input}`} style={{paddingBottom: 0}}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <RadioGroup name='valueType' value={valueType} onChange={changeValueType} className={`${basicStyles.radio_group_tag_type}`}>
                    <RadioButton label={'Empty'} value={TAG_VALUE_TYPES.EMPTY} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                    <RadioButton label={'Text'} value={TAG_VALUE_TYPES.TEXT} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                    <RadioButton label={'Item'} value={TAG_VALUE_TYPES.ITEM} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                    <RadioButton label={'From Clipboard'} value={TAG_VALUE_TYPES.CLIPBOARD} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                </RadioGroup>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Tag Type'}</label>
            </div>
        );
    }
}

export default TagType;