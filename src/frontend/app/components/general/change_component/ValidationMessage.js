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

import styles from '../../../themes/default/general/change_component.scss';
import {getThemeClass} from "../../../utils/app";


/**
 * Component to display Validation Message
 */
class ValidationMessage extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {message, authUser, classNames} = this.props;
        if(message === ''){
            return null;
        }
        let defaultClassNames = ['validation_message', 'message'];
        defaultClassNames = getThemeClass({classNames: defaultClassNames, authUser, styles});
        let validationMessageClassName = `${styles[defaultClassNames.validation_message]}`;
        let messageClassName = `${styles[defaultClassNames.message]}`;
        if(classNames){
            if(classNames.hasOwnProperty('validationMessage')){
                validationMessageClassName += ` ${classNames.validationMessage}`;
            }
            if(classNames.hasOwnProperty('message')){
                messageClassName += ` ${classNames.message}`;
            }
        }
        return (
            <div className={validationMessageClassName}>
                <span className={messageClassName}>
                    {message}
                </span>
            </div>
        );
    }
}

ValidationMessage.propTypes = {
    message: PropTypes.string.isRequired,
};

ValidationMessage.defaultProps = {
    classNames: null,
};


export default ValidationMessage;