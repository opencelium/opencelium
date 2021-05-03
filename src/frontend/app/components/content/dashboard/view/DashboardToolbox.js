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

import React from 'react';
import styles from '@themes/default/content/dashboard/dashboard.scss';
import TooltipFontIcon from "@basic_components/tooltips/TooltipFontIcon";

const ToolboxItem = (props) => {
    const {onTakeItem, item} = props;
    return (
        <div
            className={styles.dashboard_toolbox_item}
            onClick={(e) => onTakeItem(e, item)}
        >
            <TooltipFontIcon size={30} tooltip={item.tooltipTranslationKey} value={item.icon} isButton={true}/>
        </div>
    );
}

class DashboardToolbox extends React.Component{
    constructor(props) {
        super(props);
    }

    render() {
        const {items, onTakeItem} = this.props;
        let toolboxTitle = <span>{'Available Widgets:'}</span>;
        if(items.length === 0){
            toolboxTitle = <span>{'Available Widgets:'} <span style={{fontWeight: 'bold'}}>{'all being used.'}</span></span>;
        }
        return (
            <div className={styles.dashboard_toolbox}>
                <div className={styles.dashboard_toolbox_title}>{toolboxTitle}</div>
                <div className={styles.dashboard_toolbox_items}>
                    {items.map(item => (
                        <ToolboxItem
                            key={item.i}
                            item={item}
                            onTakeItem={(e) => onTakeItem(e, item)}
                        />
                    ))}
                </div>
            </div>
        );
    }
}

export default DashboardToolbox;