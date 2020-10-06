/*
 * Copyright (C) <2020>  <becon GmbH>
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
/**
 * Select Component
 */
class Select extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {styles, tourStep, icon, iconTooltip, label, required, isFocused, hasFocusStyle, className, tooltipTourStep, ...props} = this.props;
        let {selectClassName} = this.props;
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
                    styles={{
                        ...styles,
                        option: (provided) => ({
                            ...provided,
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                        }),
                        valueContainer:(styles, {data}) => {
                            return {
                                ...styles,
                                padding: '2px 0',
                            };
                        },
                        menu: (provided) => ({
                            ...provided,
                            zIndex: 100,
                            color: 'black',
                            minWidth: '250px'
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
                        }),
                        container:(provided) => ({
                            ...provided,
                            border: 'none',
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
};

export default Select