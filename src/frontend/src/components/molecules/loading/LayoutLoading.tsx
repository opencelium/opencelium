import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { LoadingProps } from './interfaces';
import { LayoutLoadingStyled } from './styles';

const LayoutLoading: FC<LoadingProps> =
    ({
        ...props
    }) => {
    return (
        <LayoutLoadingStyled {...props}/>
    )
}

LayoutLoading.defaultProps = {
}


export {
    LayoutLoading,
};

export default withTheme(LayoutLoading);