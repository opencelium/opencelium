import React, {FC, useState} from 'react';
import {Dropdown, DropdownToggle} from 'reactstrap';
import {withTheme} from 'styled-components';
import {GridViewMenuProps, TypesProps} from './interfaces';
import {DropdownMenuStyled, TypesStyled} from './styles';
import {ColorTheme} from "../../general/Theme";
import Button from "../../atoms/button/Button";
import Icon from "../../atoms/icon/Icon";
import {ViewType} from "@organism/collection_view/CollectionView";


const Types = (props: TypesProps) => {
    let icons = [];
    for(let i = 0; i < props.number * 2; i++){
        icons.push(<Icon key={i} name={'margin'} size={10} color={'#a5a5a5'}/>);
    }
    return(
        <TypesStyled onClick={() => props.setType(props.number)}>
            <span>
                {props.number}
            </span>
            <span style={{display: 'grid', gridTemplateColumns: `repeat(${props.number}, max-content)`}}>
                {icons}
            </span>
        </TypesStyled>
    )
}

export type GridViewType = 2 | 3 | 4 | 5;

const GridViewMenu: FC<GridViewMenuProps> =
    ({
        setGridViewType,
        setViewType,
        viewType,
        setIsRefreshing,
    }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const setType = (gridViewType: GridViewType) => {
        if(viewType === ViewType.GRID){
            setIsRefreshing(true);
            setTimeout(() => {
                setViewType(ViewType.GRID);
                setGridViewType(gridViewType);
                setIsRefreshing(false);
            }, 300);
        } else{
            setViewType(ViewType.GRID);
            setGridViewType(gridViewType);
        }
    }
    return(
        <Dropdown isOpen={isMenuOpen} toggle={() => setIsMenuOpen(!isMenuOpen)} style={{display: 'inline-block'}}>
            <DropdownToggle
                tag="span"
                data-toggle="dropdown"
                aria-expanded={isMenuOpen}
            >
                <Button icon={'grid_view'} size={24} hasBackground={false} color={ColorTheme.Turquoise} handleClick={() => {}}/>
            </DropdownToggle>
            <DropdownMenuStyled>
                <Types setType={setType} number={2}/>
                <Types setType={setType} number={3}/>
                <Types setType={setType} number={4}/>
                <Types setType={setType} number={5}/>
            </DropdownMenuStyled>
        </Dropdown>
    );
}

GridViewMenu.defaultProps = {
}


export {
    GridViewMenu,
};

export default withTheme(GridViewMenu);