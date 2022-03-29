import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import {DashboardToolboxProps, ToolboxItemsProps} from './interfaces';
import {DashboardToolboxStyled, TitleStyled, ToolboxItemsStyled, ToolboxItemStyled} from './styles';
import Button from "@basic_components/buttons/Button";
import {ColorTheme} from "../../general/Theme";


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