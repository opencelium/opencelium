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
import {Label, Input} from 'reactstrap';

import styles from '@themes/default/general/basic_components.scss';


/**
 * Checkbox Component
 */
class Checkbox extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {className, labelClassName, inputClassName, checked, label, inputPosition, ...props} = this.props;
        if(label !== ''){
            return (
                <Label style={{margin: 0}} className={className}>
                    {inputPosition === 'right'
                        ?
                            <React.Fragment>
                                <span className={`${styles.checkbox_label} ${labelClassName}`}>{label}</span>
                                <Input type = "checkbox" {...props} checked={checked} className={`${inputClassName} ${styles.checkbox}`}/>
                            </React.Fragment>
                        :
                            <React.Fragment>
                                <Input type = "checkbox" {...props} checked={checked} className={`${inputClassName} ${styles.checkbox}`}/>
                                <span className={`${styles.checkbox_label} ${labelClassName}`}>{label}</span>
                            </React.Fragment>
                    }
                </Label>
            );
        } else{
            return(
                <Input type="checkbox" {...props} checked={checked} className={`${inputClassName !== '' ? inputClassName : className} ${styles.checkbox}`}/>
            );
        }
    }
}

Checkbox.propTypes = {
    className: PropTypes.string,
    labelClassName: PropTypes.string,
    inputClassName: PropTypes.string,
    inputPosition: PropTypes.oneOf(['right', 'left']),
};

Checkbox.defaultProps = {
    label: '',
    checked: false,
    className: '',
    labelClassName: '',
    inputClassName: '',
    inputPosition: 'right',
};

export default Checkbox;