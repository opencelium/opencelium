import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { TopBarProps } from './interfaces';
import { TopBarStyled } from './styles';
import NotificationItem from "@organism/top_bar/NotificationItem";
import TooltipButton from "@molecule/tooltip_button/TooltipButton";
import {ColorTheme} from "../../general/Theme";
import {GlobalSearch} from "@organism/top_bar/GlobalSearch";

const TopBar: FC<TopBarProps> =
    ({

    }) => {
    return (
        <TopBarStyled >
            <GlobalSearch/>
            <NotificationItem/>
            <TooltipButton href={'/profile'} size={24} target={`button_my_profile`} tooltip={'My Profile'} icon={'face'} position={'bottom'} color={ColorTheme.Black} hasBackground={false}/>
        </TopBarStyled>
    )
}

TopBar.defaultProps = {
}


export {
    TopBar,
};

export default withTheme(TopBar);