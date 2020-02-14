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
import ContentNavigationButton from '../content/ContentNavigationButton';

import styles from '../../../themes/default/general/view_component.scss';
import {getThemeClass} from "../../../utils/app";


/**
 * Gag for Button
 */
class EmptyButton extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {authUser} = this.props;
        let classNames = ['empty_button'];
        classNames = getThemeClass({classNames, authUser, styles});
        return (
            <ContentNavigationButton
                {...this.props}
                link={''}
                icon={''}
                className={styles[classNames.empty_button]}
                type={'nothing'}
            />
        );
    }
}

EmptyButton.propTypes = {
    authUser: PropTypes.object.isRequired,
};

export default EmptyButton;