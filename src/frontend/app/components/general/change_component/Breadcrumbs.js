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

import styles from '@themes/default/general/change_component.scss';
import {formatHtmlId, getThemeClass} from "@utils/app";
import FontIcon from "@basic_components/FontIcon";


/**
 * Component to display Breadcrumbs
 */
class Breadcrumbs extends Component{

    constructor(props){
        super(props);
    }

    /**
     * to open page
     */
    openPage(page){
        const {exactPage} = this.props;
        exactPage(page);
    }

    generateTextItem(item, key){
        const {items, page, authUser} = this.props;
        let classNames = ['breadcrumbs_item_text_active', 'breadcrumbs_item_text'];
        classNames = getThemeClass({classNames, authUser, styles});
        let itemStyle = styles[classNames.breadcrumbs_item_text_active];
        let onClickItem = () => ::this.openPage(key);
        if(page === key){
            itemStyle = styles[classNames.breadcrumbs_item_text];
            onClickItem = null;
        }
        let id = formatHtmlId(`breadcrumb_${item}`);
        if(key < items.length - 1){
            return (
                <span>
                    {
                        onClickItem === null
                        ?
                            <span id={id} className={itemStyle}>{item}</span>
                        :
                            <button className={styles.clear_button} onClick={onClickItem}>
                                <span id={id} className={itemStyle}>{item}</span>
                            </button>
                    }
                    <FontIcon value={'keyboard_arrow_right'} style={{fontSize: '17px'}}/>
                </span>
            );
        }
        return (
            <span
                id={id}
                className={itemStyle}
                onClick={onClickItem}
            >
                {item}
            </span>
        );
    }

    render(){
        const {items, page, authUser} = this.props;
        let classNames = ['breadcrumbs'];
        classNames = getThemeClass({classNames, authUser, styles});
        if(items.length === 0){
            return null;
        }
        return (
            <div className={styles[classNames.breadcrumbs]}>
                <ul>
                    {items.map((item, key) => {
                        if(key > page)
                            return null;
                        return(
                            <li key={key}>
                                {this.generateTextItem(item, key)}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
}

Breadcrumbs.propTypes = {
    authUser: PropTypes.object.isRequired,
    items: PropTypes.array,
    page: PropTypes.number,
};

Breadcrumbs.defaultProps = {
    items: [],
    page: 0,
};


export default Breadcrumbs;