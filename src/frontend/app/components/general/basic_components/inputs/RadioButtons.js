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