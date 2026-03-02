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

import React, {FC, useState} from 'react';
import {withTheme} from 'styled-components';
import Button from "@basic_components/buttons/Button";
import {ColorTheme} from "@style/Theme";
import {DashboardToolboxProps, ToolboxItemsProps} from './interfaces';
import {DashboardToolboxStyled, TitleStyled, ToolboxItemsStyled, ToolboxItemStyled} from './styles';
import Tour from "@app_component/base/tour/Tour";
import {Step} from "react-joyride";
import {WidgetTourSteps} from "@entity/dashboard/utils/tourSteps";
import DefaultText from "@app_component/base/text/DefaultText";
import {EmptyListStyled} from "@app_component/collection/styles";


const ToolboxItem = (props: ToolboxItemsProps) => {
    const {onTakeItem, item} = props;
    console.log(item)
    return (
        <ToolboxItemStyled
            id={`widget-${item.i}`}
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
    const [startTour, toggleTour] = useState<boolean>(false);
    let toolboxTitle = null;
    if(items.length === 0){
        toolboxTitle = <DefaultText value={`All widgets are used.`}/>;
    }
    return (
        <DashboardToolboxStyled  style={{position: 'relative'}}>
            {toolboxTitle && <TitleStyled>
                {toolboxTitle}
            </TitleStyled>}
            <React.Fragment>
                <Tour steps={WidgetTourSteps} toggle={toggleTour} show={startTour}/>
                <Button
                    position={'absolute'}
                    right={5}
                    top={'5px'}
                    hasBackground={false}
                    icon={'info'}
                    color={ColorTheme.Blue}
                    handleClick={() => toggleTour(true)}
                />
            </React.Fragment>
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
