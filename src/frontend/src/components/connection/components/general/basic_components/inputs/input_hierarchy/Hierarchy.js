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
import HierarchyItem from "./HierarchyItem";
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";
import {
    addSelectArrowDownKeyNavigation,
    addSelectArrowUpKeyNavigation,
    removeSelectArrowDownKeyNavigation, removeSelectArrowUpKeyNavigation
} from "@utils/key_navigation";


class Hierarchy extends Component{
    constructor(props) {
        super(props);
    }

    componentDidMount(){
        addSelectArrowDownKeyNavigation(this);
        addSelectArrowUpKeyNavigation(this);
    }

    componentWillUnmount(){
        removeSelectArrowDownKeyNavigation(this);
        removeSelectArrowUpKeyNavigation(this);
    }

    chooseItem(item){
        const {onItemClick, close} = this.props;
        if(typeof onItemClick === 'function') {
            onItemClick(null, item);
            if(typeof close === 'function') {
                close();
            }
        }
    }

    renderItems(){
        const {searchValue, currentItem, selectedItem, items, toggleItem} = this.props;
        return items.map((item, index) => {
            if(item.isDisabled && searchValue.split('>').length > 1){
                return null;
            }
            return(
                <HierarchyItem
                    key={item.uniqueIndex}
                    item={item}
                    isCurrentItem={currentItem ? item.index === currentItem.index : false}
                    isSelectedItem={selectedItem ? item.index === selectedItem.index : false}
                    nextItem={index < items.length ? items[index + 1] : null}
                    toggleItem={toggleItem}
                    chooseItem={(a) => this.chooseItem(a)}
                />
            );
        });
    }

    render(){
        const {close} = this.props;
        return(
            <div className={styles.hierarchy}>
                <TooltipFontIcon size={16} tooltip={'Close search'} value={'close'} className={styles.close} onClick={close}/>
                {this.renderItems()}
            </div>
        );
    }
}

Hierarchy.propTypes = {
    searchValue: PropTypes.string,
    onItemClick: PropTypes.func,
    close: PropTypes.func,
    toggleItem: PropTypes.func.isRequired,
};

Hierarchy.defaultProps = {
    searchValue: '',
    onItemClick: null,
    close: null,
    selectedItem: null,
};

export default Hierarchy;