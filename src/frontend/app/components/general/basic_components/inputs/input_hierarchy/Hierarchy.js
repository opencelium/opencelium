import React, {Component} from 'react';
import PropTypes from 'prop-types';
import HierarchyItem from "./HierarchyItem";
import styles from '../../../../../themes/default/general/basic_components.scss';
import CConnectorItem, {OPERATOR_ITEM} from "../../../../../classes/components/content/connection/CConnectorItem";
import {sortByIndex} from "../../../../../utils/app";
import FontIcon from "../../FontIcon";


class Hierarchy extends Component{
    constructor(props) {
        super(props);

        this.state = {
            currentItems: props.hierarchy,
        };
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

    renderItems(){
        const {currentItems} = this.state;
        const {searchValue} = this.props;
        let items = [];
        for(let i = 0; i < currentItems.methods.length; i++){
            items.push(currentItems.methods[i]);
        }
        for(let i = 0; i < currentItems.operators.length; i++){
            items.push(currentItems.operators[i]);
        }
        items = sortByIndex(items);
        return items.map((item, index) => {
            if(item.isDisabled && searchValue.split('>').length > 1){
                return null;
            }
            return(
                <HierarchyItem key={item.uniqueIndex} item={item} nextItem={index < items.length ? items[index + 1] : null} toggleItem={::this.toggleItem} chooseItem={::this.chooseItem}/>
            );
        });
    }

    render(){
        const {close} = this.props;
        return(
            <div className={styles.hierarchy}>
                <FontIcon value={'close'} className={styles.close} onClick={close}/>
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
};

export default Hierarchy;