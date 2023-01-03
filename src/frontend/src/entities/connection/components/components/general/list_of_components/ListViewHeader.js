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

import React from 'react';
import PropTypes from "prop-types";
import Checkbox from "@entity/connection/components/components/general/basic_components/inputs/Checkbox";
import styles from "@entity/connection/components/themes/default/content/schedules/schedules";
import TooltipFontIcon from "@entity/connection/components/components/general/basic_components/tooltips/TooltipFontIcon";

class ListViewHeader extends React.Component{
    constructor(props) {
        super(props);
    }

    onCheckAll(){
        this.props.onCheckAll(this.props.setChecks);
    }

    render(){
        const {header, allChecked, sortType, toggleSortType, readOnly} = this.props;
        const sortTooltip = sortType === 'asc' ? 'Asc' : 'Desc';
        const sortValue = sortType === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
        const isCheckboxesVisible = !readOnly;
        const isActionsVisible = !readOnly;
        return(
            <thead>
                <tr>
                    {isCheckboxesVisible &&
                        <th style={{width: '50px'}}>
                            <Checkbox
                                id='input_check_all'
                                checked={allChecked}
                                onChange={() => this.onCheckAll()}
                                labelClassName={styles.checkbox_label}
                                inputClassName={styles.checkbox_field}
                            />
                        </th>
                    }
                    {header.map(item => {
                        const hasNoColumn = item.value === 'id' || item.visible === false;
                        let style = item.hasOwnProperty('style') ? {...item.style} : null;
                        if(item.width){
                            if(!style){
                                style = {};
                            }
                            style.width = item.width;
                        }
                        return hasNoColumn ? null :
                            <th key={item.value} style={style}
                                title={item.label}>
                                {item.label}
                                {(item.value === 'name' || item.value === 'title') && <TooltipFontIcon isButton={true} blueTheme tooltip={sortTooltip} value={sortValue} onClick={toggleSortType}/>}
                            </th>
                    })}
                    {isActionsVisible &&
                        <th>Actions</th>
                    }
                </tr>
            </thead>
        );
    }
}

ListViewHeader.propTypes = {
    header: PropTypes.array.isRequired,
    readOnly: PropTypes.bool,
}

ListViewHeader.defaulProps = {
    readOnly: false,
}

export default ListViewHeader;