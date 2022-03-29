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
import Select from 'react-select';

/**
 * Select Component
 */
class ReactSelect extends Component{

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
    }

    onBlur(e){
        const {onBlur, value, onChange} = this.props;
        if(typeof onBlur === 'function'){
            onBlur(e);
        }
    }

    render(){
        const {inputValue} = this.state;
        const {styles, tourStep, icon, iconTooltip, label, required, isFocused, hasFocusStyle, className, tooltipTourStep, error, ...props} = this.props;
        let {selectClassName, selectMenuStyles, selectMenuControlStyles, selectMenuValueContainer} = this.props;
        return (
            <Select
                {...props}
                maxMenuHeight={200}
                minMenuHeight={50}
                className={`${selectClassName}`}
                onFocus={(e) => this.onFocus(e)}
                onBlur={(e) => this.onBlur(e)}
                onInputChange={(value) => this.onInputChange(value)}
                inputValue={inputValue}
                styles={{
                    ...styles,
                }}
            />
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
    selectMenuValueContainer: {},
    selectMenuControlStyles: {},
    error: '',
};

export default ReactSelect