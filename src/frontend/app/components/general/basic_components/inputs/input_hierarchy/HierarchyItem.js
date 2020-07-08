import React, {Component} from 'react';
import CMethodItem from "@classes/components/content/connection/method/CMethodItem";
import FontIcon from "../../FontIcon";
import COperatorItem from "@classes/components/content/connection/operator/COperatorItem";
import styles from '@themes/default/general/basic_components.scss';
import TooltipFontIcon from "../../tooltips/TooltipFontIcon";


class HierarchyItem extends Component{
    constructor(props) {
        super(props);
    }

    toggleItem(){
        const {item, toggleItem} = this.props;
        toggleItem(item, !item.isMinimized);
    }

    chooseItem(){
        const {item, chooseItem} = this.props;
        chooseItem(item);
    }

    render(){
        const {item, nextItem, isCurrentItem, isSelectedItem} = this.props;
        if(item.isToggled){
            return null;
        }
        let isMethod = item instanceof CMethodItem;
        let isOperator = item instanceof COperatorItem;
        let name = '';
        let intend = (item.index.split('_').length - 1) * 10;
        let itemStyles = {};
        let itemClassName = styles.item;
        let nameStyles = {};
        if(isMethod){
            name = item.name;
            nameStyles.background = item.color;
            nameStyles.padding = '0 5px';
        }
        if(isOperator){
            name = item.type;
        }
        if(isSelectedItem){
            itemClassName += ` ${styles.selected_item}`;
        }
        if(item.isDisabled){
            itemClassName += ` ${styles.disabled_item}`;
            nameStyles.background = '#8e7575';
        }
        itemStyles.paddingLeft = `${intend}px`;
        return(
            <div style={itemStyles} className={itemClassName}>
                <div style={nameStyles} className={styles.name} onClick={::this.chooseItem}>{name}</div>
                {
                    isOperator && nextItem && nextItem.index.includes(item.index)
                        ?
                        <FontIcon className={styles.arrow} value={item.isMinimized ? 'keyboard_arrow_right' : 'keyboard_arrow_down'} onClick={::this.toggleItem}/>
                        :
                        null
                }
                {
                    isCurrentItem
                    ?
                        <TooltipFontIcon tooltip={'Current Item'} value={'arrow_back'} className={styles.pointer}/>
                    :
                        null
                }
            </div>
        );
    }
}

export default HierarchyItem;