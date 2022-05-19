/*
 *  Copyright (C) <2022>  <becon GmbH>
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

import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import Button from "@basic_components/buttons/Button";
import {ColorTheme} from "@style/Theme";
import {DashboardToolboxProps, ToolboxItemsProps} from './interfaces';
import {DashboardToolboxStyled, TitleStyled, ToolboxItemsStyled, ToolboxItemStyled} from './styles';


const ToolboxItem = (props: ToolboxItemsProps) => {
    const {onTakeItem, item} = props;
    return (
        <ToolboxItemStyled
            onClick={onTakeItem}
        >
            <Button size={30} icon={item.icon} hasBackground={false} color={ColorTheme.Blue}/>
        </ToolboxItemStyled>
    );
}

const DashboardToolbox: FC<DashboardToolboxProps> =
    ({
         items,
         onTakeItem,
    }) => {
    let toolboxTitle = <span>{'Available Widgets:'}</span>;
    if(items.length === 0){
        toolboxTitle = <span>{'Available Widgets:'} <span style={{fontWeight: 'bold'}}>{'all being used.'}</span></span>;
    }
    return (
        <DashboardToolboxStyled >
            <TitleStyled>{toolboxTitle}</TitleStyled>
            <ToolboxItemsStyled>
                {items.map(item => (
                    <ToolboxItem
                        key={item.i}
                        item={item}
                        onTakeItem={() => onTakeItem(item)}
                    />
                ))}
            </ToolboxItemsStyled>
        </DashboardToolboxStyled>
    )
}

DashboardToolbox.defaultProps = {
}


export {
    DashboardToolbox,
};

export default withTheme(DashboardToolbox);