import React from 'react';
import theme from "react-toolbox/lib/input/theme.css";
import styles from "@themes/default/general/form_methods";
import basicStyles from "@themes/default/general/basic_components";
import {RadioButton, RadioGroup} from "react-toolbox/lib/radio";

class ValueType extends React.Component{
    constructor(props) {
        super(props);
    }

    render(){
        const {valueType, changeValueType} = this.props;
        return (
            <div className={`${theme.input}`} style={{paddingBottom: 0}}>
                <div className={`${theme.inputElement} ${theme.filled} ${styles.multiselect_label}`}/>
                <RadioGroup name='valueType' value={valueType} onChange={changeValueType} className={`${basicStyles.radio_group_tag_type}`}>
                    <RadioButton label={'Text'} value={'text'} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                    <RadioButton label={'Reference'} value={'reference'} className={`${basicStyles.radio_button}`} theme={{radio: `${basicStyles.radio_button_radio}`, radioChecked: `${basicStyles.radio_button_radio_checked}`, text: `${basicStyles.radio_button_text}`}}/>
                </RadioGroup>
                <span className={theme.bar}/>
                <label className={theme.label}>{'Value Type'}</label>
            </div>
        );
    }
}

export default ValueType;