

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

import Input from "../Input";
import Hierarchy from "./Hierarchy";
import styles from '@themes/default/general/basic_components.scss';
import CConnectorItem from "@classes/components/content/connection/CConnectorItem";
import {setFocusById, sortByIndex} from "@utils/app";
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";



class InputHierarchy extends Component{
    constructor(props) {
        super(props);
        const {hierarchy} = this.props;
        let items = this.sortItems(hierarchy);

        this.state = {
            hierarchy: CConnectorItem.createConnectorItem(hierarchy),
            isVisibleHierarchy: false,
            searchValue: '',
            inputClassName: '',
            searchClassName: '',
            searchStyles: {},
            hierarchyStyle: {},
            searchLabel: '',
            selectedItemKey: 0,
            selectedItem: items.length > 0 ? items[0] : null,
            currentItems: hierarchy,
        };
    }

    componentDidUpdate(prevProps){
        if(!(this.state.currentItems instanceof CConnectorItem) || prevProps.hierarchy.methods.length !== this.props.hierarchy.methods.length
        || prevProps.hierarchy.operators.length !== this.props.hierarchy.operators.length) {
            const hierarchy = CConnectorItem.createConnectorItem(this.props.hierarchy);
            let items = this.sortItems(hierarchy);
            this.setState({
                selectedItem: items.length > 0 ? items[0] : null,
                hierarchy,
                currentItems: hierarchy,
            });
        }
    }

    toggleItem(item, value){
        if(item instanceof COperatorItem) {
            let {currentItems} = this.state;
            currentItems.toggleByItem(item, value);
            this.setState({currentItems});
        }
    }

    sortItems(items = []){
        if(items.length === 0 && this.state) {
            items = this.state.currentItems;
        }
        let sortedItems = [];
        for(let i = 0; i < items.methods.length; i++){
            sortedItems.push(items.methods[i]);
        }
        for(let i = 0; i < items.operators.length; i++){
            sortedItems.push(items.operators[i]);
        }
        return sortByIndex(sortedItems);
    }

    filterToggledItems(){
        let items = this.sortItems();
        let filteredItems = [];
        for(let i = 0; i < items.length; i++){
            if(!items[i].isToggled){
                filteredItems.push(items[i]);
            }
        }
        return filteredItems;
    }

    handleChange(searchValue){
        const {hierarchy} = this.state;
        hierarchy.filterByNameOrType(searchValue);
        this.setState({
            hierarchy,
            searchValue,
        });
    }

    onKeyDown(e) {
        const {selectedItem} = this.state;
        switch (e.keyCode) {
            case 13:
                e.preventDefault();
                this.onItemClick();
                break;
            case 27:
                e.preventDefault();
                this.hideHierarchy();
                break;
            case 37:
            case 39:
                e.preventDefault();
                this.toggleItem(selectedItem, !selectedItem.isMinimized);
                break;
            case 38:
                e.preventDefault();
                this.selectPrevItem();
                break;
            case 40:
                e.preventDefault();
                this.selectNextItem();
                break;
        }
    }

    onItemClick(){
        const {selectedItem} = this.state;
        const {onItemClick} = this.props;
        if(selectedItem) {
            this.hideHierarchy();
            onItemClick(null, selectedItem);
        }
    }

    selectPrevItem(){
        const {selectedItemKey} = this.state;
        let items = this.filterToggledItems();
        if(selectedItemKey > 0) {
            this.setState({
                selectedItemKey: selectedItemKey - 1,
                selectedItem: items[selectedItemKey - 1],
            });
        }
    }

    selectNextItem(){
        const {selectedItemKey} = this.state;
        let items = this.filterToggledItems();
        if(selectedItemKey < items.length - 1) {
            this.setState({
                selectedItemKey: selectedItemKey + 1,
                selectedItem: items[selectedItemKey + 1],
            });
        }
    }

    showHierarchy(){
        const {onAppear} = this.props;
        if(typeof onAppear === 'function') {
            this.props.onAppear();
        }
        this.setState({isVisibleHierarchy: true, searchLabel: 'Type method name or operator'});
    }

    hideHierarchy(){
        const {onDisappear} = this.props;
        const that = this;
        if(typeof onDisappear === 'function') {
            this.props.onDisappear();
        }
        this.setState({
            isVisibleHierarchy: false,
            inputClassName: styles.input_disappear,
            searchStyles: {right: '5px'},
            searchClassName: styles.search_icon_appear,
            searchLabel: '',
        });
        setTimeout(() => {
            that.setState({
                hierarchyStyle: {zIndex: 0},
                },);
            }, 700);
    }

    showSearch(){
        const {id} = this.props;
        const inputHierarchyWidth = document.getElementById(`${id}_parent`).offsetWidth;
        this.setState({inputClassName: styles.input_appear, searchStyles: {right: `${inputHierarchyWidth - 15}px`}, searchClassName: styles.search_icon_disappear, hierarchyStyle: {zIndex: 100}});
        setTimeout(() => {this.showHierarchy(); setFocusById(id);}, 700);
    }

    render(){
        const {hierarchy, inputClassName, searchStyles, searchClassName, hierarchyStyle, searchValue, isVisibleHierarchy, searchLabel, selectedItem} = this.state;
        const {currentItem, id} = this.props;
        let isNotEmpty = hierarchy.methods.length !== 0 || hierarchy.operators.length !== 0;
        const searchDisable = hierarchy.operators.length === 0 && hierarchy.methods.length === 0;
        return(
            <div className={styles.input_hierarchy} style={hierarchyStyle} id={`${id}_parent`}>
                <Input
                    disabled={inputClassName === styles.input_disappear || inputClassName === ''}
                    onChange={(a) => this.handleChange(a)}
                    onKeyDown={(a) => this.onKeyDown(a)}
                    name={id}
                    id={id}
                    label={searchLabel}
                    type={'text'}
                    value={searchValue}
                    theme={{input: `${styles.input} ${inputClassName}`, inputElement: styles.input_element}}
                />
                <TooltipFontIcon isButton={!searchDisable} tooltip={'Search'} value={'search'} style={searchStyles} className={`${styles.search_icon} ${searchClassName} ${searchDisable ? styles.search_icon_disabled : ''}`} onClick={searchDisable ? null : () => this.showSearch()}/>
                {
                    isVisibleHierarchy && isNotEmpty
                    ?
                        <Hierarchy
                            selectedItem={selectedItem}
                            searchValue={searchValue}
                            close={() => this.hideHierarchy()}
                            onItemClick={(a, b, c) => this.props.onItemClick(a, b, c)}
                            currentItem={currentItem}
                            toggleItem={(a, b) => this.toggleItem(a, b)}
                            items={this.sortItems()}
                        />
                    :
                        null
                }
            </div>
        );
    }
}

InputHierarchy.propTypes = {
    hierarchy: PropTypes.object.isRequired,
    onAppear: PropTypes.func,
    onDisappear: PropTypes.func,
    onItemClick: PropTypes.func.isRequired,
};

InputHierarchy.defaultProps = {
    onAppear: null,
    onDisappear: null,
    id: '',
};

export default InputHierarchy;