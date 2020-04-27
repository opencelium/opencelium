import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HierarchyItem from "./HierarchyItem";
import styles from '../../../../../themes/default/general/basic_components.scss';
import CConnectorItem from "../../../../../classes/components/content/connection/CConnectorItem";
import {sortByIndex} from "../../../../../utils/app";
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";
import {
    addSelectArrowDownKeyNavigation,
    addSelectArrowUpKeyNavigation,
    removeSelectArrowDownKeyNavigation, removeSelectArrowUpKeyNavigation
} from "../../../../../utils/key_navigation";


class Hierarchy extends Component{
    constructor(props) {
        super(props);
        let allItems = this.sortItems(props.hierarchy);
        this.state = {
            currentItems: props.hierarchy,
        };
    }

    componentDidMount(){
        addSelectArrowDownKeyNavigation(this);
        addSelectArrowUpKeyNavigation(this);
    }

    componentDidUpdate(prevProps){
        const {selectedItemKey, setKey, setItem, selectedItem} = this.props;
        let items = this.sortItems();
        if(selectedItemKey < 0){
            setKey(0);
        }
        if(selectedItemKey >= items.length){
            setKey(items.length - 1);
        }
        if(selectedItemKey >= 0 && selectedItemKey < items.length){
            if(prevProps.selectedItem === null || selectedItem === null || prevProps.selectedItemKey !== selectedItemKey) {
                setItem(items[selectedItemKey]);
            }
        }
    }

    componentWillUnmount(){
        removeSelectArrowDownKeyNavigation(this);
        removeSelectArrowUpKeyNavigation(this);
    }

    toggleItem(item, value){
        let {currentItems} = this.state;
        currentItems.toggleByItem(item, value);
        this.setState({currentItems});
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

    renderItems(){
        const {searchValue, currentItem, selectedItem} = this.props;
        let items = ::this.sortItems();
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
                    toggleItem={::this.toggleItem}
                    chooseItem={::this.chooseItem}
                />
            );
        });
    }

    render(){
        const {close} = this.props;
        return(
            <div className={styles.hierarchy}>
                <TooltipFontIcon tooltip={'Close search'} value={'close'} className={styles.close} onClick={close}/>
                {::this.renderItems()}
            </div>
        );
    }
}

Hierarchy.propTypes = {
    hierarchy: PropTypes.instanceOf(CConnectorItem).isRequired,
    searchValue: PropTypes.string,
    onItemClick: PropTypes.func,
    close: PropTypes.func,
};

Hierarchy.defaultProps = {
    searchValue: '',
    onItemClick: null,
    close: null,
    selectedItem: null,
};

export default Hierarchy;