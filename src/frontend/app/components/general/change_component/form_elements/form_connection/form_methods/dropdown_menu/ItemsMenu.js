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
import PropTypes from 'prop-types';
import styles from '@themes/default/general/form_methods.scss';
import CConnectorItem, {
    CONNECTOR_DEPTH_LIMIT,
    CONNECTOR_TO
} from "@classes/components/content/connection/CConnectorItem";


/**
 * ItemsMenu Component
 */
class ItemsMenu extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to select item
     */
    selectItem(value){
        const {onSelectItemType} = this.props;
        onSelectItemType(value);
    }

    renderMethod(){
        const {itemType} = this.props;
        let classNames = {};
        classNames.method = styles.item_menu_method;
        classNames[itemType] += ` ${styles.item_menu_selected}`;
        return (
            <span onClick={() => ::this.selectItem('method')} className={classNames.method}>
                {`M`}
            </span>
        );
    }

    renderOperator(){
        const {connector, itemType} = this.props;
        let classNames = {};
        let depth = 0;
        let currentItem = connector.getCurrentItem();
        if(currentItem){
            depth = connector.getCurrentItem().getDepth();
        }
        classNames.operator = styles.item_menu_operator;
        classNames[itemType] += ` ${styles.item_menu_selected}`;
        if(depth <= CONNECTOR_DEPTH_LIMIT) {
            if (connector.getConnectorType() === CONNECTOR_TO || connector.methods.length > 0) {
                return (
                    <span onClick={() => ::this.selectItem('operator')} className={classNames.operator}>
                        {`O`}
                    </span>
                );
            }
        }
        return null;
    }

    render(){
        let isInitial = false;
        if(isInitial){
            return null;
        }
        return (
            <div className={styles.items_menu}>
                {this.renderMethod()}
                {this.renderOperator()}
            </div>
        );
    }
}

ItemsMenu.propTypes = {
    onSelectItemType: PropTypes.func.isRequired,
    itemType: PropTypes.string,
    connector: PropTypes.instanceOf(CConnectorItem).isRequired,
};

ItemsMenu.defaultProps = {
    itemType: 'method',
};

export default ItemsMenu;