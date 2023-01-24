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

import React, {Component} from 'react';
import PropTypes from 'prop-types';
import styles from '@entity/connection/components/themes/default/general/form_methods.scss';
import CConnectorItem, {
    CONNECTOR_DEPTH_LIMIT,
    CONNECTOR_TO
} from "@entity/connection/components/classes/components/content/connection/CConnectorItem";


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
            <button className={styles.item_button} onClick={() => this.selectItem('method')}>
                <span className={classNames.method}>
                    {`M`}
                </span>
            </button>
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
                    <button className={styles.item_button} onClick={() => this.selectItem('operator')}>
                        <span className={classNames.operator}>
                            {`O`}
                        </span>
                    </button>
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