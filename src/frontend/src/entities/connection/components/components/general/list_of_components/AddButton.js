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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import ContentNavigationButton from '../content/ContentNavigationButton';

import styles from '@entity/connection/components/themes/default/general/list_of_components.scss';
import {addAddEntityKeyNavigation, removeAddEntityKeyNavigation} from "@entity/connection/components/utils/key_navigation";
import {getThemeClass} from "@application/utils/utils";


/**
 * Add Button for List of Component
 */
class AddButton extends Component{

    constructor(props){
        super(props);
    }

    componentDidMount(){
        addAddEntityKeyNavigation(this);
    }

    componentWillUnmount(){
        removeAddEntityKeyNavigation(this);
    }

    render(){
        const {isPressedAddEntity, authUser, hasTour} = this.props;
        let classNames = ['add_button'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <ContentNavigationButton
                {...this.props}
                icon={'add'}
                className={styles[classNames.add_button]}
                buttonClassname={`${hasTour ? 'tour-step-delete-add' : ''}`}
                isPressedButton={isPressedAddEntity}
                type={'add'}
            />
        );
    }
}

AddButton.propTypes = {
    isPressedAddEntity: PropTypes.bool,
    link: PropTypes.string.isRequired,
};

AddButton.defaultProps = {
    isPressedAddEntity: false,
};

export default AddButton;