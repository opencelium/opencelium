/*
 * Copyright (C) <2022>  <becon GmbH>
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

import styles from '@themes/default/general/view_component.scss';
import {getThemeClass} from "@utils/app";
import {TextSize} from "@atom/text/interfaces";
import Button from "@basic_components/buttons/Button";


/**
 * List Button for ViewComponent
 */
class ListButton extends Component{

    constructor(props){
        super(props);
    }

    render(){
        return (
            <ContentNavigationButton
                {...this.props}
                icon={'list_alt'}
                type={'list'}
                size={TextSize.Size_16}
            />
        );
    }
}

ListButton.propTypes = {
    link: PropTypes.string.isRequired,
    permission: PropTypes.object.isRequired,
};

export default ListButton;