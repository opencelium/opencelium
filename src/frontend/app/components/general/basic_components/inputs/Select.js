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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ReactSelect from 'react-select';
import ToolboxThemeInput from "../../../../hocs/ToolboxThemeInput";
import basicStyles from '@themes/default/general/basic_components.scss';
import {dotColor} from "@change_component/form_elements/form_connection/form_methods/help";
import CVoiceControl from "@classes/voice_control/CVoiceControl";

/**
 * Select Component
 */
class Select extends Component{

    constructor(props){
        super(props);

        this.state = {
            inputValue: props.inputValue ? props.inputValue : '',
        };
    }

    componentDidUpdate(prevProps){
        if(prevProps.inputValue !== this.props.inputValue){
            this.setState({
                inputValue: this.props.inputValue,
            });
        }
    }

    onInputChange(inputValue){
        const {onInputChange} = this.props;
        if(typeof onInputChange === 'function'){
            onInputChange(inputValue);
        } else {
            this.setState({inputValue});
        }
    }

    onFocus(e){
        const {onFocus} = this.props;
        if(typeof onFocus === 'function'){
            onFocus(e);
        }
        CVoiceControl.initVoiceSelect(this);
    }

    onBlur(e){
        const {onBlur, value, onChange} = this.props;
        if(typeof onBlur === 'function'){
            onBlur(e);
        }
        CVoiceControl.stopVoiceSelect(value, onChange);
    }

    render(){
        const {inputValue} = this.state;
        const {styles, tourStep, icon, iconTooltip, label, required, isFocused, hasFocusStyle, className, tooltipTourStep, ...props} = this.props;
        let {
            selectClassName, selectMenuStyles, selectMenuDropdownIndicatorStyles, selectMenuIndicatorContainerStyles, selectMenuPlaceholderStyles,
            selectMenuIndicatorSeparatorStyles, selectMenuControlStyles, selectMenuValueContainer, selectMenuSingleValueStyles,
        } = this.props;
        return (
            <ToolboxThemeInput
                tourStep={tourStep}
                icon={icon}
                iconTooltip={iconTooltip}
                label={label}
                required={required}
                isFocused={isFocused}
                labelClassName={basicStyles.select_label}
                hasFocusStyle={hasFocusStyle}
                className={className}
                tooltipTourStep={tooltipTourStep}
                inputElementClassName={basicStyles.select_input_element}
            >
                <ReactSelect
                    {...props}
                    maxMenuHeight={200}
                    minMenuHeight={50}
                    className={`${selectClassName}`}
                    onFocus={::this.onFocus}
                    onBlur={::this.onBlur}
                    onInputChange={::this.onInputChange}
                    inputValue={inputValue}
                    styles={{
                        ...styles,
                        option: (provided, {data, isDisabled,}) => ({
                            ...provided,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            ...dotColor(data.color),
                            cursor: isDisabled ? 'not-allowed' : 'default',
                        }),
                        valueContainer:(styles, {data}) => {
                            return {
                                ...styles,
                                padding: '2px 0',
                                ...selectMenuValueContainer,
                            };
                        },
                        menu: (provided) => ({
                            ...provided,
                            zIndex: 100,
                            color: 'black',
                            minWidth: '250px',
                            ...selectMenuStyles,
                        }),
                        control:(provided) => ({
                            ...provided,
                            color: 'black',
                            fontFamily: 'Arial, sans-serif',
                            borderRadius: 0,
                            border: 'none',
                            borderBottom: '1px solid #2121211f',
                            boxSizing: 'content-box',
                            minHeight: '37px',
                            ...selectMenuControlStyles,
                        }),
                        container:(provided) => ({
                            ...provided,
                            border: 'none',
                        }),
                        dropdownIndicator:(provided) => ({
                            ...provided,
                            ...selectMenuDropdownIndicatorStyles,
                        }),
                        indicatorContainer:(provided) => ({
                            ...provided,
                            ...selectMenuIndicatorContainerStyles,
                        }),
                        indicatorSeparator:(provided) => ({
                            ...provided,
                            ...selectMenuIndicatorSeparatorStyles,
                        }),
                        singleValue:(provided) => ({
                            ...provided,
                            ...selectMenuSingleValueStyles,
                        }),
                        placeholder:(provided) => ({
                            ...provided,
                            ...selectMenuPlaceholderStyles,
                        })
                    }}
                />
            </ToolboxThemeInput>
        );
    }
}

Select.propTypes = {
    tourStep: PropTypes.string,
    required: PropTypes.bool,
    selectClassName: PropTypes.string,
    iconTooltip: PropTypes.string,
    tooltipTourStep: PropTypes.string,
    hasFocusStyle: PropTypes.bool,
};

Select.defaultProps = {
    hasFocusStyle: false,
    className: '',
    tourStep: '',
    icon: '',
    label: '',
    required: false,
    selectClassName: '',
    iconTooltip: '',
    tooltipTourStep: '',
    selectMenuStyles: {},
};

export default Select