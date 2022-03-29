import React, {FC} from 'react';
import {withTheme} from 'styled-components';
import { LoadingProps } from './interfaces';
import { GridImageLoadingStyled } from './styles';

const GridImageLoading: FC<LoadingProps> =
    ({
         ...props
     }) => {
        return (
            <GridImageLoadingStyled {...props}/>
        )
    }

GridImageLoading.defaultProps = {
}


export {
    GridImageLoading,
};

export default withTheme(GridImageLoading);