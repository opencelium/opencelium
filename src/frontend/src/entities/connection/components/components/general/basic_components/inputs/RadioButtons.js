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

import React from 'react';
import PropTypes from 'prop-types';
import styles from "@entity/connection/components/themes/default/general/change_component.scss";
import {Input} from 'reactstrap';
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";
import Loading from "@components/general/app/Loading";

class RadioButtons extends React.Component{
    constructor(props) {
        super(props);
    }

    onChange(e){
        const {readOnly, handleChange} = this.props;
        if(!readOnly){
            handleChange(e.target.value);
        }
    }

    renderRadios(){
        const {radios, value, id} = this.props;
        return radios.map((radio, index) => {
            const {label, inputStyle, isLoading, labelStyle, inputClassName, labelClassName, ...props} = radio;
            if(isLoading){
                return(
                    <Loading style={{minHeight: 0, display: 'flex', justifyContent: 'center',alignItems: 'center', margin: 0, width: '100% !important'}} spinnerStyle={{width: '14px', height: '14px', margin: 0, minHeight: 0}}/>
                );
            }
            return(
                <React.Fragment key={label}>
                    <Input id={index === 0 ? id : `${id}_${index}`} type="radio" {...props} checked={value === radio.value} onChange={(a) => this.onChange(a)} style={inputStyle} className={inputClassName ? inputClassName : ''}/>
                    <span onClick={() => this.onChange({target: {value: radio.value}})} className={`${styles.radio_button_label} ${labelClassName ? labelClassName : ''}`} style={labelStyle}>{label}</span>
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
    icon: PropTypes.any,
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