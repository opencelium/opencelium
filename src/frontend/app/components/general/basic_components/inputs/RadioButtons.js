/*
 * Copyright (C) <2021>  <becon GmbH>
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
import styles from "@themes/default/general/change_component";
import {Input} from 'reactstrap';
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";

class RadioButtons extends React.Component{
    constructor(props) {
        super(props);
    }

    onChange(e){
        this.props.handleChange(e.target.value);
    }

    renderRadios(){
        const {radios, value} = this.props;
        return radios.map(radio => {
            const {label, inputStyle, labelStyle, inputClassName, labelClassName, ...props} = radio;
            return(
                <React.Fragment key={label}>
                    <Input type="radio" {...props} checked={value === radio.value} onChange={::this.onChange} style={inputStyle} className={inputClassName ? inputClassName : ''}/>
                    <span className={`${styles.radio_button_label} ${labelClassName ? labelClassName : ''}`} style={labelStyle}>{label}</span>
                </React.Fragment>
            );
        });
    }

    render(){
        const {hasToolboxTheme, style, className, radios, label, inline, handleChange, ...props} = this.props;
        if(hasToolboxTheme) {
            return (
                <ToolboxThemeInput style={{...style, height: style.height ? style.height : label !== '' ? '78px' : 'auto'}} className={`${className} ${inline ? styles.radios_inline : styles.radios_block}`} label={label} {...props}>
                    {this.renderRadios()}
                </ToolboxThemeInput>
            );
        } else{
            return (
                <span style={style} className={className}>
                    {this.renderRadios()}
                </span>
            )
        }
    }
}

RadioButtons.propTypes = {
    hasToolboxTheme: PropTypes.bool,
    required: PropTypes.bool,
    inline: PropTypes.bool,
    label: PropTypes.string.isRequired,
    icon: PropTypes.string,
    tourStep: PropTypes.string,
    value: PropTypes.string.isRequired,
    handleChange: PropTypes.func.isRequired,
    radios: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
        inputStyle: PropTypes.object,
        labelStyle: PropTypes.object,
        inputClassName: PropTypes.string,
        labelClassName: PropTypes.string,
    }))
};

RadioButtons.defaultProps = {
    required: false,
    icon: '',
    tourStep: '',
    style: {},
    className: '',
    hasToolboxTheme: true,
    inline: true,
};

export default RadioButtons;