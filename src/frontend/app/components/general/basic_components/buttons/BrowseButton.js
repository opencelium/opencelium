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
import { BrowseButton as ToolboxBrowseButton } from "react-toolbox/lib/button";
import {formatHtmlId} from "../../../../utils/app";


/**
 * BrowseButton Component
 */
class BrowseButton extends Component{

    constructor(props){
        super(props);
    }

    render(){
        const {name, label} = this.props;
        return (
            <ToolboxBrowseButton {...this.props} id={formatHtmlId(`button_${name ? name : label}`)}/>
        );
    }
}

export default BrowseButton;