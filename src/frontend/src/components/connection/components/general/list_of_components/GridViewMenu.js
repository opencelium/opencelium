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

import React from 'react';
import PropTypes from 'prop-types';
import { Dropdown, DropdownMenu, DropdownToggle } from 'reactstrap';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";
import styles from '@themes/default/general/list_of_components.scss';
import {FontIcon} from "react-toolbox/lib/font_icon/FontIcon";

const Types = (props) => {
    let icons = [];
    for(let i = 0; i < props.number * 2; i++){
        icons.push(<FontIcon key={i} value={'margin'} style={{fontSize: '10px', color: '#a5a5a5'}}/>);
    }
    return(
        <span className={styles.grid_menu_item} onClick={() => props.setGridViewType(props.number)}>
            <span style={{fontWeight: '600', margin: '0 10px'}}>
                {props.number}
            </span>
            <span style={{display: 'grid', gridTemplateColumns: `repeat(${props.number}, max-content)`}}>
                {icons}
            </span>
        </span>
    )
}

class GridViewMenu extends React.Component{
    constructor(props) {
        super(props);

        this.state = {
            isMenuOpen: false,
        }
    }

    toggleMenu(){
        this.setState({
            isMenuOpen: !this.state.isMenuOpen,
        });
    }

    render(){
        const {isMenuOpen} = this.state;
        const {setGridViewType} = this.props;
        return(
            <Dropdown isOpen={isMenuOpen} toggle={() => this.toggleMenu()}>
                <DropdownToggle
                    tag="span"
                    data-toggle="dropdown"
                    aria-expanded={isMenuOpen}
                >
                    <TooltipFontIcon tooltip={'Grid View'} value={'grid_view'} isButton={true} turquoiseTheme/>
                </DropdownToggle>
                <DropdownMenu className={styles.grid_dropdown_menu}>
                    <Types setGridViewType={setGridViewType} number={2}/>
                    <Types setGridViewType={setGridViewType} number={3}/>
                    <Types setGridViewType={setGridViewType} number={4}/>
                    <Types setGridViewType={setGridViewType} number={5}/>
                </DropdownMenu>
            </Dropdown>
        );
    }
}

GridViewMenu.propTypes = {
    setGridViewType: PropTypes.func.isRequired,
};

export default GridViewMenu;