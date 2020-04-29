import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HierarchyItem from "./HierarchyItem";
import styles from '../../../../../themes/default/general/basic_components.scss';
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";
import {
    addSelectArrowDownKeyNavigation,
    addSelectArrowUpKeyNavigation,
    removeSelectArrowDownKeyNavigation, removeSelectArrowUpKeyNavigation
} from "../../../../../utils/key_navigation";


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