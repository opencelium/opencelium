/*
 * Copyright (C) <2019>  <becon GmbH>
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


import styles from '../../../themes/default/general/basic_components.scss';
import {addCancelKeyNavigation, removeCancelKeyNavigation} from "../../../utils/key_navigation";
import {getThemeClass} from "../../../utils/app";
import FontIcon from "./FontIcon";


/**
 * (not used) Button Component to Cancel Loading
 */
class CancelLoadingButton extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addCancelKeyNavigation(this);
    }

    componentWillUnmount(){
        removeCancelKeyNavigation(this);
    }
    
    render(){
        const {cancel, authUser} = this.props;
        let classNames = ['cancel_loading_button'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <FontIcon value='cancel' onClick={cancel} className={styles[classNames.cancel_loading_button]}/>
        );
    }
}

CancelLoadingButton.propTypes = {
    authUser: PropTypes.object.isRequired,
};

export default CancelLoadingButton;