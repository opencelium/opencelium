import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { CardProps } from './interfaces';
import { CardStyled } from './styles';

const Card: FC<CardProps> =
    ({
        children,
        ...props
    }) => {
    return (
        <CardStyled {...props}>
            {children}
        </CardStyled>
    )
}

Card.defaultProps = {
    isVisible: true,
    isButton: false,
}


export {
    Card,
};

export default withTheme(Card);