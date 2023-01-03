/*
 *  Copyright (C) <2023>  <becon GmbH>
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

import React from 'react';
import {generateLabel} from '@application/utils/utils';
import styles from '@entity/connection/components/themes/default/general/basic_components.scss';

import { Link } from 'react-router';
import {NavItem, NavLink} from "reactstrap";
import TooltipFontIcon from "./tooltips/TooltipFontIcon";


/**
 * List Item Link
 */
export default function (data){

    let label = data.label;
    if(typeof label !== 'string'){
        let {navigationTitleClass} = data;
        let {text, index} = data.label;
        label = generateLabel(text, index, {keyNavigationTitle: `key_navigation_title ${navigationTitleClass}`, keyNavigationLetter: 'key_navigation_letter'});
    }
    let onClick = !data.hasOwnProperty('to') || data.to === '' || data.to === '#' ? (e) => {e.preventDefault(); data.onClick();} : null;
    let to = data.hasOwnProperty('to') ? data.to : '';
    let linkClassName = styles.list_item;
    if(data.className){
        linkClassName = `${data.className} ${linkClassName}`;
    }
    if(data.icon){
        linkClassName += ` ${styles.list_item_icon}`;
    }
    return(
        <NavItem className={data.itemClassName ? data.itemClassName : ''}>
            <NavLink
                id={data.id}
                tag={Link}
                to={to}
                onClick={onClick}
                activeClassName={data.to === '#' ? '' : styles.selected_list_item}
                className={linkClassName}>
                {
                    data.icon
                    ?
                        <TooltipFontIcon value={data.icon} tooltip={data.tooltip} tooltipPosition={'bottom'}/>
                    :
                        label
                }
            </NavLink>
        </NavItem>
    );
};